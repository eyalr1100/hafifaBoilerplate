import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { DependencyContainer } from 'tsyringe';
import { DataSource } from 'typeorm';
import { initializeTransactionalContext, StorageDriver, addTransactionalDataSource } from 'typeorm-transactional';
import { ON_SIGNAL, SERVICES } from '@common/constants';
import { ConfigType } from '@common/config';
import { DATA_SOURCE_PROVIDER } from '@common/db/connection';
import { getApp } from './app';

let depContainer: DependencyContainer | undefined;

void getApp()
  .then(([app, container]) => {
    const logger = container.resolve<Logger>(SERVICES.LOGGER);
    const config = container.resolve<ConfigType>(SERVICES.CONFIG);
    const port = config.get('server.port');

    const stubHealthCheck = async (): Promise<void> => Promise.resolve();
    const server = createTerminus(createServer(app), {
      healthChecks: { '/liveness': stubHealthCheck },
      onSignal: container.resolve<() => Promise<void>>(ON_SIGNAL),
    });

    depContainer = container;

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
    // ESLint rules are giving mutually exclusive advices here!!!
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (depContainer !== undefined && depContainer.isRegistered(SERVICES.LOGGER)) {
      const logger = depContainer.resolve<Logger>(SERVICES.LOGGER);
      logger.error({ msg: '😢 - failed initializing the server', err: error });
    } else {
      console.error('CRITICAL: failed to initialize server - logging system unavailable', error);
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (depContainer !== undefined && depContainer.isRegistered(ON_SIGNAL)) {
      await depContainer.resolve<() => Promise<void>>(ON_SIGNAL)();
    }

    process.exit(1);
  });
