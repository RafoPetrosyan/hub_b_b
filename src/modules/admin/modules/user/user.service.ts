import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { GetCurrentAdminDto } from './dto/get-current-admin.dto';
import { User } from '../../../business/modules/user/entities/user.entity';
import { UploadService } from '../../../common/modules/upload/upload.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly uploadService: UploadService,
  ) {
  }

  async getCurrent(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: {
        company: true,
      },
    });


    if (!user) {
      throw new NotFoundException('Not Found');
    }

    const profile_picture = await user.getProfilePicture?.();

    return {
      ...plainToClass(GetCurrentAdminDto, user, { excludeExtraneousValues: true }),
      profile_picture: profile_picture ? await this.uploadService.getFileUrl(profile_picture) : null,
    };
  }
}
