// src/common/middleware/dbCheck.ts
import { RequestHandler } from 'express';
import { injectable, container as globalContainer } from 'tsyringe';
import { DataSource } from 'typeorm';
import { DATA_SOURCE_PROVIDER } from '@common/db/connection';
import { ServiceUnavailableError } from '../errors';

@injectable()
export class DbCheckMiddleware {
  // Don't inject DataSource in constructor!
  public constructor() {}

  public getMiddleware(): RequestHandler {
    return (req, res, next) => {
      // Resolve it lazily when the middleware runs
      const dataSource = globalContainer.resolve<DataSource>(DATA_SOURCE_PROVIDER);

      if (!dataSource.isInitialized) {
        throw new ServiceUnavailableError('Service unavailable - database is initiazling');
      }

      next();
    };
  }
}
