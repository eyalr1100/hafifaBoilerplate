import { DataSource } from 'typeorm/browser';
import { Product } from '@src/product/models/product';

export const clearRepositories = async (connection: DataSource): Promise<void> => {
  await connection.getRepository(Product).clear();
};
