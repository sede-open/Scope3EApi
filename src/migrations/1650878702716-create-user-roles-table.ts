import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const USER_ROLES_TABLE_NAME = 'USER_ROLE';
const USERS_TABLE_NAME = 'USER';
const ROLE_TABLE_NAME = 'ROLE';
const USER_ID_COLUMN = 'user_id';
const ROLE_ID_COLUMN = 'role_id';

export class createUserRolesTable1650878702716 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: USER_ROLES_TABLE_NAME,
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'newid()',
          },
          {
            name: USER_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: ROLE_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      USER_ROLES_TABLE_NAME,
      new TableForeignKey({
        columnNames: [USER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USERS_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      USER_ROLES_TABLE_NAME,
      new TableForeignKey({
        columnNames: [ROLE_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: ROLE_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(USER_ROLES_TABLE_NAME);

    const targetIdFk = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes(ROLE_ID_COLUMN)
    );

    if (targetIdFk) {
      await queryRunner.dropForeignKey(USER_ROLES_TABLE_NAME, targetIdFk);
    }

    const carbonIntensityIdFk = table?.foreignKeys.find((fk) =>
      fk.columnNames.includes(USER_ID_COLUMN)
    );

    if (carbonIntensityIdFk) {
      await queryRunner.dropForeignKey(
        USER_ROLES_TABLE_NAME,
        carbonIntensityIdFk
      );
    }

    await queryRunner.dropTable(USER_ROLES_TABLE_NAME);
  }
}
