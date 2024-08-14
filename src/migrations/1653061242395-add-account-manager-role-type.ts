import { MigrationInterface, QueryRunner } from 'typeorm';

export class addAccountManagerRoleType1653061242395
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO "ROLE" ("name", "created_at", "updated_at") VALUES
        ('ACCOUNT_MANAGER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM "ROLE" WHERE name='ACCOUNT_MANAGER'
    `);
  }
}
