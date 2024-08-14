import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'COMPANY_RELATIONSHIP';
const NOTE_COLUMN_NAME = 'note';

export class updateCompanyRelationshipTable1610445971070
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      TABLE_NAME,
      NOTE_COLUMN_NAME,
      new TableColumn({
        name: NOTE_COLUMN_NAME,
        type: 'varchar(max)',
        isNullable: true,
      })
    );
  }

  public async down(): Promise<void> {
    // no need to revert, fixing creation
    return Promise.resolve();
  }
}
