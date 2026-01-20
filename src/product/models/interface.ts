import { type Polygon } from 'geojson';
import { type components } from '@src/openapi';

type OpenApiProductModel = components['schemas']['product'];
type OpenApiProductCreate = components['schemas']['productCreate'];
type OpenApiSearchParameter = components['schemas']['searchParameter'];

type WithPolygon<T> = Omit<T, 'boundingPolygon'> & {
  boundingPolygon: Polygon;
};

export type ProductModel = WithPolygon<OpenApiProductModel>;
export type ProductCreate = WithPolygon<OpenApiProductCreate>;
export type ProductUpdate = components['schemas']['productBase'];

export interface BoundingPolygon {
  contains?: Polygon;
  within?: Polygon;
  intersects?: Polygon;
}

export type SearchParameter = Omit<OpenApiSearchParameter, 'boundingPolygon'> & {
  boundingPolygon?: BoundingPolygon;
};

export type ComparableNumber = components['schemas']['comparableNumber'];
export interface ProductId {
  id: components['schemas']['uuid'];
}

export const productType = {
  raster: 'raster',
  rasterizedVector: 'rasterized vector',
  threeDTiles: '3d tiles',
  qmesh: 'QMesh',
} as const;

export const consumptionProtocol = {
  wms: 'WMS',
  wmts: 'WMTS',
  xyz: 'XYZ',
  threeDTiles: '3D Tiles',
} as const;

export type ProductType = (typeof productType)[keyof typeof productType];
export type ConsumptionProtocol = (typeof consumptionProtocol)[keyof typeof consumptionProtocol];

export const SPATIAL_OPERATORS = {
  contains: 'ST_Contains',
  intersects: 'ST_Intersects',
  within: 'ST_Within',
} as const;

export type SpatialOperator = keyof typeof SPATIAL_OPERATORS;
