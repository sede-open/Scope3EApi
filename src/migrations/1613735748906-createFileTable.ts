import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'FILE';
const COMPANY_TABLE_NAME = 'COMPANY';
const COMPANY_ID_COLUMN = 'company_id';
const USER_TABLE_NAME = 'USER';
const USER_ID_COLUMN = 'created_by';

export class createFileTable1613735748906 implements MigrationInterface {
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
            name: COMPANY_ID_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'original_filename',
            type: 'varchar',
          },
          {
            name: 'azure_blob_filename',
            type: 'varchar',
          },
          {
            name: 'mimetype',
            type: 'varchar',
          },
          {
            name: 'size_in_bytes',
            type: 'float',
          },
          {
            name: 'created_by',
            type: 'uniqueidentifier',
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
        columnNames: [COMPANY_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [USER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);

    const companyFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(COMPANY_ID_COLUMN) !== -1
    );
    if (companyFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, companyFK);
    }

    const userFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(USER_ID_COLUMN) !== -1
    );
    if (userFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, userFK);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
