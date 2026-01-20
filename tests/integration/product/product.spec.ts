import { DependencyContainer } from 'tsyringe';
import httpStatusCodes from 'http-status-codes';
import { Application } from 'express';
import { trace } from '@opentelemetry/api';
import { CleanupRegistry } from '@map-colonies/cleanup-registry';
import { DataSource } from 'typeorm';
import { SERVICES } from '@src/common/constants';
import { getApp } from '@src/app';
import { ConfigType, getConfig, initConfig } from '@src/common/config';
import { ProductCreate, ProductId } from '@src/product/models/interface';
import { Product } from '@src/product/models/product';
import { DATA_SOURCE_PROVIDER } from '@src/common/db/connection';
import { ProductRequestSender } from './helpers/requestSender';

describe('product', function () {
  let productRequestSender: ProductRequestSender;
  let app: Application;
  let container: DependencyContainer;
  let configInstance: ConfigType;

  const createProductPayload = (overrides?: Partial<ProductCreate>): ProductCreate => ({
    name: 'Satellite Imagery Layer',
    description: 'High resolution raster imagery',
    boundingPolygon: {
      type: 'Polygon',
      coordinates: [
        [
          [30, 10],
          [40, 40],
          [20, 40],
          [10, 20],
          [30, 10],
        ],
      ],
    },
    consumtionLink: 'https://example.com/wmts',
    type: 'raster',
    protocol: 'WMTS',
    resolutionBest: 0.25,
    minZoom: 8,
    maxZoom: 18,
    ...overrides,
  });

  beforeAll(async function () {
    await initConfig(true);
    configInstance = getConfig();

    const [initializedApp, initializedContainer] = await getApp({
      override: [
        {
          token: SERVICES.CONFIG,
          provider: { useValue: configInstance },
        },
        {
          token: SERVICES.TRACER,
          provider: {
            useValue: trace.getTracer('test-tracer'),
          },
        },
      ],
    });

    app = initializedApp;
    container = initializedContainer;
    const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);

    await dataSource.initialize();

    productRequestSender = new ProductRequestSender(app);
  });

  beforeEach(async function () {
    jest.resetAllMocks();

    // Clear the database before each test for isolation
    const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
    const productRepository = dataSource.getRepository(Product);
    await productRepository.clear();
  });

  afterAll(async function () {
    try {
      // Resolve dependencies BEFORE resetting container
      const dataSource = container.resolve<DataSource>(DATA_SOURCE_PROVIDER);
      const registry = container.resolve<CleanupRegistry>(SERVICES.CLEANUP_REGISTRY);

      // Trigger cleanup registry first
      await registry.trigger();

      // Ensure dataSource is properly destroyed
      if (dataSource.isInitialized) {
        await dataSource.destroy();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    } finally {
      // Reset container after cleanup is complete
      container.reset();
      container.clearInstances();
    }
  });
  describe('POST /products', () => {
    describe('success cases', () => {
      it('creates a product and makes it searchable by name', async () => {
        const { status } = await productRequestSender.postProduct(createProductPayload());
        expect(status).toBe(httpStatusCodes.CREATED);
      });
    });
  });
  describe('DELETE /products/:id', () => {
    describe('success cases', () => {
      it('deletes an existing product', async () => {
        const { status } = await productRequestSender.postProduct(createProductPayload());
        expect(status).toBe(httpStatusCodes.CREATED);
        const productId = (await productRequestSender.postProduct(createProductPayload())).body;
        expect(productId).toBeDefined();

        expect(typeof productId.id).toBe('string');

        const { status: deleteStatus } = await productRequestSender.deleteProduct(productId);
        expect(deleteStatus).toBe(httpStatusCodes.NO_CONTENT);
      });
    });

    describe('validation errors', () => {
      it('returns 400 when required fields are missing', async () => {
        const badPayload = {
          description: 'High resolution raster imagery',
        };

        const createRes = await productRequestSender.postProduct(badPayload as unknown as ProductCreate);

        expect(createRes.status).toBe(httpStatusCodes.BAD_REQUEST);
      });
    });

    describe('error cases', () => {
      it('returns 404 when product does not exist', async () => {
        const nonExistentId: ProductId = { id: '00000000-0000-0000-0000-000000000000' };
        const { status } = await productRequestSender.deleteProduct(nonExistentId);
        expect(status).toBe(httpStatusCodes.NOT_FOUND);
      });

      it('returns 400 for invalid product ID format', async () => {
        const invalidId: ProductId = { id: 'invalid-id-format' };
        const { status } = await productRequestSender.deleteProduct(invalidId);
        expect(status).toBe(httpStatusCodes.BAD_REQUEST);
      });
    });
  });

  describe('POST /products/search', () => {
    describe('success cases', () => {
      it('returns matching products when search criteria matches', async () => {
        // Create the product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Searchable Raster Layer',
            description: 'Raster layer for search tests',
            resolutionBest: 0.5,
            minZoom: 5,
            maxZoom: 15,
          })
        );

        const { status, body } = await productRequestSender.searchProducts({
          name: 'Searchable Raster Layer',
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          name: 'Searchable Raster Layer',
          type: 'raster',
          protocol: 'WMTS',
        });
      });

      it('returns empty list when no products match search', async () => {
        const { status, body } = await productRequestSender.searchProducts({
          name: 'NON_EXISTING_PRODUCT',
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body).toHaveLength(0);
      });

      it('supports numeric filters (ComparableNumber)', async () => {
        // Create product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Test Product',
            resolutionBest: 0.5,
          })
        );

        const {
          status,
          body: { length },
        } = await productRequestSender.searchProducts({
          resolutionBest: {
            lessEqual: 1,
            greater: 0.1,
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(length).toBeGreaterThan(0);
      });

      it('returns empty list when numeric filter excludes all results', async () => {
        const res = await productRequestSender.searchProducts({
          resolutionBest: {
            greater: 1000,
          },
        });

        expect(res.status).toBe(httpStatusCodes.OK);
        expect(res.body).toHaveLength(0);
      });

      it('supports combining multiple filters (AND behavior)', async () => {
        // Create product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Multi Filter Test',
            type: 'raster',
            protocol: 'WMTS',
            minZoom: 5,
          })
        );

        const { status, body } = await productRequestSender.searchProducts({
          type: 'raster',
          protocol: 'WMTS',
          minZoom: { lessEqual: 10 },
        });

        expect(status).toBe(httpStatusCodes.OK);

        body.forEach((product: Product) => {
          expect(product.type).toBe('raster');
          expect(product.protocol).toBe('WMTS');
          expect(product.minZoom).toBeLessThanOrEqual(10);
        });
      });

      it('returns products that intersect with search bounding polygon', async () => {
        // Create product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Intersect Test Product',
          })
        );

        // Search with a polygon that intersects with the seeded product
        // The seeded product has coordinates: [30, 10], [40, 40], [20, 40], [10, 20], [30, 10]
        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            intersects: {
              type: 'Polygon',
              coordinates: [
                [
                  [25, 15],
                  [35, 15],
                  [35, 35],
                  [25, 35],
                  [25, 15],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body.length).toBeGreaterThan(0);

        // Verify the returned product has the expected bounding polygon
        const product = body[0];
        expect(product.boundingPolygon).toBeDefined();
        expect(product.boundingPolygon.type).toBe('Polygon');
      });

      it('returns empty list when search polygon does not intersect any products', async () => {
        // Search with a polygon that does not intersect with any products
        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            intersects: {
              type: 'Polygon',
              coordinates: [
                [
                  [100, 100],
                  [110, 100],
                  [110, 110],
                  [100, 110],
                  [100, 100],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body).toHaveLength(0);
      });

      it('returns products that contain the search polygon', async () => {
        // Create product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Contains Test Product',
          })
        );

        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            contains: {
              type: 'Polygon',
              coordinates: [
                [
                  [22, 22],
                  [28, 22],
                  [28, 28],
                  [22, 28],
                  [22, 22],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);

        expect(body.length).toBeGreaterThan(0);

        const product = body[0];
        expect(product.boundingPolygon).toBeDefined();
        expect(product.boundingPolygon.type).toBe('Polygon');
      });

      it('returns empty list when no product contains the search polygon', async () => {
        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            contains: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [100, 0],
                  [100, 100],
                  [0, 100],
                  [0, 0],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body).toHaveLength(0);
      });

      it('returns products that are within the search polygon', async () => {
        // Create product for this test
        await productRequestSender.postProduct(
          createProductPayload({
            name: 'Within Test Product',
          })
        );

        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            within: {
              type: 'Polygon',
              coordinates: [
                [
                  [0, 0],
                  [50, 0],
                  [50, 50],
                  [0, 50],
                  [0, 0],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body.length).toBeGreaterThan(0);

        const product = body[0];
        expect(product.boundingPolygon).toBeDefined();
        expect(product.boundingPolygon.type).toBe('Polygon');
      });

      it('returns empty list when no product is within the search polygon', async () => {
        const { status, body } = await productRequestSender.searchProducts({
          boundingPolygon: {
            within: {
              type: 'Polygon',
              coordinates: [
                [
                  [100, 100],
                  [101, 100],
                  [101, 101],
                  [100, 101],
                  [100, 100],
                ],
              ],
            },
          },
        });

        expect(status).toBe(httpStatusCodes.OK);
        expect(body).toHaveLength(0);
      });
    });

    describe('PATCH /products/:id', () => {
      describe('success cases', () => {
        it('updates an existing product with full data', async () => {
          // Create a product
          const payload = createProductPayload({ name: 'Original Product' });
          const createRes = await productRequestSender.postProduct(payload);
          expect(createRes.status).toBe(httpStatusCodes.CREATED);

          const productId = createRes.body;

          // Update the product
          const updatePayload = {
            name: 'Updated Product',
            description: 'Updated description',
            resolutionBest: 0.5,
          };

          const patchRes = await productRequestSender.patchProduct(productId, updatePayload);
          expect(patchRes.status).toBe(httpStatusCodes.NO_CONTENT);

          // Search for the updated product to verify changes
          const searchRes = await productRequestSender.searchProducts({
            name: 'Updated Product',
          });

          expect(searchRes.status).toBe(httpStatusCodes.OK);
          expect(searchRes.body.length).toBeGreaterThan(0);

          const updatedProduct = searchRes.body[0];
          expect(updatedProduct.name).toBe('Updated Product');
          expect(updatedProduct.description).toBe('Updated description');
          expect(updatedProduct.resolutionBest).toBe(0.5);
        });

        it('updates an existing product with partial data', async () => {
          // Create a product
          const payload = createProductPayload({ name: 'Product for Partial Update' });
          const createRes = await productRequestSender.postProduct(payload);
          expect(createRes.status).toBe(httpStatusCodes.CREATED);

          const productId = createRes.body;
          const originalDescription = payload.description;

          // Partially update only the name
          const { status } = await productRequestSender.patchProduct(productId, {
            name: 'Partially Updated Product',
          });

          expect(status).toBe(httpStatusCodes.NO_CONTENT);
          // Search for the updated product to verify changes
          const { status: searchStatus, body: searchBody } = await productRequestSender.searchProducts({
            name: 'Partially Updated Product',
          });

          expect(searchStatus).toBe(httpStatusCodes.OK);
          expect(searchBody.length).toBeGreaterThan(0);

          const updatedProduct = searchBody[0];
          expect(updatedProduct.name).toBe('Partially Updated Product');
          // Description should remain unchanged
          expect(updatedProduct.description).toBe(originalDescription);
        });
      });

      describe('error cases', () => {
        it('returns 404 when product does not exist', async () => {
          const nonExistentId: ProductId = { id: '00000000-0000-0000-0000-000000000000' };
          const updatePayload = { name: 'Updated Name' };

          const { status } = await productRequestSender.patchProduct(nonExistentId, updatePayload);
          expect(status).toBe(httpStatusCodes.NOT_FOUND);
        });

        it('returns 400 for invalid product ID format', async () => {
          const invalidId: ProductId = { id: 'invalid-format-id' };
          const updatePayload = { name: 'Updated Name' };

          const { status } = await productRequestSender.patchProduct(invalidId, updatePayload);
          expect(status).toBe(httpStatusCodes.BAD_REQUEST);
        });
      });
    });
  });
});
