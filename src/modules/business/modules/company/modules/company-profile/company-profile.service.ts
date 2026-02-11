import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';

import { User } from '../../../user/entities/user.entity';
import { Company } from '../../entities/company.entity';
import { CompanyAddress } from '../../modules/company-address/entities/company-address.entity';
import { CompanyBooking } from './entities/company-booking.entity';
import { Media } from '../../../../../common/modules/media/media.entity';
import { UpdateBusinessRequestDto } from '../../dto/update-business-request.dto';
import { CompanyAddressDto, CompanyDto, GetBusinessDto } from '../../dto/get-company-profile.dto';

@Injectable()
export class CompanyProfileService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyAddress)
    private readonly companyAddressRepository: Repository<CompanyAddress>,
    @InjectRepository(CompanyBooking)
    private readonly companyBookingRepository: Repository<CompanyBooking>,
    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,
    private readonly dataSource: DataSource,
  ) {}

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: {
        company: {
          address: true,
          booking: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.company) {
      throw new NotFoundException('Company not found for this user');
    }

    let booking = user.company.booking;
    if (!booking) {
      booking = await this.ensureCompanyBooking(user.company);
      user.company.booking = booking;
    }

    const logo = await user.company.getLogo?.();
    const company = { ...user.company, address: undefined, logo: logo?.url, booking };
    const address = user.company.address ? { ...user.company.address } : null;

    return plainToInstance(
      GetBusinessDto,
      {
        company: plainToInstance(CompanyDto, company, {
          excludeExtraneousValues: true,
        }),
        address: address
          ? plainToInstance(CompanyAddressDto, address, {
            excludeExtraneousValues: true,
          })
          : null,
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  async updateProfile(
    dto: UpdateBusinessRequestDto,
    userId: string,
  ): Promise<{ company: CompanyDto; address: CompanyAddressDto | null }> {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);
      const companyRepository = tx.getRepository(Company);
      const companyAddressRepository = tx.getRepository(CompanyAddress);
      const companyBookingRepository = tx.getRepository(CompanyBooking);

      const user = await userRepository.findOne({
        where: { id: userId },
        relations: {
          company: {
            address: true,
            booking: true,
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (!user.company) {
        throw new NotFoundException('Company not found for this user');
      }

      const company = user.company;
      let booking = company.booking;

      if (dto.company) {
        const {
          business_name,
          country,
          timezone,
          phone,
          email,
          currency,
          logo,
          booking: bookingDto,
        } = dto.company;

        if (business_name !== undefined) {
          company.business_name = business_name;
        }
        if (country !== undefined) {
          company.country = country;
        }
        if (timezone !== undefined) {
          company.timezone = timezone;
        }
        if (phone !== undefined && phone !== company.phone) {
          if (phone) {
            const existingPhoneCompany = await companyRepository.findOne({
              where: { phone },
            });
            if (existingPhoneCompany && existingPhoneCompany.id !== company.id) {
              throw new ConflictException('Company phone number is already in use');
            }
          }
          company.phone = phone;
        }
        if (email !== undefined && email !== company.email) {
          if (email) {
            const existingEmailCompany = await companyRepository.findOne({
              where: { email },
            });
            if (existingEmailCompany && existingEmailCompany.id !== company.id) {
              throw new ConflictException('Company email is already in use');
            }
          }
          company.email = email;
        }
        if (currency !== undefined) {
          company.currency = currency;
        }
        if (logo) {
          await this.changeCompanyLogo(company, logo);
        }

        if (bookingDto) {
          if (!booking) {
            booking = await this.ensureCompanyBooking(company, companyBookingRepository);
          }

          if (bookingDto.subdomain !== undefined) {
            const subdomain = this.normalizeSubdomain(bookingDto.subdomain);
            if (subdomain) {
              await this.ensureBookingSlugUnique(
                companyBookingRepository,
                companyRepository,
                subdomain,
                company.id,
              );
            }
            booking.subdomain = subdomain || null;
            company.subdomain = subdomain || null;
          }

          if (bookingDto.custom_subdomain !== undefined) {
            const customSubdomain = this.normalizeSubdomain(bookingDto.custom_subdomain);
            if (customSubdomain) {
              await this.ensureBookingSlugUnique(
                companyBookingRepository,
                companyRepository,
                customSubdomain,
                company.id,
              );
            }
            booking.custom_subdomain = customSubdomain || null;
          }
        }

        await companyRepository.save(company);
        if (booking) {
          await companyBookingRepository.save(booking);
        }
      }

      if (dto.address) {
        const { line1, line2, city, state, postal_code, country } = dto.address;

        let address = company.address;

        if (!address) {
          address = companyAddressRepository.create({
            company_id: company.id,
            line1,
            line2,
            city,
            state,
            postal_code,
            country: country || 'US',
          });
        } else {
          if (line1 !== undefined) {
            address.line1 = line1;
          }
          if (line2 !== undefined) {
            address.line2 = line2;
          }
          if (city !== undefined) {
            address.city = city;
          }
          if (state !== undefined) {
            address.state = state;
          }
          if (postal_code !== undefined) {
            address.postal_code = postal_code;
          }
          if (country !== undefined) {
            address.country = country;
          }
        }

        await companyAddressRepository.save(address);
      }

      const updated = await companyRepository.findOne({
        where: { id: company.id },
        relations: {
          address: true,
          booking: true,
        },
      });
      if (updated && !updated.booking) {
        updated.booking = await this.ensureCompanyBooking(updated, companyBookingRepository);
      }
      const logo = updated ? await updated.getLogo?.() : null;

      const responseCompany = updated
        ? plainToInstance(CompanyDto, { ...updated, address: undefined, logo: logo?.url }, {
          excludeExtraneousValues: true,
        })
        : null;
      const responseAddress = updated?.address
        ? plainToInstance(CompanyAddressDto, updated.address, {
          excludeExtraneousValues: true,
        })
        : null;

      return {
        company: responseCompany,
        address: responseAddress,
      };
    });
  }

  private normalizeSubdomain(value: string): string {
    return value?.trim().toLowerCase();
  }

  private async ensureBookingSlugUnique(
    bookingRepository: Repository<CompanyBooking>,
    companyRepository: Repository<Company>,
    value: string,
    companyId: string,
  ) {
    const existing = await bookingRepository.findOne({
      where: [
        { subdomain: value },
        { custom_subdomain: value },
      ],
    });
    if (existing && existing.company_id !== companyId) {
      throw new ConflictException('Booking subdomain is already in use');
    }
    const existingCompany = await companyRepository.findOne({
      where: { subdomain: value },
    });
    if (existingCompany && existingCompany.id !== companyId) {
      throw new ConflictException('Booking subdomain is already in use');
    }
  }

  private async ensureCompanyBooking(
    company: Company,
    bookingRepository: Repository<CompanyBooking> = this.companyBookingRepository,
  ) {
    let booking = await bookingRepository.findOne({
      where: { company_id: company.id },
    });
    if (!booking) {
      booking = bookingRepository.create({
        company_id: company.id,
        subdomain: company.subdomain ?? null,
        custom_subdomain: null,
      });
      booking = await bookingRepository.save(booking);
    }
    return booking;
  }

  private async changeCompanyLogo(company: Company, profile_picture: string) {
    const owner_id = company.id;
    const owner_type = 'Company';

    const media = await this.mediaRepository.createQueryBuilder('media')
      .where('media.filename = \'' + profile_picture + '\'')
      .orWhere('media.url = \'' + profile_picture + '\'')
      .orWhere('media.file_path = \'' + profile_picture + '\'')
      .getOne();

    media.owner_id = String(owner_id);
    media.owner_type = owner_type;

    return await this.mediaRepository.save(media);
  }
}
