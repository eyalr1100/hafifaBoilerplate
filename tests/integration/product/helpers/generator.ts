/* eslint-disable @typescript-eslint/no-magic-numbers */
import { faker } from '@faker-js/faker';
import { Product } from '@src/product/models/product';

export type FakeStringifiedFileParams = Partial<Product>;

export type StringifiedProduct = Partial<Product>;

export const createStringifiedFakeEntity = (params: FakeStringifiedFileParams = {}): StringifiedProduct => {
  return {
    id: params.id ?? faker.string.uuid(),
    name: params.name ?? faker.commerce.productName(),
    description: params.description ?? faker.commerce.productDescription(),
    boundingPolygon:
      params.boundingPolygon ??
      ({
        type: 'Polygon',
        coordinates: [
          [
            [-10.0, -10.0],
            [10.0, -10.0],
            [10.0, 10.0],
            [-10.0, 10.0],
            [-10.0, -10.0],
          ],
        ],
      } as Product['boundingPolygon']),
    consumtionLink: params.consumtionLink ?? faker.internet.url(),
    type: params.type ?? 'raster',
    protocol: params.protocol ?? 'WMTS',
    resolutionBest: params.resolutionBest ?? 1.0,
    minZoom: params.minZoom ?? 0,
    maxZoom: params.maxZoom ?? 20,
  };
};
