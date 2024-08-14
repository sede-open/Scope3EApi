import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableColumn,
} from 'typeorm';

const TABLE_NAME = 'ROLE';
const USER_TABLE_NAME = 'USER';
const ROLE_COLUMN = 'role_id';

const ADMIN_ROLE_NAME = 'ADMIN';
const SUPPLIER_VIEWER_ROLE_NAME = 'SUPPLIER_VIEWER';
const SUPPLIER_EDITOR_ROLE_NAME = 'SUPPLIER_EDITOR';

export class createRoleTableAndSeed1598611776953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME,
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            isGenerated: true,
            default: 'newid()',
          },
          {
            name: 'name',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // update user table to add roleId column
    await queryRunner.addColumn(
      USER_TABLE_NAME,
      new TableColumn({
        name: ROLE_COLUMN,
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      USER_TABLE_NAME,
      new TableForeignKey({
        columnNames: [ROLE_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.query(
      `
        INSERT INTO "${TABLE_NAME}" (name)
        VALUES
        ('${ADMIN_ROLE_NAME}'),
        ('${SUPPLIER_VIEWER_ROLE_NAME}'),
        ('${SUPPLIER_EDITOR_ROLE_NAME}');
      `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(USER_TABLE_NAME);

    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(ROLE_COLUMN) !== -1
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(USER_TABLE_NAME, foreignKey);
    }

    await queryRunner.dropColumn(USER_TABLE_NAME, ROLE_COLUMN);
    await queryRunner.dropTable(TABLE_NAME);
  }
}
