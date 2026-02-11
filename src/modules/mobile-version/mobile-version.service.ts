import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MobileVersion } from './entities/mobile-version.entity';
import { CreateMobileVersionDto } from './dto/create-mobile-version.dto';
import { UpdateMobileVersionDto } from './dto/update-mobile-version.dto';

function semverCompare(a: string, b: string): number {
  if (a === b) return 0;
  const pa = a.split('.').map(s => parseInt(s, 10) || 0);
  const pb = b.split('.').map(s => parseInt(s, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

@Injectable()
export class MobileVersionService {
  constructor(
    @InjectRepository(MobileVersion)
    private readonly mobileVersionRepository: Repository<MobileVersion>,
  ) {
  }

  async create(dto: CreateMobileVersionDto) {
    const exists = await this.mobileVersionRepository.findOne({ where: { version: dto.version } });
    if (exists) {
      throw new BadRequestException('Version already exists');
    }

    const entity = this.mobileVersionRepository.create({
      version: dto.version,
      release_at: new Date(dto.release_at),
      is_force: !!dto.is_force,
      notes: dto.notes ?? null,
    });
    return this.mobileVersionRepository.save(entity);
  }

  async findAll() {
    return this.mobileVersionRepository.find({ order: { release_at: 'DESC' } });
  }

  async findOne(id: string) {
    const v = await this.mobileVersionRepository.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Mobile version not found');
    return v;
  }

  async update(id: string, dto: UpdateMobileVersionDto) {
    const v = await this.findOne(id);
    if (dto.version !== undefined) v.version = dto.version;
    if (dto.release_at !== undefined) v.release_at = new Date(dto.release_at);
    if (dto.is_force !== undefined) v.is_force = dto.is_force;
    if (dto.notes !== undefined) v.notes = dto.notes;
    return this.mobileVersionRepository.save(v);
  }

  async remove(id: string) {
    const v = await this.findOne(id);
    await this.mobileVersionRepository.remove(v);
    return { deleted: true };
  }

  async getLatestAndNewer(currentVersion?: string) {
    const all = await this.mobileVersionRepository.find({ order: { release_at: 'ASC' } }); // ASC for easier filtering by dates
    if (!all || all.length === 0) {
      return { latest: null, newer: [] };
    }

    const latestByDate = all[all.length - 1];

    let newer: MobileVersion[] = [];

    if (!currentVersion) {
      newer = all.slice();
    } else {
      const matched = all.find(v => v.version === currentVersion);

      if (matched) {
        newer = all.filter(v => v.release_at.getTime() > matched.release_at.getTime());
      } else {
        newer = all.filter(v => semverCompare(v.version, currentVersion) > 0);
      }
    }

    const anyForce = newer.some(v => v.is_force);

    const latest = {
      id: latestByDate.id,
      version: latestByDate.version,
      release_at: latestByDate.release_at,
      is_force: anyForce ? true : latestByDate.is_force,
      notes: latestByDate.notes ?? null,
    };

    const newerList = newer
      .sort((a, b) => a.release_at.getTime() - b.release_at.getTime())
      .map(v => ({
        id: v.id,
        version: v.version,
        release_at: v.release_at,
        is_force: v.is_force,
        notes: v.notes ?? null,
      }));

    return { latest, newer: newerList };
  }
}
