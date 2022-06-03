
import 'dotenv/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

const { TYPEORM_USERNAME, TYPEORM_PASSWORD, TYPEORM_HOST } = process.env;

export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  username: TYPEORM_USERNAME,
  password: TYPEORM_PASSWORD,
  port: 5432,
  host: TYPEORM_HOST,
  database: "db",
  autoLoadEntities: true,
  logging: true,
  entities: ['dist/**/*.entity{ .ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  migrationsRun: true,
  //cli: {
  //  entitiesDir: 'src/**/*.entity{ .ts,.js}',
  //  migrationsDir: 'src/migrations',
  //},
};

module.exports = typeOrmConfig;
