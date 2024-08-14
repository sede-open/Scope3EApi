import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'TARGET';
const OFFSET_COLUMN_NAME = 'include_carbon_offset';
const TYPE_COLUMN_NAME = 'type';

export class updateTargetTable1615199657597 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: OFFSET_COLUMN_NAME,
        type: 'bit',
        isNullable: false,
        default: 0,
      })
    );

    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: TYPE_COLUMN_NAME,
        type: 'varchar(10)',
        isNullable: false,
        default: "'SCOPE_1_2'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, OFFSET_COLUMN_NAME);
    await queryRunner.dropColumn(TABLE_NAME, TYPE_COLUMN_NAME);
  }
}
