import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'DECARBONISATION_PLAN';
const ACTIVITIES_COMPLETED_COLUMN = 'activities_completed';
const ACTIVITIES_WENT_WELL_COLUMN = 'activities_went_well';
const ACTIVITIES_CONTINUE_COLUMN = 'activities_to_continue';
const ACTIVITIES_IMPROVE_COLUMN = 'activities_to_improve';

export class updateDecarbonisationPlanTable1608117835678
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_COMPLETED_COLUMN,
      new TableColumn({
        name: ACTIVITIES_COMPLETED_COLUMN,
        type: 'varchar(500)',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_WENT_WELL_COLUMN,
      new TableColumn({
        name: ACTIVITIES_WENT_WELL_COLUMN,
        type: 'varchar(500)',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_CONTINUE_COLUMN,
      new TableColumn({
        name: ACTIVITIES_CONTINUE_COLUMN,
        type: 'varchar(500)',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_IMPROVE_COLUMN,
      new TableColumn({
        name: ACTIVITIES_IMPROVE_COLUMN,
        type: 'varchar(500)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_COMPLETED_COLUMN,
      new TableColumn({
        name: ACTIVITIES_COMPLETED_COLUMN,
        type: 'varchar(500)',
        isNullable: false,
        // setting to n/a but we should not need to revert this
        default: "'n/a'",
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_WENT_WELL_COLUMN,
      new TableColumn({
        name: ACTIVITIES_WENT_WELL_COLUMN,
        type: 'varchar(500)',
        isNullable: false,
        // setting to n/a but we should not need to revert this
        default: "'n/a'",
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_CONTINUE_COLUMN,
      new TableColumn({
        name: ACTIVITIES_CONTINUE_COLUMN,
        type: 'varchar(500)',
        isNullable: false,
        // setting to n/a but we should not need to revert this
        default: "'n/a'",
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      ACTIVITIES_IMPROVE_COLUMN,
      new TableColumn({
        name: ACTIVITIES_IMPROVE_COLUMN,
        type: 'varchar(500)',
        isNullable: false,
        // setting to n/a but we should not need to revert this
        default: "'n/a'",
      })
    );
  }
}
