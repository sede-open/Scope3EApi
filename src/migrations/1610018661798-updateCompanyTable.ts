import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'COMPANY';
const DUNS_COLUMN_NAME = 'dnb_duns';
const COUNTRY_COLUMN_NAME = 'dnb_country';
const REGION_COLUMN_NAME = 'dnb_region';
const HEADCOUNT_COLUMN_NAME = 'dnb_headcount';

export class updateCompanyTable1610018661798 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: DUNS_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: COUNTRY_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: REGION_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: HEADCOUNT_COLUMN_NAME,
        type: 'integer',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, DUNS_COLUMN_NAME);
    await queryRunner.dropColumn(TABLE_NAME, COUNTRY_COLUMN_NAME);
    await queryRunner.dropColumn(TABLE_NAME, REGION_COLUMN_NAME);
    await queryRunner.dropColumn(TABLE_NAME, HEADCOUNT_COLUMN_NAME);
  }
}
