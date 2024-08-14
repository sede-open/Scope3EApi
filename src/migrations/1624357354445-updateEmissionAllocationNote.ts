import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'EMISSION_ALLOCATION';
const NOTE_COLUMN_NAME = 'note';

export class updateEmissionAllocationNote1624357354445
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${NOTE_COLUMN_NAME} nvarchar(max)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${NOTE_COLUMN_NAME} varchar(300)`
    );
  }
}
