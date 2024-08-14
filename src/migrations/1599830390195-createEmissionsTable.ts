import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'CORPORATE_EMISSION';
const COMPANY_TABLE_NAME = 'COMPANY';
const COMPANY_COLUMN = 'company_id';
const USER_TABLE_NAME = 'USER';
const CREATED_BY_COLUMN = 'created_by';
const UPDATED_BY_COLUMN = 'updated_by';

export class createEmissionsTable1599830390195 implements MigrationInterface {
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
            name: COMPANY_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'type',
            type: 'varchar(20)',
          },
          {
            name: 'year',
            type: 'integer',
          },
          {
            name: 'scope_1',
            type: 'float',
          },
          {
            name: 'scope_2',
            type: 'float',
          },
          {
            name: 'scope_3',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'offset',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'example_percentage',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'head_count',
            type: 'integer',
            isNullable: true,
          },
          {
            name: CREATED_BY_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: UPDATED_BY_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
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

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [COMPANY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CREATED_BY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [UPDATED_BY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const companyFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(COMPANY_COLUMN) !== -1
    );
    if (companyFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, companyFK);
    }

    const creatorFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CREATED_BY_COLUMN) !== -1
    );
    if (creatorFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, creatorFK);
    }

    const updatorFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(UPDATED_BY_COLUMN) !== -1
    );
    if (updatorFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, updatorFK);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
