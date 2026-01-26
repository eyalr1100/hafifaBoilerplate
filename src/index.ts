import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { DependencyContainer } from 'tsyringe';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext, StorageDriver, addTransactionalDataSource } from 'typeorm-transactional';
import { HEALTHCHECK, ON_SIGNAL, SERVICES } from '@common/constants';
import { ConfigType } from '@common/config';
import { DATA_SOURCE_PROVIDER } from '@common/db/connection';
import { getApp } from './app';

let depContainer: DependencyContainer | undefined;

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = config.get('server.port');

    depContainer = container;

    const server = createTerminus(createServer(app), {
      healthChecks: { '/liveness': depContainer.resolve(HEALTHCHECK) },
      onSignal: container.resolve<() => Promise<void>>(ON_SIGNAL),
    });

    server.listen(port, () => {
      logger.info(`app started on port ${port}`);

      // Initialize database after server is listening (fire and forget)
      void (async (): Promise<void> => {
        try {
          const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
          if (!dataSource.isInitialized) {
            logger.info('Initializing database connection...');
            await dataSource.initialize();
            initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
            addTransactionalDataSource(dataSource);
            logger.info('Database connection initialized');
          }
        } catch (error) {
          logger.error({ msg: 'Failed to initialize database connection', err: error });
          // Server stays up, but database-dependent routes will fail
        }
      })();
    });
  })
  .catch(async (error: Error) => {
    console.error('😢 - failed initializing the server');
    console.error(error);

    if (depContainer?.isRegistered(ON_SIGNAL) == true) {
      const shutDown: () => Promise<void> = depContainer.resolve(ON_SIGNAL);
      await shutDown();
    }

    process.exit(1);
  });
