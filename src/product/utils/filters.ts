import { SelectQueryBuilder } from 'typeorm';
import { Polygon } from 'geojson';
import { Product } from '../models/product';
import { BoundingPolygon, ComparableNumber, SPATIAL_OPERATORS, SpatialOperator } from '../models/interface';

// Simple filter
export const addSimpleFilter = (qb: SelectQueryBuilder<Product>, field: string, value: string | number): void => {
  qb.andWhere(`product.${field} = :${field}`, { [field]: value });
};

// Numeric filter
export const addNumericFilter = (qb: SelectQueryBuilder<Product>, field: string, filter: ComparableNumber): void => {
  const mapping: Record<keyof ComparableNumber, string> = {
    equal: '=',
    greater: '>',
    greaterEqual: '>=',
    less: '<',
    lessEqual: '<=',
  };
  Object.entries(filter).forEach(([key, val]) => {
    qb.andWhere(`product.${field} ${mapping[key as keyof ComparableNumber]} :${field}${key}`, {
      [`${field}${key}`]: val,
    });
  });
};

export const isComparableNumber = (value: unknown): value is ComparableNumber => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('greater' in value || 'greaterEqual' in value || 'less' in value || 'lessEqual' in value || 'equal' in value)
  );
};

// Spatial filter
export const addSpatialFilter = (qb: SelectQueryBuilder<Product>, filter: BoundingPolygon): void => {
  (Object.entries(filter) as [SpatialOperator, Polygon | undefined][]).forEach(([operator, polygon]) => {
    qb.andWhere(`${SPATIAL_OPERATORS[operator]}(product.boundingPolygon, ST_GeomFromGeoJSON(:${operator}))`, { [operator]: JSON.stringify(polygon) });
  });
};
