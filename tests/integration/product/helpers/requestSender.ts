/* eslint-disable import-x/namespace */
import * as supertest from 'supertest';
import { Application } from 'express';
import { ProductId } from '@src/product/controllers/productController';
import { ISearchParameter } from '@src/product/models/interface';

export class ProductRequestSender {
  public constructor(private readonly app: Application) {}

  // Unkown used to test invalid payloads!!
  public async postProduct(body: unknown): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .post(`/products`)
      .set('Content-Type', 'application/json')
      .send(body as object);
  }

  public async deleteProduct(id: ProductId): Promise<supertest.Response> {
    return supertest.agent(this.app).delete(`/products/${id.id}`).set('Content-Type', 'application/json');
  }

  public async searchProducts(body: ISearchParameter): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/products/search`).set('Content-Type', 'application/json').send(body);
  }

  // Unkown used to test invalid payloads!!
  public async patchProduct(id: ProductId, body: unknown): Promise<supertest.Response> {
    return supertest
      .agent(this.app)
      .put(`/products/${id.id}`)
      .set('Content-Type', 'application/json')
      .send(body as object);
  }
}
