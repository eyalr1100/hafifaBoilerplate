import 'reflect-metadata';
import jsLogger from '@map-colonies/js-logger';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { trace } from '@opentelemetry/api';
import { getApp } from '../../src/app';
import { SERVICES } from '../../src/common/constants';
import { initConfig } from '../../src/common/config';

export default async (): Promise<void> => {
  await initConfig(true);

  await getApp({
    override: [
      { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
      { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
      { token: SERVICES.CLEANUP_REGISTRY, provider: { useValue: new CleanupRegistry() } },
    ],
    useChild: true,
  });
};
