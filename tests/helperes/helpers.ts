import { faker } from '@faker-js/faker';
import { Polygon } from 'geojson';
import { ProductCreate, productType, consumptionProtocol } from '@src/product/models/interface';

export const createFakeBoundingPolygon = (): Polygon => {
  // Use faker.number for coordinates instead of faker.location (which may not exist in older versions)
  const centerLon = faker.number.float({ min: -180, max: 180, fractionDigits: 6 });
  const centerLat = faker.number.float({ min: -90, max: 90, fractionDigits: 6 });
  const offset = 0.05;

  return {
    type: 'Polygon',
    coordinates: [
      [
        [centerLon - offset, centerLat - offset],
        [centerLon + offset, centerLat - offset],
        [centerLon + offset, centerLat + offset],
        [centerLon - offset, centerLat + offset],
        [centerLon - offset, centerLat - offset],
      ],
    ],
  };
};

export const createFakeProduct = (params?: Partial<ProductCreate>): ProductCreate => {
  const minZoom = params?.minZoom ?? faker.number.int({ min: 0, max: 10 });
  const maxZoom = params?.maxZoom ?? faker.number.int({ min: minZoom + 1, max: 22 });

  return {
    name: params?.name ?? faker.commerce.productName(),
    description: params?.description ?? faker.commerce.productDescription(),
    boundingPolygon: params?.boundingPolygon ?? createFakeBoundingPolygon(),
    consumtionLink: params?.consumtionLink ?? faker.internet.url(),
    type: params?.type ?? faker.helpers.arrayElement(Object.values(productType)),
    protocol: params?.protocol ?? faker.helpers.arrayElement(Object.values(consumptionProtocol)),
    resolutionBest: params?.resolutionBest ?? faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }),
    minZoom,
    maxZoom,
  };
};
