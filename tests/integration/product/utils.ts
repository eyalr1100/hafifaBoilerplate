import { ProductCreate } from '@src/product/models/interface';

export const createProductPayload = (overrides?: Partial<ProductCreate>): ProductCreate => ({
  name: 'Satellite Imagery Layer',
  description: 'High resolution raster imagery',
  boundingPolygon: {
    type: 'Polygon',
    coordinates: [
      [
        [30, 10],
        [40, 40],
        [20, 40],
        [10, 20],
        [30, 10],
      ],
    ],
  },
  consumtionLink: 'https://example.com/wmts',
  type: 'raster',
  protocol: 'WMTS',
  resolutionBest: 0.25,
  minZoom: 8,
  maxZoom: 18,
  ...overrides,
});
