import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateHideEmissionsTrendlinePreference1619102123557
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      'PREFERENCES',
      'hideEmissionsTrendline',
      'hide_emissions_trendline'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      'PREFERENCES',
      'hide_emissions_trendline',
      'hideEmissionsTrendline'
    );
  }
}
