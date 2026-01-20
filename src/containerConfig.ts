import { getOtelMixin } from '@map-colonies/telemetry';
import { trace } from '@opentelemetry/api';
import { Registry } from 'prom-client';
import { DependencyContainer } from 'tsyringe/dist/typings/types';
import jsLogger, { Logger } from '@map-colonies/js-logger';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { DataSource, Repository } from 'typeorm';
import { instancePerContainerCachingFactory } from 'tsyringe';
import { addTransactionalDataSource, initializeTransactionalContext, StorageDriver } from 'typeorm-transactional';
import { InjectionObject, registerDependencies } from '@common/dependencyRegistration';
import { ON_SIGNAL, SERVICES, SERVICE_NAME } from '@common/constants';
import { getTracing } from '@common/tracing';
import { productRouterFactory, PRODUCT_ROUTER_SYMBOL } from './product/routes/productRouter';
import { type ConfigType, getConfig } from './common/config';
import { Product, PRODUCT_REPOSITORY_SYMBOL } from './product/models/product';
import { DATA_SOURCE_PROVIDER, dataSourceFactory } from './common/db/connection';

export interface RegisterOptions {
  override?: InjectionObject<unknown>[];
  useChild?: boolean;
}

export const registerExternalValues = async (options?: RegisterOptions): Promise<DependencyContainer> => {
  const cleanupRegistry = new CleanupRegistry();
  const configInstance = getConfig();

  const tracer = trace.getTracer(SERVICE_NAME);
  const metricsRegistry = new Registry();
  configInstance.initializeMetrics(metricsRegistry);

  const dependencies: InjectionObject<unknown>[] = [
    { token: SERVICES.CONFIG, provider: { useValue: getConfig() } },
    {
      token: SERVICES.LOGGER,
      provider: {
        useFactory: instancePerContainerCachingFactory((container) => {
          const config = container.resolve<ConfigType>(SERVICES.CONFIG);
          const loggerConfig = config.get('telemetry.logger');
          const logger = jsLogger({ ...loggerConfig, mixin: getOtelMixin() });
          return logger;
        }),
      },
      postInjectionHook: (deps: DependencyContainer): void => {
        const logger = deps.resolve<Logger>(SERVICES.LOGGER);
        // Register logger cleanup to flush any pending writes
        cleanupRegistry.register({
          id: 'logger-cleanup',
          func: async () => {
            // Pino logger flush
            if (typeof logger.flush === 'function') {
              await new Promise<void>((resolve) => {
                logger.flush(() => resolve());
              });
            }
          },
        });
      },
    },
    { token: SERVICES.TRACER, provider: { useValue: tracer } },
    { token: SERVICES.METRICS, provider: { useValue: metricsRegistry } },
    { token: PRODUCT_ROUTER_SYMBOL, provider: { useFactory: productRouterFactory } },
    {
      token: 'onSignal',
      provider: {
        useValue: async (): Promise<void> => {
          await getTracing().stop();
        },
      },
    },
    {
      token: PRODUCT_REPOSITORY_SYMBOL,
      provider: {
        useFactory(container): Repository<Product> {
          const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
          return dataSource.getRepository(Product);
        },
      },
    },
    {
      token: DATA_SOURCE_PROVIDER,
      provider: {
        useFactory: instancePerContainerCachingFactory(dataSourceFactory),
      },
      postInjectionHook: async (deps: DependencyContainer): Promise<void> => {
        const dataSource = deps.resolve<DataSource>(DATA_SOURCE_PROVIDER);
        if (!dataSource.isInitialized) {
          await dataSource.initialize();

          // Only use transactional in non-test environments
          if (process.env.NODE_ENV !== 'test') {
            initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });
            addTransactionalDataSource(dataSource);
          }

          cleanupRegistry.register({ id: DATA_SOURCE_PROVIDER, func: dataSource.destroy.bind(dataSource) });
        }
      },
    },
    {
      token: SERVICES.CLEANUP_REGISTRY,
      provider: { useValue: cleanupRegistry },
      postInjectionHook(container): void {
        const logger = container.resolve<Logger>(SERVICES.LOGGER);
        const cleanupRegistryLogger = logger.child({ subComponent: 'cleanupRegistry' });

        cleanupRegistry.on('itemFailed', (id, error, msg) => cleanupRegistryLogger.error({ msg, itemId: id, err: error }));
        cleanupRegistry.on('itemCompleted', (id) => cleanupRegistryLogger.info({ itemId: id, msg: 'cleanup finished for item' }));
        cleanupRegistry.on('finished', (status) => cleanupRegistryLogger.info({ msg: `cleanup registry finished cleanup`, status }));
      },
    },
    {
      token: ON_SIGNAL,
      provider: {
        useValue: cleanupRegistry.trigger.bind(cleanupRegistry),
      },
    },
  ];

  return Promise.resolve(registerDependencies(dependencies, options?.override, options?.useChild));
};
