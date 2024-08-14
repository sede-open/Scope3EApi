import { MigrationInterface, QueryRunner } from 'typeorm';

export class removeCompany1646628014229 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM COMPANY
        WHERE name = 'Corvus Energy' AND business_sector = 'Energy';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "COMPANY" ("name", "location", "business_sector", "sub_sector", "created_at", "updated_at") VALUES
      ('Corvus Energy','NO','Energy','Batteries', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
  }
}
