import {
  sendMulesoftEmailJobProcessor,
  sendHubspotEmailProcessor,
} from '../tasks/email/processor';
import {
  companyQueue,
  companyRelationshipQueue,
  corporateEmissionQueue,
  emissionAllocationQueue,
  sendEmailQueue,
  targetQueue,
  userQueue,
} from '.';
import {
  handleCompleted,
  handleError,
  handleFailure,
  handleStalled,
} from '../utils/statusHandlers';
import { logger } from '../../utils/logger';
import {
  SEND_MULESOFT_EMAIL_PROCESSOR,
  SEND_HUBSPOT_EMAIL_PROCESSOR,
  COMPANY_CREATED,
  COMPANY_UPDATED,
  USER_CREATED,
  USER_UPDATED,
  USER_DELETED,
  HUBSPOT_CONTACT_CREATED,
  CORPORATE_EMISSION_CREATED,
  CORPORATE_EMISSION_UPDATED,
  CORPORATE_EMISSION_DELETED,
  TARGET_CREATED,
  TARGET_UPDATED,
  TARGET_DELETED,
  COMPANY_RELATIONSHIP_CREATED,
  EMISSION_ALLOCATION_CREATED,
} from '../../constants/queue';
import {
  companyCreatedProcessor,
  companyUpdatedProcessor,
} from '../tasks/company/processor';
import {
  hubspotContactCreatedProcessor,
  userCreatedProcessor,
  userDeletedProcessor,
  userUpdatedProcessor,
} from '../tasks/user/processor';
import {
  corporateEmissionCreatedProcessor,
  corporateEmissionDeletedProcessor,
  corporateEmissionUpdatedProcessor,
} from '../tasks/corporateEmission/processor';
import {
  targetCreatedProcessor,
  targetUpdatedProcessor,
  targetDeletedProcessor,
} from '../tasks/target/processor';
import { companyRelationshipCreatedProcessor } from '../tasks/companyRelationship/processor';
import { emissionAllocationCreatedProcessor } from '../tasks/emissionAllocation/processor';

const activeQueues = [
  {
    queue: sendEmailQueue,
    processors: {
      [SEND_MULESOFT_EMAIL_PROCESSOR]: sendMulesoftEmailJobProcessor,
      [SEND_HUBSPOT_EMAIL_PROCESSOR]: sendHubspotEmailProcessor,
    },
  },
  {
    queue: companyQueue,
    processors: {
      [COMPANY_CREATED]: companyCreatedProcessor,
      [COMPANY_UPDATED]: companyUpdatedProcessor,
    },
  },
  {
    queue: userQueue,
    processors: {
      [USER_CREATED]: userCreatedProcessor,
      [USER_UPDATED]: userUpdatedProcessor,
      [USER_DELETED]: userDeletedProcessor,
      [HUBSPOT_CONTACT_CREATED]: hubspotContactCreatedProcessor,
    },
  },
  {
    queue: corporateEmissionQueue,
    processors: {
      [CORPORATE_EMISSION_CREATED]: corporateEmissionCreatedProcessor,
      [CORPORATE_EMISSION_UPDATED]: corporateEmissionUpdatedProcessor,
      [CORPORATE_EMISSION_DELETED]: corporateEmissionDeletedProcessor,
    },
  },
  {
    queue: targetQueue,
    processors: {
      [TARGET_CREATED]: targetCreatedProcessor,
      [TARGET_UPDATED]: targetUpdatedProcessor,
      [TARGET_DELETED]: targetDeletedProcessor,
    },
  },
  {
    queue: companyRelationshipQueue,
    processors: {
      [COMPANY_RELATIONSHIP_CREATED]: companyRelationshipCreatedProcessor,
    },
  },
  {
    queue: emissionAllocationQueue,
    processors: {
      [EMISSION_ALLOCATION_CREATED]: emissionAllocationCreatedProcessor,
    },
  },
];

activeQueues.forEach(async ({ queue, processors }) => {
  queue.on('error', handleError);
  queue.on('failed', handleFailure);
  queue.on('completed', handleCompleted);
  queue.on('stalled', handleStalled);

  await Promise.all(
    Object.entries(processors).map(([name, processor]) => {
      return queue.process(name, processor);
    })
  );

  logger.info(`Starting to process job queue: ${queue.name}`);
});
