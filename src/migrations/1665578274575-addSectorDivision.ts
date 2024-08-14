import LineByLineReader from 'line-by-line';
import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';
import { logger } from '../utils/logger';

const SECTOR_TABLE_NAME = 'SECTOR';
const DIVISION_COLUMN_NAME = 'division';

const AGRICULTURE_FORESTRY_FISHING = 'AGRICULTURE_FORESTRY_FISHING';
const MINING = 'MINING';
const CONSTRUCTION = 'CONSTRUCTION';
const MANUFACTURING = 'MANUFACTURING';
const TRANSPORTATION_COMMUNICATIONS_ELECTRIC_GAS_SANITARY =
  'TRANSPORTATION_COMMUNICATIONS_ELECTRIC_GAS_SANITARY';
const WHOLESALE_TRADE = 'WHOLESALE_TRADE';
const RETAIL_TRADE = 'RETAIL_TRADE';
const FINANCE_INSURANCE_REAL_ESTATE = 'FINANCE_INSURANCE_REAL_ESTATE';
const SERVICES = 'SERVICES';
const PUBLIC_ADMINISTRATION = 'PUBLIC_ADMINISTRATION';

const divisionsMapping = {
  A: AGRICULTURE_FORESTRY_FISHING,
  B: MINING,
  C: CONSTRUCTION,
  D: MANUFACTURING,
  E: TRANSPORTATION_COMMUNICATIONS_ELECTRIC_GAS_SANITARY,
  F: WHOLESALE_TRADE,
  G: RETAIL_TRADE,
  H: FINANCE_INSURANCE_REAL_ESTATE,
  I: SERVICES,
  J: PUBLIC_ADMINISTRATION,
};

const processIndustryData = async (queryRunner: QueryRunner) => {
  const maxConcurrentConnections = 5;
  const lineReader = new LineByLineReader(
    `${__dirname}/../seedData/1987StandardIndustrialClassificationData.txt`
  );

  let lastIndustryCode: string;

  let promises: Promise<unknown>[] = [];

  await new Promise((resolve, reject) => {
    lineReader.on('line', async (line) => {
      if (line.startsWith('https')) {
        return;
      }

      if (promises.length >= maxConcurrentConnections) {
        lineReader.pause();
        logger.debug(
          `Awaiting promises at ${maxConcurrentConnections} concurrent connections, otherwise will flood DB connection pool`
        );
        await Promise.all(promises);
        promises = [];
        lineReader.resume();
      }

      const words = line.split(' ');

      const divisionChar = words[0] as keyof typeof divisionsMapping;
      const division = divisionsMapping[divisionChar];
      const threeDigit = words[2];

      /**
       * There are multiple 4 digit codes for each 3 digit code
       * we store only the first row containing a 3 digit code
       * as priority.
       */
      if (lastIndustryCode === threeDigit) {
        logger.debug(
          `Skipping additional sectors for three digit code ${threeDigit}`
        );
        return;
      }
      lastIndustryCode = threeDigit;

      logger.debug(`Performing update sector: ${threeDigit} - ${division}`);

      const promise = queryRunner.query(
        `
          UPDATE [SECTOR]
            SET
              division = @0
            WHERE
              industry_code = @1
        `,
        [division, threeDigit]
      );
      promises.push(promise);
    });
    lineReader.on('error', (err) => {
      reject(err);
    });

    lineReader.on('end', async () => {
      await Promise.all(promises);
      logger.debug('Finished migrating sectors divisions');
      resolve('');
    });
  });
};

export class addSectorDivision1665578274575 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      SECTOR_TABLE_NAME,
      new TableColumn({
        name: DIVISION_COLUMN_NAME,
        type: 'varchar(128)',
        enum: Object.values(divisionsMapping),
        isNullable: true,
      })
    );
    await processIndustryData(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(SECTOR_TABLE_NAME, DIVISION_COLUMN_NAME);
  }
}
