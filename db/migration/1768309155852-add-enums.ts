import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768309155852 implements MigrationInterface {
  public name = 'Migration1768309155852';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
           CREATE TYPE "product_type" AS ENUM ('raster','rasterized vector','3d tiles','QMesh');
        `);
    await queryRunner.query(`
          CREATE TYPE "consumption_protocol" AS ENUM ('WMS','WMTS','XYZ','3D Tiles');
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TYPE "product_type"`);
    await queryRunner.query(`DROP TYPE "consumption_protocol"`);
  }
}
