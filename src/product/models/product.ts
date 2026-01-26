import { Entity as OrmEntity, Index, Column, PrimaryGeneratedColumn } from 'typeorm';
import { type Polygon } from 'geojson';
import { type ConsumptionProtocol, consumptionProtocol, type ProductModel, type ProductType, productType } from './interface';

export const PRODUCT_REPOSITORY_SYMBOL = Symbol('ProductRepository');

@OrmEntity()
export class Product implements ProductModel {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public description!: string;

  @Index('idx_products_bounding_polygon', { spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Polygon', srid: 4326 })
  public boundingPolygon!: Polygon;

  @Column({ name: 'consumtion_link' })
  public consumtionLink!: string;

  @Index('idx_products_type')
  @Column({
    type: 'enum',
    enum: Object.values(productType),
    enumName: 'product_type',
  })
  public type!: ProductType;

  @Index('idx_products_protocol')
  @Column({
    type: 'enum',
    enum: Object.values(consumptionProtocol),
    enumName: 'consumption_protocol',
  })
  public protocol!: ConsumptionProtocol;

  @Column({ name: 'resolution_best', type: 'float' })
  public resolutionBest!: number;

  @Column({ name: 'min_zoom' })
  public minZoom!: number;

  @Column({ name: 'max_zoom' })
  public maxZoom!: number;
}
