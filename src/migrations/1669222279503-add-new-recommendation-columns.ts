import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE =
  'COMPANY_RELATIONSHIP_RECOMMENDATION';
const SECTOR_COLUMN = 'sector';
const REGION_COLUMN = 'region';
const COUNTRY_COLUMN = 'country';

export class addNewRecommendationColumns1669222279503
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableColumn({
        name: SECTOR_COLUMN,
        type: 'varchar(128)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableColumn({
        name: REGION_COLUMN,
        type: 'varchar(128)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableColumn({
        name: COUNTRY_COLUMN,
        type: 'varchar(128)',
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      SECTOR_COLUMN
    );

    await queryRunner.dropColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      REGION_COLUMN
    );

    await queryRunner.dropColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      COUNTRY_COLUMN
    );
  }
}
