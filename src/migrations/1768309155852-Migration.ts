import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768309155852 implements MigrationInterface {
  name = 'Migration1768309155852';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "product" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "boundingPolygon" geometry(Polygon,4326) NOT NULL, "consumtion_link" character varying NOT NULL, "type" "public"."product_type" NOT NULL, "protocol" "public"."consumption_protocol" NOT NULL, "resolution_best" double precision NOT NULL, "min_zoom" integer NOT NULL, "max_zoom" integer NOT NULL, CONSTRAINT "PK_bebc9158e480b949565b4dc7a82" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`CREATE INDEX "idx_products_bounding_polygon" ON "product" USING GiST ("boundingPolygon") `);
    await queryRunner.query(`CREATE INDEX "idx_products_type" ON "product" ("type") `);
    await queryRunner.query(`CREATE INDEX "idx_products_protocol" ON "product" ("protocol") `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "public"."idx_products_protocol"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_type"`);
    await queryRunner.query(`DROP INDEX "public"."idx_products_bounding_polygon"`);
    await queryRunner.query(`DROP TABLE "product"`);
  }
}
