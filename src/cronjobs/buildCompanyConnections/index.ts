import { SAndPClient } from '../../clients/SAndPClient';
import { SlackClient } from '../../clients/SlackClient';
import { getConfig } from '../../config';
import { getOrCreateConnection } from '../../dbConnection';
import { CompanyRelationshipRecommendationRepository } from '../../repositories/CompanyRelationshipRecommendationRepository';
import { AppMetaRepository } from '../../repositories/AppMetaRepository';
import { CompanyQuickConnectService } from '../../services/CompanyQuickConnectService';
import { CompanyRelationshipRecommendationData } from '../../services/CompanyQuickConnectService/types';
import { extractCompanyIdentifiersFromAllKnownIdentifiers } from '../../services/CompanyQuickConnectService/utils';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { logger } from '../../utils/logger';
import { runCronJob } from '../utils';

const JOB_NAME = 'Build Company Connection Job';

const {
  slack: {
    token: slackToken,
    channels: { xyzAlerts },
  },
  sAndP: { token },
} = getConfig();

const run = async () => {
  const connection = await getOrCreateConnection();
  const slackClient = new SlackClient(slackToken);
  const sAndPClient = new SAndPClient(token);
  const databaseService = new DatabaseService();
  const companyRelationshipRecommendationRepository = connection.getCustomRepository(
    CompanyRelationshipRecommendationRepository
  );
  const quickConnectService = new CompanyQuickConnectService(
    databaseService,
    sAndPClient,
    companyRelationshipRecommendationRepository
  );
  const totals = { created: 0, duplicate: 0 };
  /**
   * TODO -- make optimisation here, only fetch companies which do not already have company relationship recommendations.
   *
   * Companies which already have recommendations can be queried periodically for any new company relations, but
   * otherwise ignored.
   *
   * You could for example say, only query companies without recommendations, then on the 1st of the month (or
   * within any other arbitrary time period), query all companies, and do a full run.
   */
  const companiesWithDuns = await quickConnectService.getCompaniesWithDuns();
  slackClient.postMessage(
    `Fetched companies with duns: ${companiesWithDuns.length}`,
    xyzAlerts
  );
  const {
    records,
    dataUnavailable,
    otherErrors,
  } = await quickConnectService.getCompanyIdentifierDataFromDuns(
    companiesWithDuns
  );

  await slackClient.postMessage(
    `Fetching Identifier for all companies. Data found for: ${records.length}, Data Unavailable for: ${dataUnavailable.length}, Other Errors for: ${otherErrors.length}.`,
    xyzAlerts
  );

  const companyIdentifiers = extractCompanyIdentifiersFromAllKnownIdentifiers(
    records
  );

  await slackClient.postMessage(
    `Paired ${companyIdentifiers.length} Duns Records to their CIQ ID (${records.length} expected).`,
    xyzAlerts
  );

  let companyRelationshipRecommendationData: CompanyRelationshipRecommendationData[] = [];

  // added new code for this existing cron job,previously we were processing all the record together at a time, but in every one hour the cron job will run and give us result.
  const appMetaRepository = await databaseService.getRepository(
    AppMetaRepository
  );
  const chunkSize = 25;
  const lastProcessedIndex = await appMetaRepository.findEndIndexVal();
  let lastIndexVal = 0;

  if (lastProcessedIndex) {
    if (
      lastIndexVal > companyIdentifiers.length ||
      lastIndexVal == companyIdentifiers.length
    ) {
      lastIndexVal = 0;
    } else {
      lastIndexVal = parseInt(lastProcessedIndex.value);
    }
  }

  /* Chunk into bundles to prevent S&P API Failure -- does not appear to be rate limiting, but some kind of internal failure by request overload. */
  //for await (const companyIdentifierChunk of chunk(companyIdentifiers, 25)) {
  const startIndex = lastIndexVal ? lastIndexVal + 1 : lastIndexVal;
  const endIndex = startIndex + chunkSize - 1;
  const companyRelationshipRecommendationDataChunk = await quickConnectService.enrichCompanyIdentifiersWithCompanyRelationshipData(
    companyIdentifiers.slice(startIndex, endIndex + 1)
  );
  await appMetaRepository.upsertBuildCronJobIndex(endIndex);

  companyRelationshipRecommendationData = [
    ...companyRelationshipRecommendationData,
    ...companyRelationshipRecommendationDataChunk,
  ];
  //}

  await slackClient.postMessage(
    `Collected company relationship data, saving relationships`,
    xyzAlerts
  );

  for await (const recommendation of companyRelationshipRecommendationData) {
    logger.info(`Building recommendation for ${recommendation.duns}`);
    const {
      created,
      duplicate,
    } = await quickConnectService.saveCompanyRecommendation(recommendation);

    totals.created += created;
    totals.duplicate += duplicate;
  }

  await slackClient.postMessage(
    `New recommendations created: ${totals.created}. Duplicate recommendations received: ${totals.duplicate}`,
    xyzAlerts
  );
};

if (require.main === module) {
  runCronJob(run, JOB_NAME, xyzAlerts);
}
