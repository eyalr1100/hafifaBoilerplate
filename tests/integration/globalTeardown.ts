// tests/integration/globalTeardown.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '@src/product/models/product';
import { createDataSourceOptions, resetConnectionSingleton } from '../../src/common/db/connection';
import { getConfig, initConfig } from '../../src/common/config';
import { DbConfig } from '../../src/common/interfaces';

export default async (): Promise<void> => {
  let dataSource: DataSource | undefined;

  try {
    await initConfig(true);
    const config = getConfig();
    const dbConfig = config.get('db') as DbConfig;

    dataSource = new DataSource(createDataSourceOptions(dbConfig));
    await dataSource.initialize();

    const productRepository = dataSource.getRepository(Product);
    await productRepository.clear();
  } catch (error) {
    console.error('Error in globalTeardown:', error);
  } finally {
    // Ensure connection is properly destroyed
    if (dataSource?.isInitialized === true) {
      try {
        await dataSource.destroy();
      } catch (error) {
        console.error('Error destroying dataSource in globalTeardown:', error);
      }
    }

    // Reset the singleton to ensure clean state
    resetConnectionSingleton();
  }
};
