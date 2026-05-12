import KeyvRedis from '@keyv/redis';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import appConfig from '../../configs/app.config';

@Module({
  imports: [
    CacheModule.registerAsync({
      inject: [appConfig.KEY],
      useFactory: async (config: ConfigType<typeof appConfig>) => {
        return {
          stores: [new KeyvRedis(config.cache.url)],
          ttl: 3600, // 1 hour default TTL
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class CacheManagerModule {}
