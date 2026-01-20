import jsLogger from '@map-colonies/js-logger';
import { Repository, SelectQueryBuilder, UpdateResult, DeleteResult } from 'typeorm';
import { Product } from '@src/product/models/product';
import { ProductManager } from '@src/product/models/productManager';
import { createFakeProduct } from '@tests/helperes/helpers';
import { NotFoundError } from '@src/common/errors';
import type { BoundingPolygon, ProductUpdate, SearchParameter } from '@src/product/models/interface';
import { addNumericFilter, addSimpleFilter, addSpatialFilter, isComparableNumber } from '@src/product/utils/filters';

jest.mock('typeorm-transactional', (): object => ({
  ...jest.requireActual('typeorm-transactional'),
  runInTransaction: jest.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
}));

jest.mock('@src/product/utils/filters', () => ({
  addNumericFilter: jest.fn(),
  addSimpleFilter: jest.fn(),
  addSpatialFilter: jest.fn(),
  isComparableNumber: jest.fn(),
}));

describe('ProductManager', () => {
  let productManager: ProductManager;
  let mockQueryBuilder: SelectQueryBuilder<Product>;
  let mockRepository: Repository<Product>;

  const saveMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const createQueryBuilderMock = jest.fn();

  beforeAll(() => {
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getSql: jest.fn(),
      getMany: jest.fn(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
    } as Partial<SelectQueryBuilder<Product>> as SelectQueryBuilder<Product>;

    mockRepository = {
      save: saveMock,
      update: updateMock,
      delete: deleteMock,
      createQueryBuilder: createQueryBuilderMock,
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    } as Partial<Repository<Product>> as Repository<Product>;

    createQueryBuilderMock.mockReturnValue(mockQueryBuilder);

    productManager = new ProductManager(mockRepository, jsLogger({ enabled: false }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('#createProduct', () => {
    it('should create a product and return its id', async () => {
      // Arrange
      const product = createFakeProduct();
      const generatedId = 'generated-uuid-123';

      saveMock.mockResolvedValue({ ...product, id: generatedId });

      // Act
      const result = await productManager.createProduct(product);

      // Assert
      expect(result).toBe(generatedId);
      expect(saveMock).toHaveBeenCalledWith(product);
      expect(saveMock).toHaveBeenCalledTimes(1);
    });

    it('should create a product with custom values', async () => {
      // Arrange
      const customProduct = createFakeProduct({
        name: 'Custom Product Name',
        description: 'Custom Description',
      });

      saveMock.mockResolvedValue({ ...customProduct, id: 'test-id-456' });

      // Act
      const result = await productManager.createProduct(customProduct);

      // Assert
      expect(result).toBe('test-id-456');
      expect(saveMock).toHaveBeenCalledWith(customProduct);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const product = createFakeProduct();
      const error = new Error('Database connection error');

      saveMock.mockRejectedValue(error);

      // Act & Assert
      await expect(productManager.createProduct(product)).rejects.toThrow('Database connection error');
      expect(saveMock).toHaveBeenCalledWith(product);
    });
  });

  describe('#updateProduct', () => {
    let getManyMock: jest.Mock;
    let getSqlMock: jest.Mock;
    let andWhereMock: jest.Mock;
    let searchQueryBuilder: SelectQueryBuilder<Product>;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();

      getManyMock = jest.fn();
      getSqlMock = jest.fn();
      andWhereMock = jest.fn().mockReturnThis();

      searchQueryBuilder = {
        andWhere: andWhereMock,
        getSql: getSqlMock,
        getMany: getManyMock,
      } as Partial<SelectQueryBuilder<Product>> as SelectQueryBuilder<Product>;

      createQueryBuilderMock.mockReturnValue(searchQueryBuilder);
    });

    it('should update an existing product', async () => {
      // Arrange
      const id = 'existing-product-id';
      const updateData: ProductUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
      };

      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      updateMock.mockResolvedValue(updateResult);

      // Act
      await productManager.updateProduct(id, updateData);

      // Assert
      expect(updateMock).toHaveBeenCalledWith({ id }, updateData);
      expect(updateMock).toHaveBeenCalledTimes(1);
    });

    it('should call addSpatialFilter for boundingPolygon', async () => {
      // Arrange
      const polygon: BoundingPolygon = {
        intersects: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
              [0, 0],
            ],
          ],
        },
      };

      const searchParams: SearchParameter = {
        boundingPolygon: polygon,
      };

      const expectedProducts = [{ id: 'product-1' }];

      jest.mocked(isComparableNumber).mockReturnValue(false);
      getManyMock.mockResolvedValue(expectedProducts);

      // Act
      const result = await productManager.searchProduct(searchParams);

      // Assert
      expect(result).toEqual(expectedProducts);
      expect(addSpatialFilter).toHaveBeenCalledWith(searchQueryBuilder, polygon);
      expect(addSpatialFilter).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';
      const updateData: ProductUpdate = {
        name: 'Updated Name',
      };

      const updateResult: UpdateResult = {
        affected: 0,
        raw: {},
        generatedMaps: [],
      };

      updateMock.mockResolvedValue(updateResult);

      // Act & Assert
      await expect(productManager.updateProduct(id, updateData)).rejects.toThrow(NotFoundError);
      await expect(productManager.updateProduct(id, updateData)).rejects.toThrow('Product with that id not found');
    });

    it('should update multiple fields', async () => {
      // Arrange
      const id = 'product-123';
      const updateData: ProductUpdate = {
        name: 'New Name',
        description: 'New Description',
        minZoom: 5,
        maxZoom: 15,
      };

      const updateResult: UpdateResult = {
        affected: 1,
        raw: {},
        generatedMaps: [],
      };

      updateMock.mockResolvedValue(updateResult);

      // Act
      await productManager.updateProduct(id, updateData);

      // Assert
      expect(updateMock).toHaveBeenCalledWith({ id }, updateData);
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const id = 'test-id';
      const updateData: ProductUpdate = { name: 'Test' };
      const error = new Error('Database error');

      updateMock.mockRejectedValue(error);

      // Act & Assert
      await expect(productManager.updateProduct(id, updateData)).rejects.toThrow('Database error');
    });
  });

  describe('#deleteProduct', () => {
    it('should delete an existing product', async () => {
      // Arrange
      const id = 'existing-product-id';

      const deleteResult: DeleteResult = {
        affected: 1,
        raw: {},
      };

      deleteMock.mockResolvedValue(deleteResult);

      // Act
      await productManager.deleteProduct(id);

      // Assert
      expect(deleteMock).toHaveBeenCalledWith({ id });
      expect(deleteMock).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError when product does not exist', async () => {
      // Arrange
      const id = 'non-existent-id';

      const deleteResult: DeleteResult = {
        affected: 0,
        raw: {},
      };

      deleteMock.mockResolvedValue(deleteResult);

      // Act & Assert
      await expect(productManager.deleteProduct(id)).rejects.toThrow(NotFoundError);
      await expect(productManager.deleteProduct(id)).rejects.toThrow('Product with that id not found');
    });

    it('should handle constraint violation errors', async () => {
      // Arrange
      const id = 'product-with-dependencies';
      const error = new Error('Foreign key constraint violation');

      deleteMock.mockRejectedValue(error);

      // Act & Assert
      await expect(productManager.deleteProduct(id)).rejects.toThrow('Foreign key constraint violation');
    });
  });

  describe('#searchProduct', () => {
    let getManyMock: jest.Mock;
    let getSqlMock: jest.Mock;
    let andWhereMock: jest.Mock;
    let searchQueryBuilder: SelectQueryBuilder<Product>;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();

      // Create fresh mocks for search tests
      getManyMock = jest.fn();
      getSqlMock = jest.fn();
      andWhereMock = jest.fn().mockReturnThis();

      searchQueryBuilder = {
        andWhere: andWhereMock,
        getSql: getSqlMock,
        getMany: getManyMock,
      } as Partial<SelectQueryBuilder<Product>> as SelectQueryBuilder<Product>;

      createQueryBuilderMock.mockReturnValue(searchQueryBuilder);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call addSimpleFilter for string values', async () => {
      // Arrange
      const searchParams: SearchParameter = {
        name: 'Test Product',
      };

      const expectedProducts = [{ id: 'product-1', name: 'Test Product' }];

      jest.mocked(isComparableNumber).mockReturnValue(false);
      getManyMock.mockResolvedValue(expectedProducts);
      getSqlMock.mockReturnValue('SELECT * FROM product');

      // Act
      const result = await productManager.searchProduct(searchParams);

      // Assert
      expect(result).toEqual(expectedProducts);
      expect(isComparableNumber).toHaveBeenCalledWith('Test Product');
      expect(addSimpleFilter).toHaveBeenCalledTimes(1);
      expect(getManyMock).toHaveBeenCalledTimes(1);
    });

    it('should call addNumericFilter for comparable number values', async () => {
      // Arrange
      const numericFilter = { greaterEqual: 0.5, lessEqual: 2.0 };
      const searchParams: SearchParameter = {
        resolutionBest: numericFilter,
      };

      const expectedProducts = [{ id: 'product-1', resolutionBest: 1.0 }];

      jest.mocked(isComparableNumber).mockReturnValue(true);
      getManyMock.mockResolvedValue(expectedProducts);

      // Act
      const result = await productManager.searchProduct(searchParams);

      // Assert
      expect(result).toEqual(expectedProducts);
      expect(isComparableNumber).toHaveBeenCalledWith(numericFilter);
      expect(addNumericFilter).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no products match', async () => {
      // Arrange
      const searchParams: SearchParameter = {
        name: 'Non-existent Product',
      };

      jest.mocked(isComparableNumber).mockReturnValue(false);
      getManyMock.mockResolvedValue([]);

      // Act
      const result = await productManager.searchProduct(searchParams);

      // Assert
      expect(result).toEqual([]);
      expect(getManyMock).toHaveBeenCalledTimes(1);
    });

    it('should log the generated SQL query', async () => {
      // Arrange
      const searchParams: SearchParameter = {
        name: 'Test',
      };

      const sqlQuery = 'SELECT * FROM product WHERE name = ?';

      jest.mocked(isComparableNumber).mockReturnValue(false);
      getManyMock.mockResolvedValue([]);
      getSqlMock.mockReturnValue(sqlQuery);

      // Act
      await productManager.searchProduct(searchParams);

      // Assert
      expect(getSqlMock).toHaveBeenCalled();
    });
  });
});
