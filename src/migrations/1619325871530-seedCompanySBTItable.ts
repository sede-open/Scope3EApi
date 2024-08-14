import { MigrationInterface, QueryRunner } from 'typeorm';
import { CompanySectorType, SbtiSystemName } from '../types';
import { companiesSeed } from '../seedData/sbtiSectorData';

export class seedCompanySBTItable1619325871530 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM COMPANY_SBTI_SECTOR`);
  }
}
