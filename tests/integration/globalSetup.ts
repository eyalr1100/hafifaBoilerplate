// tests/integration/globalSetup.ts
import 'reflect-metadata';

export default (): void => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  // Ensure all async operations are tracked
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};
