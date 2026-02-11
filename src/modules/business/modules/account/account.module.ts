import { Module } from '@nestjs/common';
import { AccountService } from './account.service';
import { UserModule } from '../user/user.module';
import { AccountController } from './account.controller';
import { UploadModule } from '../../../common/modules/upload/upload.module';
import { AuthModule } from '../../../auth/auth.module';
import { VerificationCodeModule } from '../verification-code/verification-code.module';

@Module({
  imports: [UserModule, UploadModule, AuthModule, VerificationCodeModule],
  providers: [AccountService],
  controllers: [AccountController],
  exports: [AccountService],
})
export class AccountModule {
}
