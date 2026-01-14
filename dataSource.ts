import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './src/common/db/connection';
import { DbConfig } from './src/common/interfaces';
import { getConfig, initConfig } from './src/common/config';
import { Product } from './src/product/models/product';

const dataSourceFactory = async (): Promise<DataSource> => {
  await initConfig(true);
  const config = getConfig();

  const connectionOptions = config.get('db') as DbConfig;

  const appDataSource = new DataSource({
    ...createDataSourceOptions(connectionOptions),
    entities: [Product, 'src/product/models/*.ts'],
    migrationsTableName: 'custom_migration_table',
    migrations: ['db/migration/*.ts'],
  });

  return appDataSource;
};

export default dataSourceFactory();
