import { Global, Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from '../media/media.entity';
import { ConfigModule } from '@nestjs/config';
import { UploadSessionService } from './upload-session.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Media]), ConfigModule],
  controllers: [UploadController],
  providers: [UploadService, UploadSessionService],
  exports: [UploadService, UploadSessionService, TypeOrmModule],
})
export class UploadModule {
}
