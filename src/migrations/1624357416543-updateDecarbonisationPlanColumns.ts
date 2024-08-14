import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'DECARBONISATION_PLAN';
const ACTIVITIES_COMPLETED_COLUMN_NAME = 'activities_completed';
const ACTIVITIES_WENT_WELL_COLUMN_NAME = 'activities_went_well';
const ACTIVITIES_TO_CONTINUE_COLUMN_NAME = 'activities_to_continue';
const ACTIVITIES_TO_IMPROVE_COLUMN_NAME = 'activities_to_improve';

export class updateDecarbonisationPlanColumns1624357416543
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_COMPLETED_COLUMN_NAME} nvarchar(max)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_WENT_WELL_COLUMN_NAME} nvarchar(max)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_TO_CONTINUE_COLUMN_NAME} nvarchar(max)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_TO_IMPROVE_COLUMN_NAME} nvarchar(max)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_COMPLETED_COLUMN_NAME} varchar(500)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_WENT_WELL_COLUMN_NAME} varchar(500)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_TO_CONTINUE_COLUMN_NAME} varchar(500)`
    );
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${ACTIVITIES_TO_IMPROVE_COLUMN_NAME} varchar(500)`
    );
  }
}
