import { components } from '@src/openapi';

export type IProductModel = components['schemas']['product'];
export type IProductCreate = components['schemas']['productCreate'];
export type IProductUpdate = components['schemas']['productBase'];
export type ISearchParameter = components['schemas']['searchParameter'];
export type IBoundingPolygon = components['schemas']['boundingPolygon'];
export type IPolygon = components['schemas']['Polygon'];
export type IProtocolType = components['schemas']['protocol'];
export type IProductType = components['schemas']['productType'];
export type IComparableNumber = components['schemas']['comparableNumber'];

// Constants in UPPER_CASE or camelCase
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

// Types in PascalCase
export type ProductType = (typeof productType)[keyof typeof productType];
export type ConsumptionProtocol = (typeof consumptionProtocol)[keyof typeof consumptionProtocol];
