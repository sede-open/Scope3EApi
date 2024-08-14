import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'COMPANY';
const STATUS_COLUMN_NAME = 'status';

export class updateCompanyTable1620309944546 implements MigrationInterface {
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

    await queryRunner.query(
      'ALTER TABLE COMPANY ALTER COLUMN business_sector varchar(255) NULL'
    );

    await queryRunner.query(
      'ALTER TABLE COMPANY ALTER COLUMN sub_sector varchar(255) NULL'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, STATUS_COLUMN_NAME);

    await queryRunner.query(`
      UPDATE COMPANY
      SET business_sector = ''
      WHERE business_sector IS NULL;
    `);

    await queryRunner.query(
      'ALTER TABLE COMPANY ALTER COLUMN business_sector varchar(255) NOT NULL'
    );

    await queryRunner.query(`
      UPDATE COMPANY
      SET sub_sector = ''
      WHERE sub_sector IS NULL;
    `);

    await queryRunner.query(
      'ALTER TABLE COMPANY ALTER COLUMN sub_sector varchar(255) NOT NULL'
    );
  }
}
