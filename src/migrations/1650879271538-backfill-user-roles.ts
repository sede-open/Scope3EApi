import { MigrationInterface, QueryRunner } from 'typeorm';
import { RoleName } from '../types';

export class backfillUserRoles1650879271538 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const roles = (await queryRunner.query('SELECT id, name FROM ROLE')) as {
      id: string;
      name: RoleName;
    }[];

    const editor = roles.find((role) => role.name === RoleName.SupplierEditor);
    const viewer = roles.find((role) => role.name === RoleName.SupplierViewer);

    if (!editor) {
      throw new Error('Unable to backfill where editor role not present');
    }

    if (!viewer) {
      throw new Error('Unable to backfill where viewer role not present');
    }

    /* Any existing admins are being granted admin + editor + viewer */
    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, u.role_id
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'ADMIN';
      `
    );

    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, @0
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'ADMIN';
      `,
      [editor.id]
    );

    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, @0
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'ADMIN';
      `,
      [viewer.id]
    );

    /* Any existing editors are being granted editor + viewer */
    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, u.role_id
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'SUPPLIER_EDITOR';
      `
    );

    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, @0
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'SUPPLIER_EDITOR';
      `,
      [viewer.id]
    );

    /* Existing viewers have their viewer permission moved to a user role */
    await queryRunner.query(
      `
        INSERT INTO [USER_ROLE] (user_id, role_id)
        SELECT u.id AS user_id, u.role_id
        FROM [USER] u
        LEFT JOIN [ROLE] r ON r.id = u.role_id
        WHERE r.name = 'SUPPLIER_VIEWER';
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE FROM USER_ROLE');
  }
}
