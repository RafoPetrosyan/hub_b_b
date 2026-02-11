import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Media } from '../media/media.entity';
import { DeleteObjectCommand, GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as sharp from 'sharp';
import { randomUUID } from 'crypto';
import { UploadSessionService } from './upload-session.service';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { UserRole } from '../../../auth';

const unlinkAsync = promisify(fs.unlink);
const statAsync = promisify(fs.stat);
const readFileAsync = promisify(fs.readFile);

/**
 * Upload Service
 *
 * Handles file uploads to local storage (development) or Amazon S3 (production).
 *
 * Required Environment Variables:
 *
 * For Development:
 * - NODE_ENV=development (or any value other than 'production')
 * - BASE_URL=http://localhost:3000 (base URL for local file access)
 * - UPLOAD_LOCAL_PATH=./public/uploads (optional, defaults to ./public/uploads)
 *
 * For Production:
 * - NODE_ENV=production
 * - AWS_REGION=us-east-1 (AWS region where S3 bucket is located)
 * - AWS_ACCESS_KEY_ID=your-aws-access-key-id (AWS access key)
 * - AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key (AWS secret key)
 * - S3_BUCKET=your-s3-bucket-name (S3 bucket name for file storage)
 * - BASE_URL=https://your-domain.com (base URL for the application)
 */
@Injectable()
export class UploadService {
  private readonly env: string;
  private readonly baseUrl: string;
  private readonly uploadLocalPath: string;
  private readonly s3Client?: S3Client;
  private readonly s3Bucket?: string;
  private readonly awsRegion?: string;
  private readonly logger = new Logger(UploadService.name);
  private allowedMimeMap = {
    image: [/^image\//],
    video: [/^video\//],
    pdf: [/^application\/pdf$/],
  };

  constructor(
    private config: ConfigService,
    @InjectRepository(Media)
    private mediaRepo: Repository<Media>,
    private readonly sessionService: UploadSessionService,
    private dataSource: DataSource,
  ) {
    this.env = this.config.get('NODE_ENV') || 'development';
    this.baseUrl = this.config.get('BASE_URL') || 'http://localhost:3000';
    this.uploadLocalPath = this.config.get('UPLOAD_LOCAL_PATH') || path.join(process.cwd(), 'public', 'uploads');

    // Ensure base upload directory exists
    if (this.env !== 'production') {
      fs.promises.mkdir(this.uploadLocalPath, { recursive: true }).catch((err) => {
        this.logger.error(`Failed to create upload directory: ${this.uploadLocalPath}`, err);
      });
    }

    if (this.env === 'production') {
      const region = this.config.get('AWS_REGION');
      const accessKey = this.config.get('AWS_ACCESS_KEY_ID');
      const secret = this.config.get('AWS_SECRET_ACCESS_KEY');
      this.s3Bucket = this.config.get('S3_BUCKET');
      this.awsRegion = region;

      if (!region || !accessKey || !secret || !this.s3Bucket) {
        throw new Error('S3 env variables missing for production. Required: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET');
      }

      this.s3Client = new S3Client([{
        region,
        credentials: {
          accessKeyId: accessKey,
          secretAccessKey: secret,
        },
      }]);
    }
  }

  buildMulterOptions(type: string, req: any) {
    const multer = require('multer');
    const allowed = this.allowedMimeMap[type];
    if (!allowed) {
      throw new BadRequestException(`Unsupported upload type "${type}"`);
    }

    const fileFilter = (req, file, cb) => {
      const mimetype: string = file.mimetype;
      const ok = allowed.some((rx) => rx.test(mimetype));
      if (!ok) {
        return cb(new BadRequestException('Invalid file type for endpoint'), false);
      }
      cb(null, true);
    };

    const uploadContext = this.resolveUploadContext(req);
    const localRelativePath = this.generateFilePath(type, req, undefined, uploadContext);
    const dest = path.join(this.uploadLocalPath, localRelativePath);
    const storage = multer.diskStorage({
      destination: async (req, file, cb) => {
        try {
          await fs.promises.mkdir(dest, { recursive: true });
          cb(null, dest);
        } catch (e) {
          cb(e, dest);
        }
      },
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || this.extFromMime(file.mimetype) || '';
        const name = `${Date.now()}-${randomUUID()}${ext}`;
        cb(null, name);
      },
    });

    return {
      storage,
      fileFilter,
      limits: { fileSize: this.getMaxFileSizeFor(type) },
    };
  }

  async handleFileUpload(file: Express.Multer.File, type: string, req: any, uploadSessionId?: string) {
    if (!file) throw new BadRequestException('File missing');
    const uploadContext = this.resolveUploadContext(req);
    if (uploadContext.isCompanyLogo && !uploadContext.companyId) {
      throw new BadRequestException('Company required to upload company logo');
    }
    const savedFilename = file.filename;
    const localRelativePath = this.generateFilePath(type, req, savedFilename, uploadContext);

    // Multer's diskStorage sets file.path to the full path where the file was saved
    let savedPath = file.path;
    if (!savedPath) {
      throw new InternalServerErrorException('File path not found after upload');
    }
    const expectedPath = path.join(this.uploadLocalPath, localRelativePath);
    if (savedPath !== expectedPath) {
      await fs.promises.mkdir(path.dirname(expectedPath), { recursive: true });
      await fs.promises.rename(savedPath, expectedPath);
      savedPath = expectedPath;
    }

    if (uploadSessionId) {
      this.sessionService.emit(uploadSessionId, {
        phase: 'received_server',
        filename: savedFilename,
        path: localRelativePath,
      });
    }

    let metadata: any = { mime: file.mimetype };
    if (file.mimetype.startsWith('image/')) {
      try {
        const buffer = await readFileAsync(savedPath);
        const imgMeta = await sharp(buffer).metadata();
        metadata.width = imgMeta.width;
        metadata.height = imgMeta.height;
        metadata.format = imgMeta.format;
      } catch (e) {
      }
    }

    let sizeBytes = file.size;
    if (!sizeBytes) {
      try {
        const st = await statAsync(savedPath);
        sizeBytes = st.size;
      } catch (e) {
        sizeBytes = 0;
      }
    }
    const sizeKB = Math.round((sizeBytes || 0) / 1024);

    let finalUrl: string;
    let s3Key: string | null = null;
    const existingCompanyLogo =
      uploadContext.isCompanyLogo && uploadContext.companyId
        ? await this.mediaRepo.findOne({
          where: {
            owner_type: 'Company',
            owner_id: String(uploadContext.companyId),
            collection: 'company_logo',
          },
        })
        : null;

    if (this.env === 'production') {
      if (!this.s3Client || !this.s3Bucket) {
        await safeUnlink(savedPath);
        throw new InternalServerErrorException('S3 not configured');
      }

      if (uploadSessionId) {
        this.sessionService.emit(uploadSessionId, { phase: 'uploading_to_s3', filename: savedFilename });
      }

      // Use the same path structure as local files (users/{ownerId}/{type}/{filename} or companies/{companyId}/{type}/{filename})
      s3Key = localRelativePath;
      const fileStream = fs.createReadStream(savedPath);

      // Use lib-storage Upload for multipart + progress events
      const parallelUploads3 = new Upload({
        client: this.s3Client,
        params: {
          Bucket: this.s3Bucket,
          Key: s3Key,
          Body: fileStream,
          ContentType: file.mimetype,
        },
        queueSize: 4, // concurrency
        partSize: 5 * 1024 * 1024, // 5MB part size
      });

      parallelUploads3.on('httpUploadProgress', (progress) => {
        // progress: { loaded, total }
        if (uploadSessionId) {
          this.sessionService.emit(uploadSessionId, {
            phase: 's3_upload_progress',
            loaded: progress.loaded,
            total: progress.total ?? sizeBytes,
            percent: progress.total ? Math.round((progress.loaded / progress.total) * 100) : null,
          });
        }
      });

      try {
        await parallelUploads3.done();
        finalUrl = `https://${this.s3Bucket}.s3.${this.config.get('AWS_REGION')}.amazonaws.com/${s3Key}`;
        await safeUnlink(savedPath);
        if (uploadSessionId) {
          this.sessionService.emit(uploadSessionId, { phase: 's3_done', s3Key, url: finalUrl });
        }
        finalUrl = null;
      } catch (e) {
        await safeUnlink(savedPath);
        throw new InternalServerErrorException('Failed to upload to S3');
      }
    } else {
      finalUrl = `${this.baseUrl.replace(/\/$/, '')}/public/uploads/${localRelativePath}`;
    }

    const mediaEntity: Partial<Media> = {
      filename: path.basename(s3Key || savedFilename),
      file_path: s3Key ?? localRelativePath,
      url: finalUrl,
      owner_id: uploadContext.ownerId ?? null,
      owner_type: uploadContext.ownerType ?? undefined,
      uploaded_by: uploadContext.uploaderId ?? undefined,
      collection: uploadContext.collection,
      file_format: type,
      file_size_kb: sizeKB,
      metadata_json: metadata,
      created_at: new Date(),
    };

    try {
      const result = await this.dataSource.manager.transaction(async (manager) => {
        return await manager.getRepository(Media).save(mediaEntity);
      });

      if (uploadSessionId) {
        this.sessionService.emit(uploadSessionId, { phase: 'done', mediaId: result.id, url: finalUrl });
      }

      const response = {
        url: finalUrl,
        filename: mediaEntity.filename,
        file_format: type,
        file_size_kb: sizeKB,
        metadata,
        mediaId: result.id,
      };
      if (existingCompanyLogo && existingCompanyLogo.id !== result.id) {
        try {
          await this.removeMediaEntity(existingCompanyLogo);
        } catch (e) {
          this.logger.warn(`Failed to delete previous company logo: ${existingCompanyLogo.id}`);
        }
      }

      return response;
    } catch (dbErr) {
      if (this.env === 'production' && s3Key && this.s3Client && this.s3Bucket) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.s3Bucket, Key: s3Key }));
        } catch (e) {
          this.logger.warn(`Failed to delete S3 key after DB error: ${s3Key}`);
        }
      } else {
        try {
          await safeUnlink(savedPath);
        } catch (e) {
        }
      }

      if (uploadSessionId) {
        this.sessionService.emit(uploadSessionId, { phase: 'error', message: 'DB save failed, uploaded file removed' });
      }

      throw new InternalServerErrorException('Failed to save media record');
    }
  }

  async deleteFile(type: string, filename: string, req: any) {
    const media = await this.mediaRepo.findOne({ where: { filename, file_format: type } });
    if (!media) throw new BadRequestException('File not found');

    const allowedRoles = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BUSINESS_ADMIN];
    const isOwner = req?.userId && media.owner_id === req?.userId;
    const hasRole = req?.userRole && allowedRoles.includes(req?.userRole);

    if (media.owner_type === 'Company') {
      const isCompanyAdmin =
        req?.userRole === UserRole.BUSINESS_ADMIN &&
        req?.userCompany &&
        String(req?.userCompany) === String(media.owner_id);
      const isPrivileged = req?.userRole && [UserRole.SUPER_ADMIN, UserRole.ADMIN].includes(req?.userRole);
      if (!isCompanyAdmin && !isPrivileged) {
        throw new ForbiddenException('Not allowed to delete this file');
      }
    } else {
      if (!isOwner && !hasRole) throw new ForbiddenException('Not allowed to delete this file');
    }

    await this.removeMediaEntity(media);
    return true;
  }

  /**
   * Get the public URL for a media file
   *
   * In production: Returns S3 URL (either from media.url or constructs from S3 bucket and file_path)
   * In development: Returns local file URL (either from media.url or constructs from BASE_URL and file_path)
   *
   * @param media - The Media entity containing file information
   * @returns The public URL to access the file
   * @throws InternalServerErrorException if required configuration or file path is missing
   */
  async getFileUrl(media: Media): Promise<string> {
    if (this.env === 'production') {
      // In production, files are stored in S3
      // If URL is already stored, use it; otherwise construct from S3 bucket and key
      if (media.url) {
        return media.url;
      }

      if (!this.s3Bucket || !this.awsRegion || !media.file_path) {
        throw new InternalServerErrorException(
          'S3 configuration or file path missing. Required: S3_BUCKET, AWS_REGION, and media.file_path',
        );
      }

      const command = new GetObjectCommand({
        Bucket: this.s3Bucket,
        Key: media.file_path,
      });

      return await getSignedUrl(this.s3Client, command, { expiresIn: 120 }); // Expires in 2 minutes
    } else {
      // In development, files are stored locally
      if (media.url) {
        return media.url;
      }

      if (!media.file_path) {
        throw new InternalServerErrorException('File path missing from media entity');
      }

      return `${this.baseUrl.replace(/\/$/, '')}/uploads/${media.file_path}`;
    }
  }

  private extFromMime(mime: string) {
    if (mime.startsWith('image/')) {
      if (mime === 'image/jpeg') return '.jpg';
      if (mime === 'image/png') return '.png';
      if (mime === 'image/webp') return '.webp';
      if (mime === 'image/gif') return '.gif';
    }
    if (mime.startsWith('video/')) {
      if (mime === 'video/mp4') return '.mp4';
      if (mime === 'video/webm') return '.webm';
    }
    if (mime === 'application/pdf') return '.pdf';
    return '';
  }

  private getMaxFileSizeFor(type: string) {
    switch (type) {
      case 'image':
        return 10 * 1024 * 1024;
      case 'video':
        return 200 * 1024 * 1024;
      case 'pdf':
        return 20 * 1024 * 1024;
      default:
        return 20 * 1024 * 1024;
    }
  }

  private generateFilePath(
    type: string,
    req: any,
    fileName?: string,
    context?: {
      ownerType?: string | null;
      ownerId?: string | null;
      companyId?: string | null;
      isCompanyLogo?: boolean;
    },
  ) {
    const ownerType = context?.ownerType ?? null;
    const ownerId = context?.ownerId ?? (req.userId ? String(req.userId) : null);
    const companyId = context?.companyId ?? (req.userCompany ? String(req.userCompany) : null);

    let path = `${type}`;

    if (ownerType === 'Company') {
      if (companyId) {
        path = `companies/${companyId}/` + path;
      }
    } else {
      if (ownerId) {
        path = `users/${ownerId}/` + path;
      }
      if (companyId) {
        path = `companies/${companyId}/` + path;
      }
    }

    if (fileName) {
      path = path + `/${fileName}`;
    }

    return path;
  }

  private resolveUploadContext(req: any): {
    uploaderId: string | null;
    companyId: string | null;
    ownerId: string | null;
    ownerType: 'Company' | 'User' | null;
    collection: string;
    isCompanyLogo: boolean;
  } {
    const uploaderId = req.userId ? String(req.userId) : null;
    const companyId = req.userCompany ? String(req.userCompany) : null;
    const collectionInput = this.readRequestString(req, ['collection', 'x-media-collection', 'x-collection']);
    const isCompanyLogo = collectionInput === 'company_logo';
    const ownerType: 'Company' | 'User' | null =
      isCompanyLogo ? 'Company' : (uploaderId ? 'User' : null);
    const ownerId = isCompanyLogo ? (companyId ? String(companyId) : null) : (uploaderId ? String(uploaderId) : null);
    return {
      uploaderId,
      companyId,
      ownerId,
      ownerType,
      collection: isCompanyLogo ? 'company_logo' : (collectionInput ?? 'default'),
      isCompanyLogo,
    };
  }

  private readRequestString(req: any, keys: string[]): string | null {
    for (const key of keys) {
      const bodyValue = req?.body?.[key];
      if (typeof bodyValue === 'string' && bodyValue.trim()) {
        return bodyValue.trim();
      }
      const queryValue = req?.query?.[key];
      if (typeof queryValue === 'string' && queryValue.trim()) {
        return queryValue.trim();
      }
      const headerKey = key.toLowerCase();
      const headerValue = req?.headers?.[headerKey];
      if (typeof headerValue === 'string' && headerValue.trim()) {
        return headerValue.trim();
      }
    }
    return null;
  }

  private async removeMediaEntity(media: Media) {
    if (this.env === 'production' && this.s3Client && this.s3Bucket) {
      if (media.file_path) {
        try {
          await this.s3Client.send(new DeleteObjectCommand({ Bucket: this.s3Bucket, Key: media.file_path }));
        } catch (e) {
          this.logger.warn(`Failed to delete S3 file: ${media.file_path}`);
        }
      }
    } else {
      if (media.file_path) {
        const filePath = path.join(this.uploadLocalPath, media.file_path);
        try {
          await unlinkAsync(filePath);
        } catch (e) {
          this.logger.warn(`Failed to delete local file: ${filePath}`);
        }
      }
    }

    await this.mediaRepo.remove(media);
  }
}

async function safeUnlink(p: string) {
  try {
    await unlinkAsync(p);
  } catch (e) {
  }
}
