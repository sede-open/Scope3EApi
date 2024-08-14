import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';
import {
  CompanyRelationshipRecommendationStatus,
  CompanyRelationshipType,
} from '../types';

const COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE =
  'COMPANY_RELATIONSHIP_RECOMMENDATION';
const COMPANY_TABLE = 'COMPANY';
const USER_TABLE = 'USER';

const RECOMMENDATION_FOR_COMPANY_ID_COLUMN = 'recommendation_for_company_id';
const REVIEWED_BY_COLUMN = 'reviewed_by';

export class createCompanyRelationshipRecommendationTable1667483497805
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
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
            name: RECOMMENDATION_FOR_COMPANY_ID_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'recommended_company_duns',
            type: 'varchar(100)',
            isNullable: true,
          },
          {
            name: 'recommended_company_ciq_id',
            type: 'varchar(100)',
            isNullable: false,
          },
          {
            name: 'external_relationship_type',
            type: 'varchar(100)',
            isNullable: false,
          },
          {
            name: 'reviewed_by',
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: 'reviewed_at',
            type: 'datetime',
            isNullable: true,
          },
        ],
      }),
      true
    );

    queryRunner.query(`
        ALTER TABLE dbo.${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}
        ADD native_relationship_type varchar(50) null
        CONSTRAINT check_native_relationship_type 
        CHECK (native_relationship_type IN('${CompanyRelationshipType.Customer}', '${CompanyRelationshipType.Supplier}'))
    `);

    queryRunner.query(`
        ALTER TABLE dbo.${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}
        ADD recommendation_status varchar(50) null
        CONSTRAINT check_recommendation_status 
        CHECK (recommendation_status IN('${CompanyRelationshipRecommendationStatus.Unacknowledged}', '${CompanyRelationshipRecommendationStatus.Accepted}', '${CompanyRelationshipRecommendationStatus.Declined}'))
    `);

    await queryRunner.createForeignKey(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableForeignKey({
        columnNames: [RECOMMENDATION_FOR_COMPANY_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
      new TableForeignKey({
        columnNames: [REVIEWED_BY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE,
      })
    );

    await queryRunner.query(`
        CREATE UNIQUE INDEX "UNIQUE_recommended_company_duns_x_recommendation_for_company_id"
        ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}" ("recommended_company_duns", "${RECOMMENDATION_FOR_COMPANY_ID_COLUMN}", "native_relationship_type")
        WHERE recommended_company_duns IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop Indexes
    await queryRunner.query(
      `DROP INDEX "UNIQUE_recommended_company_duns_x_recommendation_for_company_id" ON "${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}"`
    );

    // Drop constraints
    await queryRunner.query(`
        ALTER TABLE dbo.${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}
        DROP CONSTRAINT check_native_relationship_type
    `);
    await queryRunner.query(`
        ALTER TABLE dbo.${COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE}
        DROP CONSTRAINT check_recommendation_status
    `);

    const table = await queryRunner.getTable(
      COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE
    );

    // Drop FK's
    const companyFK = table?.foreignKeys.find(
      (fk) =>
        fk.columnNames.indexOf(RECOMMENDATION_FOR_COMPANY_ID_COLUMN) !== -1
    );
    if (companyFK) {
      await queryRunner.dropForeignKey(
        COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
        companyFK
      );
    }

    const userFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(REVIEWED_BY_COLUMN) !== -1
    );
    if (userFK) {
      await queryRunner.dropForeignKey(
        COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE,
        userFK
      );
    }

    // Drop Table
    await queryRunner.dropTable(COMPANY_RELATIONSHIP_RECOMMENDATION_TABLE);
  }
}
