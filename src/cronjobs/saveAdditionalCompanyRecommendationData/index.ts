import { SlackClient } from '../../clients/SlackClient';
import { getConfig } from '../../config';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { runCronJob } from '../utils';
import {
  getDnBService,
  getQuickConnectService,
} from '../../utils/apolloContext';
import { getOrCreateConnection } from '../../dbConnection';
import { DnBClient } from '../../clients/DnBClient';
import { DnBApiError } from '../../errors/dnbApiError';
import {
  DNB_DELETED_DUNS_ERROR_CODE,
  DNB_DUNS_DOES_NOT_EXIST_ERROR_CODE,
} from '../../clients/DnBClient/constants';
import { FetchError } from 'node-fetch';
import { logger } from '../../utils/logger';

export const JOB_NAME = 'Save Additional Company Recommendation Data';

const {
  slack: {
    token: slackToken,
    channels: { xyzAlerts },
  },
  sAndP: { token },
  dnb: { key: dnbKey, secret: dnbSecret },
} = getConfig();

/**
 * This cronjob is used to save additional data for company relationship recommendations.
 *
 * The job runs secondary to the buildCompanyConnections cronjob that saves the initial
 * company relationship recommendations.
 *
 * The first job fetches data from the S&P API and saves it as a recommendation in the
 * database. This job then further enhances the recommendation by querying the D&B API
 * and updating the records with additional data.
 *
 * Architecturally it would be better to run this job in a more event-driven manner. You
 * could emit an event any time a CompanyRelationshipRecommendation is created and then
 * have a separate service that listens for those events and updates the data. However,
 * we do not have a suitable event bus at the moment. There are TypeORM subscribers,
 * however they have some limitations, and I am not inclined to add further dependency
 * on them.
 */
export const run = async () => {
  const slackClient = new SlackClient(slackToken);
  const databaseService = new DatabaseService();
  const connection = await getOrCreateConnection();

  const dnb = new DnBClient(dnbKey, dnbSecret);
  const dnbService = getDnBService(dnb, databaseService);
  const quickConnectService = getQuickConnectService(
    connection,
    token,
    databaseService
  );

  const totals = { updated: 0 };
  const dunsNumbersDeletedFromDnB = [];

  const recommendations = await quickConnectService.findRecommendationsMissingBusinessData();

  await slackClient.postMessage(
    `Found ${recommendations.length} recommendations missing additional business data.`,
    xyzAlerts
  );

  for await (const recommendation of recommendations) {
    try {
      const dnbData = await dnbService.companyByDuns(
        recommendation.recommendedCompanyDuns
      );

      if (!dnbData) {
        continue;
      }

      const {
        countryName: country,
        region,
        primarySector: { industryDescription: sector },
      } = dnbData;

      await quickConnectService.saveRecommendationBusinessData({
        id: recommendation.id,
        country,
        region,
        sector,
      });

      totals.updated += 1;

      if (totals.updated % 500 === 0) {
        await slackClient.postMessage(
          `Updated ${totals.updated} recommendations.`,
          xyzAlerts
        );
      }
    } catch (error) {
      /**
       * Some Duns numbers have been deleted in D&B, but not propogated to the S&P system.
       * This means that the recommendation is invalid, so we mark it as deleted in the database.
       *
       * We must mark as deleted rather than actually delete the record, else it will be created
       * again.
       */
      if (
        error instanceof DnBApiError &&
        [
          DNB_DELETED_DUNS_ERROR_CODE,
          DNB_DUNS_DOES_NOT_EXIST_ERROR_CODE,
        ].includes(error.code)
      ) {
        dunsNumbersDeletedFromDnB.push(recommendation.recommendedCompanyDuns);
        continue;
      }
      /** There's an unexplained redirect case that happens for like 0.1% of DUNS numbers in the recommendations table */
      if (error instanceof FetchError) {
        logger.error(
          `Fetch error: ${error.message}, Error Code: ${error.code}, Duns: ${recommendation.recommendedCompanyDuns}`
        );
        continue;
      }
      throw error;
    }
  }

  await quickConnectService.markRecommendationsWithDeletedDuns(
    dunsNumbersDeletedFromDnB
  );
  await slackClient.postMessage(
    `Updated ${dunsNumbersDeletedFromDnB.length} recommendations with deleted DUNS numbers.`,
    xyzAlerts
  );

  await slackClient.postMessage(
    `Saved additional business data for ${totals.updated} recommendations.`,
    xyzAlerts
  );
};

if (require.main === module) {
  runCronJob(run, JOB_NAME, xyzAlerts);
}
