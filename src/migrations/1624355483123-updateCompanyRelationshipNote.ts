import { MigrationInterface, QueryRunner } from 'typeorm';

const TABLE_NAME = 'COMPANY_RELATIONSHIP';
const NOTE_COLUMN_NAME = 'note';

export class updateCompanyRelationshipNote1624355483123
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${NOTE_COLUMN_NAME} nvarchar(max)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${TABLE_NAME} ALTER COLUMN ${NOTE_COLUMN_NAME} varchar(300)`
    );
  }
}
