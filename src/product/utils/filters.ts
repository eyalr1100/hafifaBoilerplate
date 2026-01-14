import { SelectQueryBuilder } from 'typeorm';
import { Product } from '../models/product';
import { IComparableNumber, IPolygon } from '../models/interface';

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
export const addSpatialFilter = (qb: SelectQueryBuilder<Product>, filter: IPolygon): void => {
  const mapping: Record<keyof IPolygon, string> = {
    contains: 'ST_Contains',
    intersects: 'ST_Intersects',
    within: 'ST_Contains',
  };

  Object.entries(filter).forEach(([key, polygon]) => {
    const func = mapping[key as keyof IPolygon];
    const geomA = key === 'contains' ? 'ST_GeomFromGeoJSON(:polygon)' : 'product.boundingPolygon';
    const geomB = key === 'within' ? 'ST_GeomFromGeoJSON(:polygon)' : 'product.boundingPolygon';
    qb.andWhere(`${func}(${geomA}, ${geomB})`, {
      polygon: JSON.stringify(polygon),
    });
  });
};
