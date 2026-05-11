import { registerAs } from '@nestjs/config';
import Joi from 'joi';

type AppConfig = {
  database: {
    postgres: {
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
      synchronize: boolean;
    };
  };
  clients: {
    eventStreaming: {
      brokers: string[];
      clientId: string;
      consumerGroupId: string;
    };
  };
  cache: {
    url: string;
  };
  auth: {
    jwtSecret: string;
  };
};

export default registerAs('app', (): AppConfig => {
  const appSchema = Joi.object({
    POSTGRES_DB_HOST: Joi.string().required(),
    POSTGRES_DB_PORT: Joi.number().required(),
    POSTGRES_DB_USERNAME: Joi.string().required(),
    POSTGRES_DB_PASSWORD: Joi.string().required(),
    POSTGRES_DB_NAME: Joi.string().required(),
    POSTGRES_DB_SYNCHRONIZE: Joi.boolean().default(false),
    EVENT_STREAMING_BROKERS: Joi.string().required(),
    EVENT_STREAMING_CLIENT_ID: Joi.string().required(),
    EVENT_STREAMING_CONSUMER_GROUP_ID: Joi.string().required(),
    CACHE_URL: Joi.string().required(),
    JWT_SECRET: Joi.string().required(),
  });

  const { error, value: envVars } = appSchema.validate(process.env, {
    allowUnknown: true,
    abortEarly: false,
  });

  if (error) {
    console.error(`Config validation error: ${error.message}`);
    error.details.forEach((detail) => {
      console.error(` - ${detail.message} (at ${detail.path.join('.')})`);
    });
    throw new Error(`Config validation error: ${error.message}`);
  }

  const value: AppConfig = {
    database: {
      postgres: {
        host: envVars.POSTGRES_DB_HOST,
        port: envVars.POSTGRES_DB_PORT,
        username: envVars.POSTGRES_DB_USERNAME,
        password: envVars.POSTGRES_DB_PASSWORD,
        database: envVars.POSTGRES_DB_NAME,
        synchronize: envVars.POSTGRES_DB_SYNCHRONIZE,
      },
    },
    clients: {
      eventStreaming: {
        brokers: envVars.EVENT_STREAMING_BROKERS.split(','),
        clientId: envVars.EVENT_STREAMING_CLIENT_ID,
        consumerGroupId: envVars.EVENT_STREAMING_CONSUMER_GROUP_ID,
      },
    },
    cache: {
      url: envVars.CACHE_URL,
    },
    auth: {
      jwtSecret: envVars.JWT_SECRET,
    },
  };
  return value;
});
