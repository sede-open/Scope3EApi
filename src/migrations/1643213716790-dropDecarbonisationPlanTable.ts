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

export class dropDecarbonisationPlanTable1643213716790
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    return queryRunner.dropTable(TABLE_NAME);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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
            type: 'varchar(max)',
            isNullable: true,
          },
          {
            name: 'activities_went_well',
            type: 'varchar(max)',
            isNullable: true,
          },
          {
            name: 'activities_to_continue',
            type: 'varchar(max)',
            isNullable: true,
          },
          {
            name: 'activities_to_improve',
            type: 'varchar(max)',
            isNullable: true,
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
}
