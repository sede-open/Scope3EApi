import { MigrationInterface, QueryRunner } from 'typeorm';

export class migrateEmissionHeadcountToIntensity1648650158160
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO CARBON_INTENSITY (
        emission_id,
        company_id,
        year,
        created_by,
        carbon_intensity_value,
        carbon_intensity_metric
      )
      SELECT
        id as emission_id,
        company_id,
        year,
        created_by,
        head_count as carbon_intensity_value,
        'NUMBER_OF_EMPLOYEES' as carbon_intensity_metric
      FROM CORPORATE_EMISSION
      WHERE head_count IS NOT NULL;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DELETE CARBON_INTENSITY');
  }
}
