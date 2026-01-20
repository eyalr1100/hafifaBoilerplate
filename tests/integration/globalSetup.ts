// tests/integration/globalSetup.ts
import 'reflect-metadata';
import { initConfig } from '../../src/common/config';

export default async (): Promise<void> => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Initialize config for all tests
  await initConfig(true); // offline mode for tests

  // Ensure all async operations are tracked
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};
