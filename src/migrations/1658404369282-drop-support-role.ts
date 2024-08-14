import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'ROLE';
const SUPPORT_ROLE_NAME = 'SUPPORT';

export class dropSupportRole1658404369282 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DELETE FROM "${TABLE_NAME}"
            WHERE name in ('${SUPPORT_ROLE_NAME}');
        `);
  }
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO "${TABLE_NAME}" (name) VALUES
            ('${SUPPORT_ROLE_NAME}');`
    );
  }
}
