// this import must be called before the first import of tsyringe
import 'reflect-metadata';
import { createServer } from 'http';
import { createTerminus } from '@godaddy/terminus';
import { Logger } from '@map-colonies/js-logger';
import { DependencyContainer } from 'tsyringe';
import { ON_SIGNAL, SERVICES } from '@common/constants';
import { ConfigType } from '@common/config';
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
    });
  })
  .catch(async (error: Error) => {
    // ESLint rules are giving mutually exclusive advices here
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (depContainer !== undefined && depContainer.isRegistered(SERVICES.LOGGER)) {
      const logger = depContainer.resolve<Logger>(SERVICES.LOGGER);
      logger.error({ msg: '😢 - failed initializing the server', err: error });
    } else {
      console.error('😢 - failed initializing the server', error);
    }

    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (depContainer !== undefined && depContainer.isRegistered(ON_SIGNAL)) {
      await depContainer.resolve<() => Promise<void>>(ON_SIGNAL)();
    }

    process.exit(1);
  });
