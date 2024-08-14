import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const CARBON_INTENSITY_TABLE_NAME = 'CARBON_INTENSITY';
const CARBON_INTENSITY_TYPE_COLUMN_NAME = 'type';

const USER_SUBMITTED = 'USER_SUBMITTED';
const ESTIMATED = 'ESTIMATED';

export class addCarbonIntensitiesType1665752460736
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      CARBON_INTENSITY_TABLE_NAME,
      new TableColumn({
        name: CARBON_INTENSITY_TYPE_COLUMN_NAME,
        type: 'varchar(128)',
        enum: [USER_SUBMITTED, ESTIMATED],
        isNullable: false,
        default: `'USER_SUBMITTED'`,
      })
    );
    await queryRunner.query(
      'ALTER TABLE CARBON_INTENSITY ALTER COLUMN created_by uniqueidentifier NULL;'
    );
    await queryRunner.query(
      'DROP INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric" ON "CARBON_INTENSITY"'
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric_x_type" ON "CARBON_INTENSITY" ("emission_id", "year", "company_id", "carbon_intensity_metric", "type")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM [CARBON_INTENSITY] WHERE type = @0`, [
      ESTIMATED,
    ]);
    await queryRunner.query(
      'ALTER TABLE CARBON_INTENSITY ALTER COLUMN created_by uniqueidentifier;'
    );
    await queryRunner.query(
      'DROP INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric_x_type" ON "CARBON_INTENSITY"'
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric" ON "CARBON_INTENSITY" ("emission_id", "year", "company_id", "carbon_intensity_metric")'
    );
    await queryRunner.dropColumn(
      CARBON_INTENSITY_TABLE_NAME,
      CARBON_INTENSITY_TYPE_COLUMN_NAME
    );
  }
}
