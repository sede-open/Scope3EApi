import { MigrationInterface, QueryRunner } from 'typeorm';

export class addUniqueIndexes1647419483136 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE UNIQUE INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric" ON "CARBON_INTENSITY" ("emission_id", "year", "company_id", "carbon_intensity_metric")'
    );

    await queryRunner.query(
      'CREATE UNIQUE INDEX "UNIQUE_intensity_x_target" ON "CARBON_INTENSITY_TARGET" ("carbon_intensity_id", "target_id")'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "UNIQUE_emission_x_year_x_company_x_intensityMetric" ON "CARBON_INTENSITY"'
    );

    await queryRunner.query(
      'DROP INDEX "UNIQUE_intensity_x_target" ON "CARBON_INTENSITY_TARGET"'
    );
  }
}
