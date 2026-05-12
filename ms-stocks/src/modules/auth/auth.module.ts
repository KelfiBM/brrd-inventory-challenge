import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import appConfig from '../../configs/app.config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [appConfig.KEY],
      useFactory: async (config: ConfigType<typeof appConfig>) => ({
        secret: config.auth.jwtSecret,
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [],
  providers: [],
  exports: [JwtModule],
})
export class AuthModule {}
