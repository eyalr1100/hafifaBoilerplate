/* eslint-disable */
import type { TypedRequestHandlers as ImportedTypedRequestHandlers } from '@map-colonies/openapi-helpers/typedRequestHandler';
export type paths = {
  '/products': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Creates a new product */
    post: operations['createProduct'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/search': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    /** Searches for products */
    post: operations['searchProducts'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/products/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Product ID */
        id: components['schemas']['uuid'];
      };
      cookie?: never;
    };
    get?: never;
    /** Partially updates a product by ID */
    put: operations['updateProduct'];
    post?: never;
    /** Deletes a product by ID */
    delete: operations['deleteProduct'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
};
export type webhooks = Record<string, never>;
export type components = {
  schemas: {
    /**
     * Format: uuid
     * @description UUID v4 identifier
     * @example 3eced354-acca-4fc6-bfce-8ffa4d1e86da
     */
    uuid: string;
    /** @enum {string} */
    productType: 'raster' | 'rasterized vector' | '3d tiles' | 'QMesh';
    /** @enum {string} */
    protocol: 'WMS' | 'WMTS' | 'XYZ' | '3D Tiles';
    comparableNumber: {
      greater?: number;
      greaterEqual?: number;
      less?: number;
      lessEqual?: number;
      equal?: number;
    };
    productCreate: {
      name: string;
      description: string;
      type: components['schemas']['productType'];
      protocol: components['schemas']['protocol'];
      consumtionLink: string;
      resolutionBest: number;
      minZoom: number;
      maxZoom: number;
      boundingPolygon: components['schemas']['Polygon'];
    };
    geoJsonObject: {
      /** @enum {string} */
      type:
        | 'Feature'
        | 'FeatureCollection'
        | 'Point'
        | 'MultiPoint'
        | 'LineString'
        | 'MultiLineString'
        | 'Polygon'
        | 'MultiPolygon'
        | 'GeometryCollection';
      bbox?: number[];
    };
    geometry: {
      type: 'geometry';
    } & (Omit<components['schemas']['geoJsonObject'], 'type'> & {
      /** @enum {string} */
      type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon' | 'GeometryCollection';
    });
    geometryElement: {
      type: 'geometryElement';
    } & (Omit<components['schemas']['geometry'], 'type'> & {
      /** @enum {string} */
      type: 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
    });
    /** @description Geojson geometry */
    Polygon: {
      type: 'Polygon';
    } & (Omit<components['schemas']['geometry'], 'type'> & {
      coordinates?: components['schemas']['Point3D'][][];
    });
    /** @description Point in 3D space */
    Point3D: number[];
    boundingPolygon: {
      contains?: components['schemas']['Polygon'];
      within?: components['schemas']['Polygon'];
      intersects?: components['schemas']['Polygon'];
    };
    productBase: {
      name?: string;
      description?: string;
      type?: components['schemas']['productType'];
      protocol?: components['schemas']['protocol'];
      consumtionLink?: string;
      resolutionBest?: number;
      minZoom?: number;
      maxZoom?: number;
      boundingPolygon?: components['schemas']['Polygon'];
    };
    product: components['schemas']['productBase'] & {
      id: components['schemas']['uuid'];
    };
    searchParameter: {
      id?: components['schemas']['uuid'];
      name?: string;
      description?: string;
      consumtionLink?: string;
      type?: components['schemas']['productType'];
      protocol?: components['schemas']['protocol'];
      resolutionBest?: components['schemas']['comparableNumber'];
      minZoom?: components['schemas']['comparableNumber'];
      maxZoom?: components['schemas']['comparableNumber'];
      boundingPolygon?: components['schemas']['boundingPolygon'];
    };
  };
  responses: {
    /** @description Invalid request payload */
    BadRequest: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          /** @example Request validation failed */
          message: string;
          /**
           * @example [
           *       "resolutionBest must be a number",
           *       "type must be one of: raster, rasterized vector, 3d tiles, QMesh"
           *     ]
           */
          details?: string[];
        };
      };
    };
    /** @description Product created successfully */
    CreatedProduct: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          id: components['schemas']['uuid'];
        };
      };
    };
    /** @description Operation completed successfully */
    NoContent: {
      headers: {
        [name: string]: unknown;
      };
      content?: never;
    };
    /** @description Product not found */
    ProductNotFound: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          /** @example Product not found */
          message: string;
        };
      };
    };
    /** @description Product deleted successfully */
    DeletedProduct: {
      headers: {
        [name: string]: unknown;
      };
      content?: never;
    };
    /** @description Products matching search criteria */
    SearchProductsOK: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': components['schemas']['product'][];
      };
    };
    /** @description Database service unavailable */
    ServiceUnavailable: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          /** @example DB not connected */
          message: string;
        };
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
};
export type $defs = Record<string, never>;
export interface operations {
  createProduct: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': components['schemas']['productCreate'];
      };
    };
    responses: {
      201: components['responses']['CreatedProduct'];
      400: components['responses']['BadRequest'];
      503: components['responses']['ServiceUnavailable'];
    };
  };
  searchProducts: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': components['schemas']['searchParameter'];
      };
    };
    responses: {
      200: components['responses']['SearchProductsOK'];
      400: components['responses']['BadRequest'];
      503: components['responses']['ServiceUnavailable'];
    };
  };
  updateProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Product ID */
        id: components['schemas']['uuid'];
      };
      cookie?: never;
    };
    requestBody?: {
      content: {
        'application/json': components['schemas']['productBase'];
      };
    };
    responses: {
      204: components['responses']['NoContent'];
      400: components['responses']['BadRequest'];
      404: components['responses']['ProductNotFound'];
      503: components['responses']['ServiceUnavailable'];
    };
  };
  deleteProduct: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        /** @description Product ID */
        id: components['schemas']['uuid'];
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      204: components['responses']['DeletedProduct'];
      400: components['responses']['BadRequest'];
      404: components['responses']['ProductNotFound'];
      503: components['responses']['ServiceUnavailable'];
    };
  };
}
export type TypedRequestHandlers = ImportedTypedRequestHandlers<paths, operations>;
