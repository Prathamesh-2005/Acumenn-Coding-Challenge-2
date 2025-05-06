import 'module-alias/register';
import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import cors from 'cors';

import createDatabaseConnection from 'database/createConnection';
import { addRespondToResponse } from 'middleware/response';
import { authenticateUser } from 'middleware/authentication';
import { handleError } from 'middleware/errors';
import { RouteNotFoundError } from 'errors';

import { attachPublicRoutes, attachPrivateRoutes } from './routes';

const establishDatabaseConnection = async (): Promise<void> => {
  try {
    console.log('Attempting to connect to database...');
    console.log(`Host: ${process.env.DB_HOST}, Port: ${process.env.DB_PORT}, Database: ${process.env.DB_DATABASE}`);
    console.log(`Username: ${process.env.DB_USERNAME}`); // Don't log password
    
    // Add a timeout to the connection attempt
    const connectionPromise = createDatabaseConnection();
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 10 seconds')), 10000);
    });
    
    await Promise.race([connectionPromise, timeoutPromise]);
    console.log('Database connection established successfully!');
  } catch (error) {
    console.error('Failed to connect to database:');
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    } else {
      console.error('Unknown error type:', error);
    }
    throw error;
  }
};

const initializeExpress = (): void => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded());
  app.use(addRespondToResponse);
  
  attachPublicRoutes(app);
  app.use('/', authenticateUser);
  attachPrivateRoutes(app);
  
  app.use((req, _res, next) => next(new RouteNotFoundError(req.originalUrl)));
  app.use(handleError);
  
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
};
const initializeApp = async (): Promise<void> => {
  try {
    await establishDatabaseConnection();
    initializeExpress();
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1); // Exit with error code
  }
};
initializeApp();
