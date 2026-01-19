import { SelectQueryBuilder } from 'typeorm';
import { Product } from '../models/product';
import { IBoundingPolygon, IComparableNumber } from '../models/interface';

// Simple filter
export const addSimpleFilter = (qb: SelectQueryBuilder<Product>, field: string, value: string | number): void => {
  qb.andWhere(`product.${field} = :${field}`, { [field]: value });
};

// Numeric filter
export const addNumericFilter = (qb: SelectQueryBuilder<Product>, field: string, filter: IComparableNumber): void => {
  const mapping: Record<keyof IComparableNumber, string> = {
    equal: '=',
    greater: '>',
    greaterEqual: '>=',
    less: '<',
    lessEqual: '<=',
  };
  Object.entries(filter).forEach(([key, val]) => {
    qb.andWhere(`product.${field} ${mapping[key as keyof IComparableNumber]} :${field}${key}`, {
      [`${field}${key}`]: val,
    });
  });
};

export const isComparableNumber = (value: unknown): value is IComparableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('greater' in value || 'greaterEqual' in value || 'less' in value || 'lessEqual' in value || 'equal' in value)
  );
};

// Spatial filter
export const addSpatialFilter = (qb: SelectQueryBuilder<Product>, filter: IBoundingPolygon): void => {
  const spatialOperators: Record<keyof IBoundingPolygon, string> = {
    intersects: 'ST_Intersects',
    contains: 'ST_Contains',
    within: 'ST_Within',
  };

  Object.entries(filter).forEach(([key, polygon]) => {
    const operator = spatialOperators[key as keyof IBoundingPolygon];
    if (operator) {
      qb.andWhere(`${operator}(product.boundingPolygon, ST_GeomFromGeoJSON(:polygon))`, {
        polygon: JSON.stringify(polygon),
      });
    }
  });
};
