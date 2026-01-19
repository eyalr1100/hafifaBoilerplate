import type { Logger } from '@map-colonies/js-logger';
import httpStatus from 'http-status-codes';
import { injectable, inject } from 'tsyringe';
import { type Registry, Counter } from 'prom-client';
import { RequestHandler } from 'express';
import { SERVICES } from '@common/constants';
import { ProductManager } from '../models/productManager';
import { IProductCreate, IProductUpdate, ISearchParameter } from '../models/interface';
import { Product } from '../models/product';

type SearchProductHandler = RequestHandler<undefined, Product[] | string, ISearchParameter>;
type PostEntityHandler = RequestHandler<undefined, ProductId, IProductCreate>;
type PutEntityHandler = RequestHandler<ProductId, undefined, IProductUpdate>;
type DeleteProduct = RequestHandler<ProductId, undefined, undefined>;

@injectable()
export class ProductController {
  private readonly createdResourceCounter: Counter;

  public constructor(
    @inject(SERVICES.LOGGER) private readonly logger: Logger,
    @inject(ProductManager) private readonly manager: ProductManager,
    @inject(SERVICES.METRICS) private readonly metricsRegistry: Registry
  ) {
    this.createdResourceCounter = new Counter({
      name: 'created_resource',
      help: 'number of created resources',
      registers: [this.metricsRegistry],
    });
  }

  public createProduct: PostEntityHandler = async (req, res) => {
    const id = await this.manager.createProduct(req.body);
    this.createdResourceCounter.inc();
    return res.status(httpStatus.CREATED).json({ id });
  };

  public updateProduct: PutEntityHandler = async (req, res, next) => {
    try {
      await this.manager.updateProduct(req.params.id, req.body);
      return res.sendStatus(httpStatus.NO_CONTENT);
    } catch (error) {
      return next(error);
    }
  };

  public searchProduct: SearchProductHandler = async (req, res) => {
    const results = await this.manager.searchProduct(req.body);
    return res.status(httpStatus.OK).json(results);
  };

  public deleteProduct: DeleteProduct = async (req, res, next) => {
    try {
      await this.manager.deleteProduct(req.params.id);
      return res.sendStatus(httpStatus.NO_CONTENT);
    } catch (error) {
      return next(error);
    }
  };
}

export interface ProductId {
  id: string;
}
