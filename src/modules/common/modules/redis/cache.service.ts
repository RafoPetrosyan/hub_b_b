import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {
  }

  async setCache(key: string, value: string, ttl: number): Promise<void> {
    await this.redisClient.set(key, value, 'EX', ttl);
  }

  async getCache(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async deleteCache(key: string): Promise<void> {
    await this.redisClient.del(key);
  }
}
