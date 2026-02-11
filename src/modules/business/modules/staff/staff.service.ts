import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository, SelectQueryBuilder } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { User } from '../user/entities/user.entity';
import { GetStaffDto } from './dto/get-staff.dto';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UserRole } from '../../../auth';
import { Location } from '../location/entities/location.entity';

@Injectable()
export class StaffService {
  private readonly ROLE_HIERARCHY: Record<UserRole, number> = {
    [UserRole.SUPER_ADMIN]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.BUSINESS_ADMIN]: 3,
    [UserRole.MANAGER]: 4,
    [UserRole.PROVIDER]: 5,
    [UserRole.USER]: 6,
  };

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Location)
    private readonly locationRepository: Repository<Location>,
    private readonly dataSource: DataSource,
  ) {
  }

  async findAll(req: any, params: { search: string; location_id: string; role: UserRole }) {
    const qb: SelectQueryBuilder<User> = this.baseWhereByCompanyLocation(req.userCompany, req.userLocation, this.userRepository.createQueryBuilder());

    if (params.search) {
      qb.andWhere('LOWER(CONCAT("User"."first_name", \' \', "User"."last_name", \' \', "User"."email")) LIKE :term', { term: `%${params.search.toLowerCase()}%` });
    }

    if (params.location_id) {
      qb.andWhere({ 'location_id': params.location_id });
    }

    if (params.role) {
      qb.andWhere({ 'role': params.role });
    }

    qb.leftJoin('User.location', 'location');
    qb.select(['"User".*', 'location.name']);

    const users = await qb.orderBy('created_at', 'DESC').getRawMany();
    return users.map(user => plainToClass(GetStaffDto, user, { excludeExtraneousValues: true }));
  }

  async findById(id: string, req: any) {
    const where = this.baseWhereByCompanyLocation(req.userCompany, req.userLocation);
    const user = await this.userRepository.findOne({
      where: { ...where, id },
    });
    if (!user) {
      throw new NotFoundException('Staff member not found');
    }

    return plainToClass(GetStaffDto, user, { excludeExtraneousValues: true });
  }

  async createStaff(dto: CreateStaffDto, req: any) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);
      const locationRepository = tx.getRepository(Location);

      const company_id = req.userCompany;
      const currentUserRole = req.userRole as UserRole;
      const currentUserLocation = req.userLocation;

      // Validate role assignment
      if (!this.canAssignRole(currentUserRole, dto.role)) {
        throw new ForbiddenException('You do not have permission to assign this role');
      }

      // Validate location assignment
      let location_id: string | undefined;

      if (dto.location_id) {
        // Verify location belongs to company
        const location = await locationRepository.findOne({
          where: { id: dto.location_id, company_id },
        });

        if (!location) {
          throw new BadRequestException('Location not found or does not belong to your company');
        }

        // MANAGER can only create staff in their own location
        if (currentUserRole === UserRole.MANAGER && dto.location_id !== currentUserLocation) {
          throw new ForbiddenException('Managers can only create staff in their own location');
        }

        location_id = dto.location_id;
      } else {
        // If no location provided, apply restrictions based on role
        if (currentUserRole === UserRole.MANAGER) {
          // Manager must assign to their location
          location_id = currentUserLocation;
        } else if (!this.canManageLocation(dto.role)) {
          // Non-admin roles need a location
          location_id = currentUserLocation;
        }
        // SUPER_ADMIN, ADMIN, BUSINESS_ADMIN can create without location for admin roles
      }

      // Check if email already exists
      const existingUser = await userRepository.findOne({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      const user = userRepository.create({
        first_name: dto.first_name,
        last_name: dto.last_name,
        email: dto.email,
        phone: dto.phone,
        role: dto.role,
        company_id,
        location_id,
        password_hash: '', // Will be set during user activation/registration
      });

      const savedUser = await userRepository.save(user);
      return plainToClass(GetStaffDto, savedUser, { excludeExtraneousValues: true });
    });
  }

  async updateStaff(id: string, dto: UpdateStaffDto, req: any) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);
      const locationRepository = tx.getRepository(Location);

      const existingUser = await userRepository.findOne({
        where: { id, company_id: req.userCompany },
      });

      if (!existingUser) {
        throw new NotFoundException('Staff member not found');
      }

      const currentUserRole = req.userRole as UserRole;
      const currentUserLocation = req.userLocation;

      // Check access: Manager can only update staff in their location
      if (currentUserRole === UserRole.MANAGER && existingUser.location_id !== currentUserLocation) {
        throw new NotFoundException('Staff member not found');
      }

      // Validate role assignment if role is being updated
      if (dto.role !== undefined) {
        if (!this.canAssignRole(currentUserRole, dto.role)) {
          throw new ForbiddenException('You do not have permission to assign this role');
        }
        existingUser.role = dto.role;
      }

      // Handle location update
      if (dto.location_id !== undefined) {
        // Verify location belongs to company
        const location = await locationRepository.findOne({
          where: { id: dto.location_id, company_id: req.userCompany },
        });

        if (!location) {
          throw new BadRequestException('Location not found or does not belong to your company');
        }

        // MANAGER cannot change location
        if (currentUserRole === UserRole.MANAGER) {
          if (dto.location_id !== currentUserLocation) {
            throw new ForbiddenException('Managers cannot change staff location');
          }
        }

        existingUser.location_id = dto.location_id;
      }

      // Update other fields
      if (dto.first_name !== undefined) {
        existingUser.first_name = dto.first_name;
      }
      if (dto.last_name !== undefined) {
        existingUser.last_name = dto.last_name;
      }
      if (dto.email !== undefined) {
        // Check if email already exists (excluding current user)
        const emailUser = await userRepository.findOne({
          where: { email: dto.email },
        });
        if (emailUser && emailUser.id !== id) {
          throw new BadRequestException('User with this email already exists');
        }
        existingUser.email = dto.email;
      }
      if (dto.phone !== undefined) {
        existingUser.phone = dto.phone;
      }

      const updatedUser = await userRepository.save(existingUser);
      return plainToClass(GetStaffDto, updatedUser, { excludeExtraneousValues: true });
    });
  }

  async deleteStaff(id: string, req: any) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);

      const existingUser = await userRepository.findOne({
        where: { id, company_id: req.userCompany },
      });

      if (!existingUser) {
        throw new NotFoundException('Staff member not found');
      }

      const currentUserRole = req.userRole as UserRole;
      const currentUserLocation = req.userLocation;

      // MANAGER can only delete staff in their location
      if (currentUserRole === UserRole.MANAGER && existingUser.location_id !== currentUserLocation) {
        throw new NotFoundException('Staff member not found');
      }

      await userRepository.delete(id);

      return {
        success: true,
      };
    });
  }

  async deleteBatchStaff(ids: string[], req: any) {
    return this.dataSource.transaction(async (tx) => {
      const userRepository = tx.getRepository(User);

      const existingUsers = await userRepository.find({
        where: {
          id: In(ids),
          company_id: req.userCompany,
        },
      });

      if (!existingUsers || existingUsers.length === 0) {
        throw new NotFoundException('Staff members not found');
      }

      const currentUserRole = req.userRole as UserRole;
      const currentUserLocation = req.userLocation;

      const deletableIds: string[] = [];

      for (const user of existingUsers) {
        // MANAGER can only delete staff in their location
        if (currentUserRole === UserRole.MANAGER && user.location_id !== currentUserLocation) {
          continue;
        }
        deletableIds.push(user.id);
      }

      if (deletableIds.length === 0) {
        throw new NotFoundException('No accessible staff members found to delete');
      }

      await userRepository.delete(deletableIds);

      return {
        success: true,
        deleted: deletableIds.length,
      };
    });
  }

  async findCounts(req: any) {
    const qb: SelectQueryBuilder<User> = this.baseWhereByCompanyLocation(req.userCompany, req.userLocation, await this.userRepository.createQueryBuilder('user'));

    const totalCount = await qb.getCount();
    const data: Record<string, number>[] = await qb
      .select('user.role', 'role')
      .addSelect('COUNT(user.id)', 'countByRole')
      .groupBy('user.role')
      .getRawMany();
    const result = {};
    for (const datum of data) {
      result[datum.role as unknown as string] = +datum.countByRole;
    }
    Object.values(UserRole)
      .filter(role => role !== UserRole.ADMIN && role !== UserRole.SUPER_ADMIN && role !== UserRole.USER)
      .map((userRole) => {
        if (!result[userRole]) {
          result[userRole] = 0;
        }
      });
    result['total'] = totalCount;
    return result;
  }

  private canAssignRole(assignerRole: UserRole, targetRole: UserRole): boolean {
    return this.ROLE_HIERARCHY[assignerRole] <= this.ROLE_HIERARCHY[targetRole];
  }

  private canManageLocation(role: UserRole): boolean {
    return role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN || role === UserRole.BUSINESS_ADMIN;
  }

  private baseWhereByCompanyLocation(company_id: string, location_id?: string, qb?: SelectQueryBuilder<User>) {
    if (qb) {
      qb.andWhere({
        'company_id': company_id,
      });

      if (location_id) {
        qb.andWhere({
          'location_id': location_id,
        });
      }

      return qb;
    }

    const where: any = {
      company_id,
    };

    if (location_id) {
      where.location_id = location_id;
    }

    return where;
  }
}
