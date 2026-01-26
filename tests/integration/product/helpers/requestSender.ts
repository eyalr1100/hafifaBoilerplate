/* eslint-disable import-x/namespace */
import * as supertest from 'supertest';
import { Application } from 'express';
import type { SearchParameter, ProductId, ProductCreate, ProductUpdate } from '@src/product/models/interface';
import { Product } from '@src/product/models/product';

interface TypedResponse<T> extends Omit<supertest.Response, 'body'> {
  body: T;
}

export class ProductRequestSender {
  public constructor(private readonly app: Application) {}

  public async postProduct(body: ProductCreate): Promise<TypedResponse<ProductId>> {
    return supertest.agent(this.app).post(`/products`).set('Content-Type', 'application/json').send(body);
  }

  public async deleteProduct(id: ProductId): Promise<supertest.Response> {
    return supertest.agent(this.app).delete(`/products/${id.id}`).set('Content-Type', 'application/json');
  }

  public async searchProducts(body: SearchParameter): Promise<TypedResponse<Product[]>> {
    return supertest.agent(this.app).post(`/products/search`).set('Content-Type', 'application/json').send(body) as Promise<TypedResponse<Product[]>>;
  }

  public async patchProduct(id: ProductId, body: ProductUpdate): Promise<supertest.Response> {
    return supertest.agent(this.app).put(`/products/${id.id}`).set('Content-Type', 'application/json').send(body);
  }
}
