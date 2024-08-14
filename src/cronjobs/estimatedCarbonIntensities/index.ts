import { SlackClient } from '../../clients/SlackClient';
import { getConfig } from '../../config';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import {
  getCarbonIntensityService,
  getCorporateEmissionService,
} from '../../utils/apolloContext';
import { runCronJob } from '../utils';

const JOB_NAME = 'Backfill Estimated Intensities';

const {
  slack: {
    token,
    channels: { xyzAlerts },
  },
} = getConfig();

const run = async () => {
  const slackClient = new SlackClient(token);
  await slackClient.postMessage(
    'Fetching "Usd of Revenue" and "Number of Employees" estimated intensities...',
    xyzAlerts
  );
  const databaseService = new DatabaseService();
  const carbonIntensityService = getCarbonIntensityService(databaseService);
  const corporateEmissionService = getCorporateEmissionService(databaseService);

  const [missingUsdOfRevenue, missingNumberOfEmployees] = await Promise.all([
    corporateEmissionService.findEmissionsMissingEstimatedUsdOfRevenue(),
    corporateEmissionService.findEmissionsMissingEstimatedNumberOfEmployees(),
  ]);

  await carbonIntensityService.createUsdOfRevenueEstimatedIntensities(
    missingUsdOfRevenue
  );

  await carbonIntensityService.createNumberOfEmployeesEstimatedIntensities(
    missingNumberOfEmployees
  );
};

if (require.main === module) {
  runCronJob(run, JOB_NAME, xyzAlerts);
}
