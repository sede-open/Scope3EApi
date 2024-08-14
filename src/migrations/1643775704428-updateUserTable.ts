import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'USER';
const EXPERTISE_DOMAIN_COLUMN_NAME = 'expertise_domain';

export class updateUserTable1643775704428 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: EXPERTISE_DOMAIN_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, EXPERTISE_DOMAIN_COLUMN_NAME);
  }
}
