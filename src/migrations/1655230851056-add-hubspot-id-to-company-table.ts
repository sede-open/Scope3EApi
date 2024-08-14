import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'COMPANY';
const HUBSPOT_ID = 'hubspot_id';

export class addHubspotIdToCompanyTable1655230851056
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: HUBSPOT_ID,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, HUBSPOT_ID);
  }
}
