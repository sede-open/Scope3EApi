import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'COMPANY';
const POSTAL_CODE_COLUMN_NAME = 'dnb_postal_code';
const ADDRESS_LINE_ONE_COLUMN_NAME = 'dnb_address_line_one';
const ADDRESS_LINE_TWO_COLUMN_NAME = 'dnb_address_line_two';

export class updateCompanyTable1634205623348 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: POSTAL_CODE_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: ADDRESS_LINE_ONE_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: ADDRESS_LINE_TWO_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, POSTAL_CODE_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, ADDRESS_LINE_ONE_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, ADDRESS_LINE_TWO_COLUMN_NAME);
  }
}
