import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'EMISSION_ALLOCATION';
const NOTE_COLUMN_NAME = 'note';

export class updateEmissionAllocationTable1621005581546
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: NOTE_COLUMN_NAME,
        type: 'varchar(300)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, NOTE_COLUMN_NAME);
  }
}
