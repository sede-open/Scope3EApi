import { MigrationInterface, QueryRunner } from 'typeorm';

const COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE =
  'COMPANY_RELATIONSHIP_RECOMMENDATION';
const RECOMMENDATION_FOR_COMPANY_ID_COLUMN = 'recommendation_for_company_id';

export class ciqUniqueIndexOnRecommendations1668069176004
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UNIQUE_recommended_company_duns_x_recommendation_for_company_id" ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}"`
    );

    await queryRunner.query(`
        CREATE UNIQUE INDEX "UNIQUE_recommended_company_ciq_x_recommendation_for_company_id"
        ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}" ("recommended_company_ciq_id", "${RECOMMENDATION_FOR_COMPANY_ID_COLUMN}", "native_relationship_type")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "UNIQUE_recommended_company_ciq_x_recommendation_for_company_id" ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}"`
    );
    await queryRunner.query(`
        CREATE UNIQUE INDEX "UNIQUE_recommended_company_duns_x_recommendation_for_company_id"
        ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}" ("recommended_company_duns", "${RECOMMENDATION_FOR_COMPANY_ID_COLUMN}", "native_relationship_type")
        WHERE recommended_company_duns IS NOT NULL
    `);
  }
}
