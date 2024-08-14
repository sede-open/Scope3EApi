import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE =
  'COMPANY_RELATIONSHIP_RECOMMENDATION';
const IS_DELETED_COLUMN = 'is_deleted_in_dnb';

export class addIsDeletedInDnbToRecommendations1669639984271
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableColumn({
        name: IS_DELETED_COLUMN,
        type: 'bit',
        isNullable: true,
      })
    );

    await queryRunner.query(
      `UPDATE ${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE} SET ${IS_DELETED_COLUMN} = 0`
    );

    await queryRunner.changeColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      IS_DELETED_COLUMN,
      new TableColumn({
        name: IS_DELETED_COLUMN,
        type: 'bit',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      IS_DELETED_COLUMN
    );
  }
}
