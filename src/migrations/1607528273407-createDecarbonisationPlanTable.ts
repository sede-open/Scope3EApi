import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'DECARBONISATION_PLAN';
const COMPANY_TABLE_NAME = 'COMPANY';
const USER_TABLE_NAME = 'USER';
const COMPANY_COLUMN = 'company_id';
const CREATED_BY_COLUMN = 'created_by';
const UPDATED_BY_COLUMN = 'updated_by';

export class createDecarbonisationPlanTable1607528273407
  implements MigrationInterface {
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
            name: 'year',
            type: 'int',
          },
          {
            name: 'activities_completed',
            type: 'varchar(500)',
          },
          {
            name: 'activities_went_well',
            type: 'varchar(500)',
          },
          {
            name: 'activities_to_continue',
            type: 'varchar(500)',
          },
          {
            name: 'activities_to_improve',
            type: 'varchar(500)',
          },
          {
            name: COMPANY_COLUMN,
            type: 'uniqueidentifier',
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
