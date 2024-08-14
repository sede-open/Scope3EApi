import { MigrationInterface, QueryRunner } from 'typeorm';

export class createUserSolutionInterestsSystemNames1619615019668
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        INSERT INTO "SOLUTION_INTERESTS" ("name", "system_name") VALUES
        ('Carbon Capture', 'CARBON_CAPTURE'),
        ('Fuel Switch Aviation', 'FUEL_SWITCH_AVIATION'),
        ('Fuel Switch Marine', 'FUEL_SWITCH_MARINE'),
        ('Fuel Switch Road', 'FUEL_SWITCH_MARINE'),
        ('Material And Process Efficiency', 'MATERIAL_AND_PROCESS_EFFICIENCY'),
        ('Nature Based Solutions', 'NATURE_BASED_SOLUTIONS'),
        ('New Processes', 'NEW_PROCESSES'),
        ('Recycling', 'RECYCLING'),
        ('Renewable Heat', 'RENEWABLE_HEAT'),
        ('Renewable Power', 'RENEWABLE_POWER');
      `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        DELETE FROM SOLUTION_INTERESTS
        WHERE name in ('Carbon Capture', 'Fuel Switch Aviation', 'Fuel Switch Marine', 'Fuel Switch Road', 'Material And Process Efficiency', 'Nature Based Solutions', 'New Processes',
        'Recycling', 'Renewable Heat', 'Renewable Power');
      `);
  }
}
