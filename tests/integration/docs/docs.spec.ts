import jsLogger from '@map-colonies/js-logger';
import { trace } from '@opentelemetry/api';
import httpStatusCodes from 'http-status-codes';
import { DependencyContainer } from 'tsyringe';
import { Application } from 'express';
import { DataSource } from 'typeorm';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { getApp } from '@src/app';
import { SERVICES } from '@src/common/constants';
import { initConfig } from '@src/common/config';
import { DATA_SOURCE_PROVIDER } from '@src/common/db/connection';
import { DocsRequestSender } from './helpers/docsRequestSender';

describe('docs', function () {
  let requestSender: DocsRequestSender;
  let app: Application;
  let container: DependencyContainer;

  beforeAll(async function () {
    await initConfig(true);
  });

  beforeEach(async function () {
    const mockDataSource = {
      isInitialized: false,
      getRepository: jest.fn(),
    } as unknown as DataSource;

    const [initializedApp, initializedContainer] = await getApp({
      override: [
        { token: SERVICES.LOGGER, provider: { useValue: jsLogger({ enabled: false }) } },
        { token: SERVICES.TRACER, provider: { useValue: trace.getTracer('testTracer') } },
        { token: DATA_SOURCE_PROVIDER, provider: { useValue: mockDataSource } },
      ],
      useChild: true,
    });
    app = initializedApp;
    container = initializedContainer;
    requestSender = new DocsRequestSender(app);
  });

  describe('Happy Path', function () {
    it('should return 200 status code and the resource', async function () {
      const response = await requestSender.getDocs();

      expect(response.status).toBe(httpStatusCodes.OK);
      expect(response.type).toBe('text/html');
    });

    it('should return 200 status code and the json spec', async function () {
      const response = await requestSender.getDocsJson();

      expect(response.status).toBe(httpStatusCodes.OK);

      expect(response.type).toBe('application/json');
      expect(response.body).toHaveProperty('openapi');
    });
  });
});
