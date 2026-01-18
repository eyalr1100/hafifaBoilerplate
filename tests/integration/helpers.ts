import { DataSource } from 'typeorm/browser';
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel';
import { Product } from '@src/product/models/product';

export const DEFAULT_ISOLATION_LEVEL: IsolationLevel = 'SERIALIZABLE';

export const clearRepositories = async (connection: DataSource): Promise<void> => {
  await connection.transaction(DEFAULT_ISOLATION_LEVEL, async (manager) => {
    await manager.getRepository(Product).clear();
  });
};
