import { Entity as OrmEntity, Index, Column, PrimaryGeneratedColumn } from 'typeorm';
import { consumptionProtocol, IPolygon, IProductModel, IProductType, IProtocolType, productType } from './interface';

export const PRODUCT_REPOSITORY_SYMBOL = Symbol('ProductRepository');

@OrmEntity()
export class Product implements IProductModel {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public description!: string;

  @Index('idx_products_bounding_polygon', { spatial: true })
  @Column({ type: 'geometry', spatialFeatureType: 'Polygon', srid: 4326 })
  public boundingPolygon!: IPolygon;

  @Column({ name: 'consumtion_link' })
  public consumtionLink!: string;

  @Index('idx_products_type')
  @Column({
    type: 'enum',
    enum: Object.values(productType),
    enumName: 'product_type',
  })
  public type!: IProductType;

  @Index('idx_products_protocol')
  @Column({
    type: 'enum',
    enum: Object.values(consumptionProtocol),
    enumName: 'consumption_protocol',
  })
  public protocol!: IProtocolType;

  @Column({ name: 'resolution_best', type: 'float' })
  public resolutionBest!: number;

  @Column({ name: 'min_zoom' })
  public minZoom!: number;

  @Column({ name: 'max_zoom' })
  public maxZoom!: number;
}
