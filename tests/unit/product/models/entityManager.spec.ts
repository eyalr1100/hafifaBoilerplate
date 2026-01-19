import jsLogger from '@map-colonies/js-logger';
import { Repository, SelectQueryBuilder, UpdateResult, DeleteResult } from 'typeorm';
import { Product } from '@src/product/models/product';
import { ProductManager } from '@src/product/models/productManager';
import { createFakeProduct } from '@tests/helperes/helpers';
import { NotFoundError } from '@src/common/errors';
import { IProductUpdate, ISearchParameter } from '@src/product/models/interface';
import { addNumericFilter, addSimpleFilter, addSpatialFilter, isComparableNumber } from '@src/product/utils/filters';

jest.mock('typeorm-transactional', (): object => ({
  ...jest.requireActual('typeorm-transactional'),
  runInTransaction: jest.fn().mockImplementation(async (fn: () => Promise<unknown>) => fn()),
}));

// Mock the filter utilities - we test them separately in filters.spec.ts
jest.mock('@src/product/utils/filters', () => ({
  addNumericFilter: jest.fn(),
  addSimpleFilter: jest.fn(),
  addSpatialFilter: jest.fn(),
  isComparableNumber: jest.fn(),
}));

describe('ProductManager', () => {
  let productManager: ProductManager;
  let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<Product>>;

  const saveMock = jest.fn();
  const updateMock = jest.fn();
  const deleteMock = jest.fn();
  const createQueryBuilderMock = jest.fn();

  beforeAll(() => {
    // Create mock query builder
    mockQueryBuilder = {
      andWhere: jest.fn().mockReturnThis(),
      getSql: jest.fn(),
      getMany: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Product>>;

    const mockRepository = {
      save: saveMock,
      update: updateMock,
      delete: deleteMock,
      createQueryBuilder: createQueryBuilderMock,
    } as unknown as jest.Mocked<Repository<Product>>;

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
    let searchQueryBuilder: jest.Mocked<SelectQueryBuilder<Product>>;

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();

      getManyMock = jest.fn();
      getSqlMock = jest.fn();
      andWhereMock = jest.fn().mockReturnThis();

      searchQueryBuilder = {
        andWhere: andWhereMock,
        getSql: getSqlMock,
        getMany: getManyMock,
      } as jest.Mocked<Partial<SelectQueryBuilder<Product>>> as jest.Mocked<SelectQueryBuilder<Product>>;

      createQueryBuilderMock.mockReturnValue(searchQueryBuilder);
    });

    it('should update an existing product', async () => {
      // Arrange
      const id = 'existing-product-id';
      const updateData: IProductUpdate = {
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
      const polygon = {
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
      } as ISearchParameter['boundingPolygon'];

      const searchParams: ISearchParameter = {
        boundingPolygon: polygon,
      };

      const expectedProducts = [{ id: 'product-1' } as Product];

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
      const updateData: IProductUpdate = {
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
      const updateData: IProductUpdate = {
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
      const updateData: IProductUpdate = { name: 'Test' };
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

    beforeEach(() => {
      jest.spyOn(console, 'log').mockImplementation();

      // Create fresh mocks for search tests
      getManyMock = jest.fn();
      getSqlMock = jest.fn();
      andWhereMock = jest.fn().mockReturnThis();

      const searchQueryBuilder = {
        andWhere: andWhereMock,
        getSql: getSqlMock,
        getMany: getManyMock,
      } as unknown as jest.Mocked<SelectQueryBuilder<Product>>;

      createQueryBuilderMock.mockReturnValue(searchQueryBuilder);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call addSimpleFilter for string values', async () => {
      // Arrange
      const searchParams: ISearchParameter = {
        name: 'Test Product',
      };

      const expectedProducts = [{ id: 'product-1', name: 'Test Product' } as Product];

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
      const searchParams: ISearchParameter = {
        resolutionBest: numericFilter,
      };

      const expectedProducts = [{ id: 'product-1', resolutionBest: 1.0 } as Product];

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
      const searchParams: ISearchParameter = {
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
      const searchParams: ISearchParameter = {
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
      expect(console.log).toHaveBeenCalledWith(sqlQuery);
    });
  });
});
