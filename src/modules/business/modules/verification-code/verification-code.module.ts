import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VerificationCode } from './entities/verification-code.entity';

@Module({
  imports: [TypeOrmModule.forFeature([VerificationCode])],
  exports: [TypeOrmModule],
})
export class VerificationCodeModule {
}

