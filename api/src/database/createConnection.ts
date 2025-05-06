import { createConnection, Connection } from 'typeorm';
import 'dotenv/config';
import * as entities from 'entities';

const config = {
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: Object.values(entities),
  synchronize: true,
  extra: {
    connectionTimeoutMillis: 30000, // 30 seconds
  },
};


console.log('DB Config:', config);

const createDatabaseConnection = (): Promise<Connection> =>
  createConnection(config);

export default createDatabaseConnection;
