import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'CARBON_INTENSITY';
const USER_TABLE_NAME = 'USER';
const COMPANY_TABLE_NAME = 'COMPANY';
const CORPORATE_EMISSION_TABLE_NAME = 'CORPORATE_EMISSION';
const CREATED_BY_COLUMN = 'created_by';
const UPDATED_BY_COLUMN = 'updated_by';
const COMPANY_COLUMN = 'company_id';
const EMISSION_ID_COLUMN = 'emission_id';

export class createCarbonIntensityTable1642773896472
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
            name: COMPANY_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'year',
            type: 'int',
            isNullable: false,
          },
          {
            name: 'carbon_intensity_metric',
            type: 'varchar(100)',
            isNullable: false,
          },
          {
            name: 'carbon_intensity_value',
            type: 'float',
            isNullable: false,
          },
          {
            name: EMISSION_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: CREATED_BY_COLUMN,
            type: 'uniqueidentifier',
            isNullable: false,
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
            isNullable: true,
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
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [EMISSION_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: CORPORATE_EMISSION_TABLE_NAME,
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

    const createdByFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CREATED_BY_COLUMN) !== -1
    );
    if (createdByFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, createdByFK);
    }

    const updatedByFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(UPDATED_BY_COLUMN) !== -1
    );
    if (updatedByFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, updatedByFK);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
