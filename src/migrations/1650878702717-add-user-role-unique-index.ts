import { MigrationInterface, QueryRunner } from 'typeorm';

export class addUserRoleUniqueIndex1650878702717 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UNIQUE_user_x_role" ON "USER_ROLE" ("user_id", "role_id")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "UNIQUE_user_x_role" ON "USER_ROLE"');
  }
}
