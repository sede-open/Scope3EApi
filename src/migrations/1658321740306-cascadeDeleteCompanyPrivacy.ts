import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';
import { COMPANY_PRIVACY_TABLE_NAME } from './1657199723783-createCompanyPrivacyTable';

export class casadeDeleteCompanyPrivacy1658321740306
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKey(
      COMPANY_PRIVACY_TABLE_NAME,
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'COMPANY',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(COMPANY_PRIVACY_TABLE_NAME);
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('company_id') !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(COMPANY_PRIVACY_TABLE_NAME, foreignKey);
    }
  }
}
