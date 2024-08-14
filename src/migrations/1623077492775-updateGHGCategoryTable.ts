import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'GHG_PROTOCOL_CATEGORY';
const SYSTEM_NAME_COLUMN_NAME = 'system_name';

export class updateGHGCategoryTable1623077492775 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: SYSTEM_NAME_COLUMN_NAME,
        type: 'varchar(50)',
        isNullable: false,
        default: "'n/a'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, SYSTEM_NAME_COLUMN_NAME);
  }
}
