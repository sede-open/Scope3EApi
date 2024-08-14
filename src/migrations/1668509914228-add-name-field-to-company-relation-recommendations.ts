import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE =
  'COMPANY_RELATIONSHIP_RECOMMENDATION';
const COMPANY_NAME_COLUMN = 'company_name';

export class addNameFieldToCompanyRelationRecommendations1668509914228
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableColumn({
        name: COMPANY_NAME_COLUMN,
        type: 'varchar(128)',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      COMPANY_NAME_COLUMN
    );
  }
}
