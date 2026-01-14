/* eslint-disable import-x/namespace */
import * as supertest from 'supertest';
import { Application } from 'express';
import { components } from '@src/openapi';

export class ProductRequestSender {
  public constructor(private readonly app: Application) {}

  public async postProduct(body: components['schemas']['productBase']): Promise<supertest.Response> {
    return supertest.agent(this.app).post(`/products`).set('Content-Type', 'application/json').send(body);
  }
}
