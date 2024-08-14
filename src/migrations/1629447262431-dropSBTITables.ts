import { MigrationInterface, QueryRunner, Table } from 'typeorm';
import { companiesSeed } from '../seedData/sbtiSectorData';
import { CompanySectorType, SbtiSystemName } from '../types';
const SBTI_SECTOR_TABLE_NAME = 'SBTI_SECTOR';
const COMPANY_SBTI_SECTOR_TABLE_NAME = 'COMPANY_SBTI_SECTOR';

export class dropSBTITables1629447262431 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(COMPANY_SBTI_SECTOR_TABLE_NAME);
    await queryRunner.dropTable(SBTI_SECTOR_TABLE_NAME);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: SBTI_SECTOR_TABLE_NAME,
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
            type: 'varchar',
          },
          {
            name: 'system_name',
            type: 'varchar',
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

    await queryRunner.createTable(
      new Table({
        name: COMPANY_SBTI_SECTOR_TABLE_NAME,
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
            name: 'company_id',
            type: 'uniqueidentifier',
          },
          {
            name: 'sbti_sector_id',
            type: 'uniqueidentifier',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: 'created_by',
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: 'updated_by',
            type: 'uniqueidentifier',
            isNullable: true,
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

    await Promise.all(
      companiesSeed.map(async ({ companyName, sectors }) => {
        const [
          foundCompany,
        ] = await queryRunner.query(`SELECT * FROM COMPANY WHERE name = @0`, [
          companyName,
        ]);

        if (foundCompany) {
          await Promise.all(
            sectors.map(
              async ({
                systemName,
                type,
              }: {
                systemName: SbtiSystemName;
                type: CompanySectorType;
              }) => {
                const [foundSector] = await queryRunner.query(
                  `
                  SELECT * FROM SBTI_SECTOR
                  WHERE system_name = @0`,
                  [systemName]
                );

                if (foundSector) {
                  await queryRunner.query(
                    `
                    INSERT INTO COMPANY_SBTI_SECTOR (company_id, sbti_sector_id, type)
                    VALUES (@0, @1, @2)
                  `,
                    [foundCompany.id, foundSector.id, type]
                  );
                }
              }
            )
          );
        }
      })
    );
  }
}
