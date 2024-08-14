import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const TABLE_NAME = 'SECTOR';

export class createSectorTable1628608327324 implements MigrationInterface {
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
            type: 'nvarchar(max)',
            isNullable: false,
          },
          {
            name: 'industry_code',
            type: 'varchar(10)',
            isNullable: false,
          },
          {
            name: 'industry_type',
            type: 'nvarchar(max)',
            isNullable: false,
          },
          {
            name: 'source_name',
            type: 'nvarchar(100)',
            isNullable: false,
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
    await queryRunner.dropTable(TABLE_NAME);
  }
}
