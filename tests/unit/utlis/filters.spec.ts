import { SelectQueryBuilder } from 'typeorm';
import { Product } from '@src/product/models/product';
import { ComparableNumber } from '@src/product/models/interface';
import { addSimpleFilter, addNumericFilter, isComparableNumber, addSpatialFilter } from '@src/product/utils/filters';

describe('Filter Utilities', () => {
  let andWhereMock: jest.Mock;
  let mockQueryBuilder: SelectQueryBuilder<Product>;

  beforeEach(() => {
    andWhereMock = jest.fn().mockReturnThis();

    mockQueryBuilder = {
      andWhere: andWhereMock,
    } as Partial<SelectQueryBuilder<Product>> as SelectQueryBuilder<Product>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addSimpleFilter', () => {
    it('should add a simple string filter', () => {
      // Act
      addSimpleFilter(mockQueryBuilder, 'name', 'Test Product');

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.name = :name', { name: 'Test Product' });
      expect(andWhereMock).toHaveBeenCalledTimes(1);
    });

    it('should add a simple numeric filter', () => {
      // Act
      addSimpleFilter(mockQueryBuilder, 'minZoom', 5);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.minZoom = :minZoom', { minZoom: 5 });
    });

    it('should add filter for protocol field', () => {
      // Act
      addSimpleFilter(mockQueryBuilder, 'protocol', 'WMS');

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.protocol = :protocol', { protocol: 'WMS' });
    });

    it('should add filter for type field', () => {
      // Act
      addSimpleFilter(mockQueryBuilder, 'type', 'raster');

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.type = :type', { type: 'raster' });
    });
  });

  describe('addNumericFilter', () => {
    it('should add greater than filter', () => {
      // Arrange
      const filter: ComparableNumber = { greater: 10 };

      // Act
      addNumericFilter(mockQueryBuilder, 'resolutionBest', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.resolutionBest > :resolutionBestgreater', { resolutionBestgreater: 10 });
      expect(andWhereMock).toHaveBeenCalledTimes(1);
    });

    it('should add greater than or equal filter', () => {
      // Arrange
      const filter: ComparableNumber = { greaterEqual: 5 };

      // Act
      addNumericFilter(mockQueryBuilder, 'minZoom', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.minZoom >= :minZoomgreaterEqual', { minZoomgreaterEqual: 5 });
    });

    it('should add less than filter', () => {
      // Arrange
      const filter: ComparableNumber = { less: 20 };

      // Act
      addNumericFilter(mockQueryBuilder, 'maxZoom', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.maxZoom < :maxZoomless', { maxZoomless: 20 });
    });

    it('should add less than or equal filter', () => {
      // Arrange
      const filter: ComparableNumber = { lessEqual: 15 };

      // Act
      addNumericFilter(mockQueryBuilder, 'maxZoom', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.maxZoom <= :maxZoomlessEqual', { maxZoomlessEqual: 15 });
    });

    it('should add equal filter', () => {
      // Arrange
      const filter: ComparableNumber = { equal: 10 };

      // Act
      addNumericFilter(mockQueryBuilder, 'minZoom', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('product.minZoom = :minZoomequal', { minZoomequal: 10 });
    });

    it('should add multiple numeric filters', () => {
      // Arrange
      const filter: ComparableNumber = {
        greaterEqual: 5,
        lessEqual: 15,
      };

      // Act
      addNumericFilter(mockQueryBuilder, 'minZoom', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledTimes(2);
      expect(andWhereMock).toHaveBeenCalledWith('product.minZoom >= :minZoomgreaterEqual', { minZoomgreaterEqual: 5 });
      expect(andWhereMock).toHaveBeenCalledWith('product.minZoom <= :minZoomlessEqual', { minZoomlessEqual: 15 });
    });

    it('should handle range filters (min/max style)', () => {
      // Arrange
      const filter: ComparableNumber = {
        greaterEqual: 0.5,
        lessEqual: 2.0,
      };

      // Act
      addNumericFilter(mockQueryBuilder, 'resolutionBest', filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledTimes(2);
      expect(andWhereMock).toHaveBeenCalledWith('product.resolutionBest >= :resolutionBestgreaterEqual', {
        resolutionBestgreaterEqual: 0.5,
      });
      expect(andWhereMock).toHaveBeenCalledWith('product.resolutionBest <= :resolutionBestlessEqual', { resolutionBestlessEqual: 2.0 });
    });
  });

  describe('isComparableNumber', () => {
    it('should return true for object with greater property', () => {
      const value = { greater: 10 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return true for object with greaterEqual property', () => {
      const value = { greaterEqual: 5 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return true for object with less property', () => {
      const value = { less: 20 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return true for object with lessEqual property', () => {
      const value = { lessEqual: 15 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return true for object with equal property', () => {
      const value = { equal: 10 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return true for object with multiple comparison properties', () => {
      const value = { greaterEqual: 5, lessEqual: 15 };
      expect(isComparableNumber(value)).toBe(true);
    });

    it('should return false for string', () => {
      expect(isComparableNumber('test')).toBe(false);
    });

    it('should return false for number', () => {
      expect(isComparableNumber(123)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isComparableNumber(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isComparableNumber(undefined)).toBe(false);
    });

    it('should return false for empty object', () => {
      expect(isComparableNumber({})).toBe(false);
    });

    it('should return false for object without comparison properties', () => {
      const value = { name: 'test', value: 10 };
      expect(isComparableNumber(value)).toBe(false);
    });

    it('should return false for array', () => {
      expect(isComparableNumber([1, 2, 3])).toBe(false);
    });
  });

  describe('addSpatialFilter', () => {
    it('should add intersects spatial filter', () => {
      // Arrange
      const polygon = {
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
      };

      const filter = {
        intersects: polygon,
      };

      // Act
      addSpatialFilter(mockQueryBuilder, filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('ST_Intersects(product.boundingPolygon, ST_GeomFromGeoJSON(:intersects))', {
        intersects: JSON.stringify(polygon),
      });
      expect(andWhereMock).toHaveBeenCalledTimes(1);
    });

    it('should add contains spatial filter', () => {
      // Arrange
      const polygon = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [5, 0],
            [5, 5],
            [0, 5],
            [0, 0],
          ],
        ],
      };

      const filter = {
        contains: polygon,
      };

      // Act
      addSpatialFilter(mockQueryBuilder, filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('ST_Contains(product.boundingPolygon, ST_GeomFromGeoJSON(:contains))', {
        contains: JSON.stringify(polygon),
      });
    });

    it('should add within spatial filter', () => {
      // Arrange
      const polygon = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [0, 0],
            [20, 0],
            [20, 20],
            [0, 20],
            [0, 0],
          ],
        ],
      };

      const filter = {
        within: polygon,
      };

      // Act
      addSpatialFilter(mockQueryBuilder, filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('ST_Within(product.boundingPolygon, ST_GeomFromGeoJSON(:within))', {
        within: JSON.stringify(polygon),
      });
    });

    it('should add multiple spatial filters', () => {
      // Arrange
      const polygon1 = {
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
      };

      const polygon2 = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [5, 5],
            [15, 5],
            [15, 15],
            [5, 15],
            [5, 5],
          ],
        ],
      };

      const filter = {
        intersects: polygon1,
        contains: polygon2,
      };

      // Act
      addSpatialFilter(mockQueryBuilder, filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledTimes(2);
      expect(andWhereMock).toHaveBeenCalledWith('ST_Intersects(product.boundingPolygon, ST_GeomFromGeoJSON(:intersects))', {
        intersects: JSON.stringify(polygon1),
      });
      expect(andWhereMock).toHaveBeenCalledWith('ST_Contains(product.boundingPolygon, ST_GeomFromGeoJSON(:contains))', {
        contains: JSON.stringify(polygon2),
      });
    });

    it('should properly serialize complex polygon coordinates', () => {
      // Arrange
      const complexPolygon = {
        type: 'Polygon' as const,
        coordinates: [
          [
            [34.2, 29.5],
            [35.9, 29.5],
            [35.9, 33.3],
            [34.2, 33.3],
            [34.2, 29.5],
          ],
        ],
      };

      const filter = {
        within: complexPolygon,
      };

      // Act
      addSpatialFilter(mockQueryBuilder, filter);

      // Assert
      expect(andWhereMock).toHaveBeenCalledWith('ST_Within(product.boundingPolygon, ST_GeomFromGeoJSON(:within))', {
        within: JSON.stringify(complexPolygon),
      });
    });
  });
});
