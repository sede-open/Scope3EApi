import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export const COMPANY_PRIVACY_TABLE_NAME = 'COMPANY_PRIVACY';

export class createCompanyPrivacyTable1657199723783
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: COMPANY_PRIVACY_TABLE_NAME,
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'newid()',
          },
          {
            name: 'company_id',
            type: 'uniqueidentifier',
          },
          {
            name: 'all_platform',
            type: 'bit',
          },
          {
            name: 'customer_network',
            type: 'bit',
          },
          {
            name: 'supplier_network',
            type: 'bit',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(COMPANY_PRIVACY_TABLE_NAME);
  }
}
