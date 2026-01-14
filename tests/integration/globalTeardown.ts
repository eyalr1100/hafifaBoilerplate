import { DataSource } from 'typeorm';
import { Product } from '@src/product/models/product';
import { createDataSourceOptions } from '../../src/common/db/connection';
import { getConfig, initConfig } from '../../src/common/config';
import { DbConfig } from '../../src/common/interfaces';

export default async (): Promise<void> => {
  await initConfig(true);

  const config = getConfig();
  const dbConfig = config.get('db') as DbConfig;
  const dataSource = new DataSource(createDataSourceOptions(dbConfig));
  await dataSource.initialize();

  const productRepository = dataSource.getRepository(Product);
  await productRepository.clear();

  await dataSource.destroy();
  return;
};
