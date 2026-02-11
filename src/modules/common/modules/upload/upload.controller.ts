import { Controller, Delete, Get, HttpException, HttpStatus, Param, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Request, Response } from 'express';
import * as multer from 'multer';
import { UploadSessionService } from './upload-session.service';
import { AuthGuard, RolesGuard } from '../../../auth';
import { UploadResponseDto } from './dto/upload-response.dto';
import { CreateSessionResponseDto } from './dto/create-session-response.dto';

@ApiTags('common upload')
@ApiBearerAuth('JWT-auth')
@Controller('api/upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly sessionService: UploadSessionService,
  ) {
  }

  @Post('session')
  @ApiOperation({
    summary: 'Create upload session',
    description:
      'Creates a new upload session ID for tracking file upload progress. Use this session ID in the X-Upload-Id header when uploading files.',
  })
  @ApiResponse({
    status: 201,
    description: 'Upload session created successfully',
    type: CreateSessionResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  createSession() {
    const id = this.sessionService.createSession();
    return { sessionId: id };
  }

  @Get('progress/:sessionId')
  @ApiOperation({
    summary: 'Get upload progress',
    description:
      'Subscribe to upload progress updates via Server-Sent Events (SSE). The session ID must be provided as a URL parameter.',
  })
  @ApiParam({
    name: 'sessionId',
    description: 'Upload session ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'SSE stream with upload progress updates',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          example: 'data: {"phase":"receiving","bytesReceived":1024,"total":2048,"percent":50}\n\n',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 404,
    description: 'Session not found',
  })
  progress(@Param('sessionId') sessionId: string, @Res() res: Response) {
    this.sessionService.subscribe(sessionId, res);
  }

  @Post(':type')
  @ApiOperation({
    summary: 'Upload a file',
    description:
      'Uploads a file of the specified type (image, video, or pdf). Optionally include X-Upload-Id header for progress tracking.',
  })
  @ApiParam({
    name: 'type',
    description: 'File type category',
    enum: ['image', 'video', 'pdf'],
    example: 'image',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File to upload',
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File to upload. Accepted formats: images (jpeg, png, webp, gif), videos (mp4, webm), or PDF files.',
        },
      },
    },
  })
  @ApiHeader({
    name: 'X-Upload-Id',
    description: 'Optional upload session ID for progress tracking',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiHeader({
    name: 'upload-id',
    description: 'Alternative header name for upload session ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid file type, missing file, or file too large',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 413,
    description: 'Payload too large - File size exceeds limit',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Upload failed',
  })
  async upload(@Param('type') type: string, @Req() req: Request, @Res() res: Response) {
    const uploadSessionId = (req.headers['x-upload-id'] || req.headers['upload-id']) as string | undefined;

    const multerOptions = this.uploadService.buildMulterOptions(type, req);
    const uploader = multer(multerOptions).single('file');

    const contentLength = req.headers['content-length'] ? Number(req.headers['content-length']) : undefined;
    let bytesReceived = 0;
    const onData = (chunk: Buffer) => {
      bytesReceived += chunk.length;
      if (uploadSessionId) {
        this.sessionService.emit(uploadSessionId, {
          phase: 'receiving',
          bytesReceived,
          total: contentLength ?? null,
          percent: contentLength ? Math.round((bytesReceived / contentLength) * 100) : null,
        });
      }
    };

    req.on('data', onData);

    uploader(req, res, async (err) => {
      req.off('data', onData);

      try {
        if (err) throw err;
        const file = (req as any).file;
        if (!file) throw new HttpException('File is required', HttpStatus.BAD_REQUEST);

        const result = await this.uploadService.handleFileUpload(file, type, req, uploadSessionId);

        if (uploadSessionId) {
          this.sessionService.close(uploadSessionId, { status: 'ok', result });
        }

        return res.json(result);
      } catch (e) {
        if (uploadSessionId) {
          this.sessionService.emit(uploadSessionId, { phase: 'error', message: e?.message });
          this.sessionService.close(uploadSessionId, { status: 'error', message: e?.message });
        }
        return res.status(e.status || 500).json({ message: e.message || 'Upload failed' });
      }
    });
  }

  @Delete(':type/:filename')
  @ApiOperation({
    summary: 'Delete a file',
    description:
      'Deletes an uploaded file. Only the file owner or users with Admin/SuperAdmin roles can delete files.',
  })
  @ApiParam({
    name: 'type',
    description: 'File type category',
    enum: ['image', 'video', 'pdf'],
    example: 'image',
  })
  @ApiParam({
    name: 'filename',
    description: 'Filename of the file to delete',
    example: '1234567890-abc123.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'File deleted successfully',
    schema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          example: 'deleted',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - File not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing token',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not allowed to delete this file',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error - Delete failed',
  })
  async deleteFile(
    @Param('type') type: string,
    @Param('filename') filename: string,
    @Req() req: any,
  ) {
    try {
      await this.uploadService.deleteFile(type, filename, req);
      return { status: 'deleted' };
    } catch (e) {
      throw new HttpException(e.message || 'Delete failed', e.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
