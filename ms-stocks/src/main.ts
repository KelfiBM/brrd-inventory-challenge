import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: process.env.EVENT_STREAMING_BROKERS?.split(',') ?? ['localhost:9092'],
      },
      consumer: {
        groupId: process.env.EVENT_STREAMING_CONSUMER_GROUP_ID ?? 'ms-stocks-group',
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
