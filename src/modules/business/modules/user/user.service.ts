import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { User } from './entities/user.entity';
import { GetCurrentUserDto } from './dto/get-current-user.dto';
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
      ...plainToClass(GetCurrentUserDto, user, { excludeExtraneousValues: true }),
      profile_picture: profile_picture ? await this.uploadService.getFileUrl(profile_picture) : null,
      company_subdomain: user.company.subdomain,
    };
  }
}
