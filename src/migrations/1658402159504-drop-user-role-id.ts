import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const USER_TABLE_NAME = 'USER';
const ROLE_TABLE_NAME = 'ROLE';
const ROLE_COLUMN = 'role_id';

export class dropUserRoleId1658402159504 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(USER_TABLE_NAME);

    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(ROLE_COLUMN) !== -1
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(USER_TABLE_NAME, foreignKey);
    }

    await queryRunner.dropColumn(USER_TABLE_NAME, ROLE_COLUMN);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
        referencedTableName: ROLE_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );
  }
}
