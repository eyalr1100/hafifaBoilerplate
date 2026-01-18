import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1768309155851 implements MigrationInterface {
  public name = 'Migration1768309155851';
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE EXTENSION IF NOT EXISTS "postgis";
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP EXTENSION IF EXISTS "postgis";
    `);
  }
}
