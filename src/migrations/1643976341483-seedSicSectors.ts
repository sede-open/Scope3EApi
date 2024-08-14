import LineByLineReader from 'line-by-line';
import { MigrationInterface, QueryRunner } from 'typeorm';
import { logger } from '../utils/logger';

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

      const threeDigit = words[2];
      const sectorName = words.splice(4, words.length).join(' ');

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

      logger.debug(`Performing upsert sector: ${threeDigit} - ${sectorName}`);
      const promise = queryRunner.query(
        `
            MERGE INTO [SECTOR] WITH (HOLDLOCK) AS target
            USING 
                (SELECT @0 AS industry_code) AS source 
            ON 
                (target.industry_code = source.industry_code)
            WHEN MATCHED 
                THEN 
                    UPDATE SET 
                        target.industry_code  = source.industry_code,
                        target.name = @1,
                        target.source_name = @2
            WHEN NOT MATCHED THEN 
                INSERT (name, industry_code, industry_type, source_name) VALUES (@1, @0, @3, @2)
            ;
          `,
        [
          threeDigit,
          sectorName,
          'DNB',
          'US Standard Industry Code 1987 - 3 digit',
        ]
      );
      promises.push(promise);
    });
    lineReader.on('error', (err) => {
      reject(err);
    });

    lineReader.on('end', async () => {
      await Promise.all(promises);
      logger.debug('Finished migrating sectors');
      resolve('');
    });
  });
};

export class seedSicSectors1643976341483 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await processIndustryData(queryRunner);
  }

  public async down(): Promise<void> {
    /** Non-reversible */
  }
}
