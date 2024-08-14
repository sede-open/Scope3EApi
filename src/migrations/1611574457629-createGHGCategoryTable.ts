import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const TABLE_NAME = 'GHG_PROTOCOL_CATEGORY';

export class createGHGCategoryTable1611574457629 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME,
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
            name: 'name',
            type: 'varchar(250)',
          },
          {
            name: 'order',
            type: 'integer',
          },
          {
            name: 'type',
            type: 'varchar(250)',
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.query(`
      INSERT INTO "GHG_PROTOCOL_CATEGORY" ("name", "type", "order", "created_at") VALUES
      ('Cat. 1 - Purchased goods and services', 'SCOPE_3', 1, CURRENT_TIMESTAMP),
      ('Cat. 2 - Capital goods', 'SCOPE_3', 2, CURRENT_TIMESTAMP),
      ('Cat. 3 - Fuel- and energy-related activities', 'SCOPE_3', 3, CURRENT_TIMESTAMP),
      ('Cat. 4 - Upstream transportation and distribution', 'SCOPE_3', 4, CURRENT_TIMESTAMP),
      ('Cat. 5 - Waste generated in operations', 'SCOPE_3', 5, CURRENT_TIMESTAMP),
      ('Cat. 6 - Business travel', 'SCOPE_3', 6, CURRENT_TIMESTAMP),
      ('Cat. 7 - Employee commuting', 'SCOPE_3', 7, CURRENT_TIMESTAMP),
      ('Cat. 8 - Upstream leased assets', 'SCOPE_3', 8, CURRENT_TIMESTAMP),
      ('Cat. 9 - Downstream transportation and distribution', 'SCOPE_3', 9, CURRENT_TIMESTAMP),
      ('Cat. 10 - Processing of sold products', 'SCOPE_3', 10, CURRENT_TIMESTAMP),
      ('Cat. 11 - Use of sold products', 'SCOPE_3', 11, CURRENT_TIMESTAMP),
      ('Cat. 12 - End-of-life treatment of sold products', 'SCOPE_3', 12, CURRENT_TIMESTAMP),
      ('Cat. 13 - Downstream leased assets', 'SCOPE_3', 13, CURRENT_TIMESTAMP),
      ('Cat. 14 - Franchises', 'SCOPE_3', 14, CURRENT_TIMESTAMP),
      ('Cat. 15 - Investments', 'SCOPE_3', 15, CURRENT_TIMESTAMP);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(TABLE_NAME);
  }
}
