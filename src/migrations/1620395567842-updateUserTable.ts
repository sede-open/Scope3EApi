import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'USER';
const STATUS_COLUMN_NAME = 'status';

export class updateUserTable1620395567842 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: STATUS_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: false,
        default: "'ACTIVE'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, STATUS_COLUMN_NAME);
  }
}
