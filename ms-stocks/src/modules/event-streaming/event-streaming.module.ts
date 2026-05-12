import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import appConfig from '../../configs/app.config';
import { EVENT_STREAMING_CLIENT } from '../../configs/app.const';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        inject: [appConfig.KEY],
        name: EVENT_STREAMING_CLIENT,
        useFactory: async (config: ConfigType<typeof appConfig>) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              id: config.clients.eventStreaming.clientId,
              brokers: config.clients.eventStreaming.brokers,
            },
            consumer: {
              groupId: config.clients.eventStreaming.consumerGroupId,
            },
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class EventStreamingModule {}
