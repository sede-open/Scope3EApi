import { MigrationInterface, QueryRunner } from 'typeorm';

const PREFERENCES_TABLE_NAME = 'PREFERENCES';
const HIDE_EMISSIONS_TRENDLINE_COLUMN_NAME = 'hide_emissions_trendline';
const SUPPRESS_TASK_LIST_PROMPT_COLUMN_NAME = 'suppress_task_list_prompt';

export class repurposeHideEmissionsTrendlinePreference1627477653353
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      PREFERENCES_TABLE_NAME,
      HIDE_EMISSIONS_TRENDLINE_COLUMN_NAME,
      SUPPRESS_TASK_LIST_PROMPT_COLUMN_NAME
    );
    await queryRunner.query(`
      UPDATE ${PREFERENCES_TABLE_NAME}
      SET ${SUPPRESS_TASK_LIST_PROMPT_COLUMN_NAME} = 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(
      PREFERENCES_TABLE_NAME,
      SUPPRESS_TASK_LIST_PROMPT_COLUMN_NAME,
      HIDE_EMISSIONS_TRENDLINE_COLUMN_NAME
    );
  }
}
