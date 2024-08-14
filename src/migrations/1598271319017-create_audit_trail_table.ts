import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'AUDIT';
const USER_TABLE_NAME = 'USER';
const USER_COLUMN = 'user_id';

export class createAuditTrailTable1596807831297 implements MigrationInterface {
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
            generationStrategy: 'uuid',
            default: 'newid()',
          },
          {
            name: 'user_id',
            type: 'uniqueidentifier',
          },
          {
            name: 'action',
            type: 'varchar',
          },
          {
            name: 'current_payload',
            type: 'nvarchar(max)',
            isNullable: true,
          },
          {
            name: 'previous_payload',
            type: 'nvarchar(max)',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [USER_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(USER_COLUMN) !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(TABLE_NAME, foreignKey);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
