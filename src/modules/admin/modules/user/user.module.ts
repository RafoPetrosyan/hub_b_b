import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserModule as BaseUserModule } from '../../../business/modules/user/user.module';

@Module({
  imports: [BaseUserModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {
}
