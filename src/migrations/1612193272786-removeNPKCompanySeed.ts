import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeNPKCompanySeed1612193272786 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM COMPANY
        WHERE name = 'NPK Design' AND business_sector = 'Brand & Communications';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "COMPANY" ("name", "location", "business_sector", "sub_sector", "created_at", "updated_at") VALUES
      ('NPK Design','NL','Brand & Communications','Creative Solutions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
  }
}
