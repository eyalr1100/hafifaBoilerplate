import { DependencyContainer } from 'tsyringe';
import httpStatusCodes from 'http-status-codes';
import { Application } from 'express';
import { trace } from '@opentelemetry/api';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { Registry } from 'prom-client'; // Add this
import { SERVICES } from '@src/common/constants';
import { getApp } from '@src/app';
import { ConfigType, getConfig, initConfig } from '@src/common/config';
import { IPolygon, IProductCreate } from '@src/product/models/interface';
import { ProductRequestSender } from './helpers/requestSender';

describe('product', function () {
  let productRequestSender: ProductRequestSender;
  let app: Application;
  let container: DependencyContainer;
  let configInstance: ConfigType;

  beforeAll(async function () {
    await initConfig(true);
    configInstance = getConfig();

    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configInstance },
        },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
    });

    app = initializedApp;
    container = initializedContainer;
    productRequestSender = new ProductRequestSender(app);
  });

  beforeEach(function () {
    jest.resetAllMocks();
  });

  afterAll(async function () {
    try {
      const registry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);
      await registry.trigger();

      // Stop tracing
      const onSignal = container.resolve<() => Promise<void>>('onSignal');
      await onSignal();

      // Clean up metrics registry
      const metricsRegistry = container.resolve<Registry>(SERVICES.METRICS);
      metricsRegistry.clear();

      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Cleanup error:', error);
    } finally {
      container.reset();
    }
  });

  describe('POST /products', () => {
    describe('success cases', () => {
      it('creates a product and makes it searchable by name', async () => {
        const payload: IProductCreate = {
          name: 'Satellite Imagery Layer',
          description: 'High resolution raster imagery',
          boundingPolygon: {
            type: 'Polygon',
            coordinates: [
              [
                [30, 10],
                [40, 40],
                [20, 40],
                [10, 20],
                [30, 10],
              ],
            ],
          } as IPolygon,
          consumtionLink: 'https://example.com/wmts',
          type: 'raster' as const,
          protocol: 'WMTS' as const,
          resolutionBest: 0.25,
          minZoom: 8,
          maxZoom: 18,
        };

        const createRes = await productRequestSender.postProduct(payload);
        expect(createRes.status).toBe(httpStatusCodes.CREATED);
      });
    });
  });
});
