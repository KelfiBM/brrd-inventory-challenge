import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './configs/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { CacheManagerModule } from './modules/cache-manager/cache-manager.module';
import { EventStreamingModule } from './modules/event-streaming/event-streaming.module';
import { ProductsModule } from './modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [appConfig.KEY],
      useFactory: (config: ConfigType<typeof appConfig>) => ({
        type: 'postgres',
        host: config.database.postgres.host,
        port: config.database.postgres.port,
        username: config.database.postgres.username,
        password: config.database.postgres.password,
        database: config.database.postgres.database,
        entities: [],
        synchronize: config.database.postgres.synchronize,
      }),
    }),
    CacheManagerModule,
    ProductsModule,
    EventStreamingModule,
    AuthModule,
  ],
})
export class AppModule {}
