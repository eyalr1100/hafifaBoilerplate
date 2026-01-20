import type { Logger } from '@map-colonies/js-logger';
import { inject, injectable } from 'tsyringe';
import { Repository } from 'typeorm';
import { SERVICES } from '@common/constants';
import { NotFoundError } from '@src/common/errors';
import { addNumericFilter, addSimpleFilter, addSpatialFilter, isComparableNumber } from '../utils/filters';
import { ProductUpdate, SearchParameter, ProductCreate } from './interface';
import { Product, PRODUCT_REPOSITORY_SYMBOL } from './product';

@injectable()
export class ProductManager {
  public constructor(
    @inject(PRODUCT_REPOSITORY_SYMBOL) private readonly repository: Repository<Product>,
    @inject(SERVICES.LOGGER) private readonly logger: Logger
  ) {}

  public async createProduct(newProduct: ProductCreate): Promise<string> {
    const { name, description } = newProduct;
    this.logger.info({ msg: 'creating new product', name, description });

    const result = await this.repository.save(newProduct);

    return result.id;
  }

  public async updateProduct(id: string, productDTO: ProductUpdate): Promise<void> {
    this.logger.info({ msg: 'updating product', id, productDTO });
    const result = await this.repository.update({ id }, productDTO);

    if (result.affected === 0) {
      throw new NotFoundError('Product with that id not found');
    }
  }

  public async deleteProduct(id: string): Promise<void> {
    const result = await this.repository.delete({ id });

    if (result.affected === 0) {
      throw new NotFoundError('Product with that id not found');
    }
  }

  public async searchProduct(searchParameter: SearchParameter): Promise<Product[]> {
    const qb = this.repository.createQueryBuilder('product');

    for (const [key, value] of Object.entries(searchParameter)) {
      if (isComparableNumber(value)) {
        addNumericFilter(qb, key, value);
        continue;
      }

      if (typeof value === 'string') {
        addSimpleFilter(qb, key, value);
        continue;
      }

      if (key === 'boundingPolygon') {
        addSpatialFilter(qb, value);
        continue;
      }
    }

    this.logger.info({ msg: 'SQL query generated', sql: qb.getSql() });

    return qb.getMany();
  }
}
