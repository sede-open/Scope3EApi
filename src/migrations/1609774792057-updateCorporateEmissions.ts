import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'CORPORATE_EMISSION';
const SCOPE_2_TYPE_COLUMN_NAME = 'scope_2_type';

export class updateCorporateEmissions1609774792057
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: SCOPE_2_TYPE_COLUMN_NAME,
        type: 'varchar(10)',
        isNullable: false,
        default: "'MARKET'",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, SCOPE_2_TYPE_COLUMN_NAME);
  }
}
