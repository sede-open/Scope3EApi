import { MigrationInterface, QueryRunner } from 'typeorm';

export class updateSolutionInterests1623322030773
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "SOLUTION_INTERESTS" ("name", "system_name") VALUES
      ('Fuel Switch', 'FUEL_SWITCH'),
      ('Behaviour Change', 'BEHAVIOUR_CHANGE');
    `);

    await queryRunner.query(`
      DELETE FROM "SOLUTION_INTERESTS"
      WHERE name in ('Fuel Switch Aviation', 'Fuel Switch Marine', 'Fuel Switch Road', 'New Processes');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "SOLUTION_INTERESTS"
      WHERE name in ('Fuel Switch', 'Behaviour Change');
    `);

    await queryRunner.query(`
      INSERT INTO "SOLUTION_INTERESTS" ("name", "system_name") VALUES
      ('Fuel Switch Aviation', 'FUEL_SWITCH_AVIATION'),
      ('Fuel Switch Marine', 'FUEL_SWITCH_MARINE'),
      ('Fuel Switch Road', 'FUEL_SWITCH_MARINE'),
      ('New Processes', 'NEW_PROCESSES')
    `);
  }
}
