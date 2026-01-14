import { Router } from 'express';
import { FactoryFunction } from 'tsyringe';
import { ProductController } from '../controllers/productController';

const productRouterFactory: FactoryFunction<Router> = (dependencyContainer) => {
  const router = Router();
  const controller = dependencyContainer.resolve(ProductController);

  router.post('/', controller.createProduct);
  router.post('/search', controller.searchProduct);
  router.put('/:id', controller.updateProduct);
  router.delete('/:id', controller.deleteProduct);

  return router;
};

export const PRODUCT_ROUTER_SYMBOL = Symbol('productRouterFactory');

export { productRouterFactory as productRouterFactory };
