// tests/integration/globalTeardown.ts
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Product } from '@src/product/models/product';
import { createDataSourceOptions } from '../../src/common/db/connection';
import { getConfig, initConfig } from '../../src/common/config';
import { DbConfig } from '../../src/common/interfaces';

export default async (): Promise<void> => {
  try {
    await initConfig(true);
    const config = getConfig();
    const dbConfig = config.get('db') as DbConfig;

    const dataSource = new DataSource(createDataSourceOptions(dbConfig));
    await dataSource.initialize();

    const productRepository = dataSource.getRepository(Product);
    await productRepository.clear();

    await dataSource.destroy();
  } catch (error) {
    console.error('Error in globalTeardown:', error);
  }
};
