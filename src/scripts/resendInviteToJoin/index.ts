import { AzureBlobClient } from '../../clients/AzureBlobClient';
import { CsvService } from '../../services/CsvService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { FileService } from '../../services/FileService';
import { InviteAndConnectToCompanyInput } from '../../types';
import { logger } from '../../utils/logger';
import { validateAndSanitise as emailValidationAndSanitise } from '../../scalars/email';
import { validateAndSanitise as safeStringValidationAndSanitise } from '../../scalars/safeString';
import { validateAndSanitise as userNameValidateAndSanitise } from '../../scalars/userName';
import { isInviteType, validateIsTruthy } from '../../utils/validators';
import { CompanyRepository } from '../../repositories/CompanyRepository';
import { In } from 'typeorm';
import { HubspotCrmClient } from '../../clients/HubspotCrmClient';
import { HubspotClient } from '../../clients/HubspotClient';
import { UserRepository } from '../../repositories/UserRepository';
import commandLineArgs from 'command-line-args';
import { getConfig } from '../../config';

const companyDunsValidation = (value: string | null | undefined) => {
  return safeStringValidationAndSanitise(validateIsTruthy(value));
};

const inviteTypeValidation = (value: string | null | undefined) => {
  if (!isInviteType(value as string)) {
    throw new Error(`${value} is not a valid Invite Type`);
  }
  return value?.toUpperCase();
};

const clearFiles = (fileService: FileService) => {
  fileService.writeJsonToFile(`${__dirname}/csvErrors.json`, {});
  fileService.writeJsonToFile(`${__dirname}/serverErrors.json`, {});
  fileService.writeJsonToFile(`${__dirname}/serverSuccessResponses.json`, {});
};

const main = async (
  path: string,
  inviterId: string,
  fileService: FileService,
  csvService: CsvService,
  databaseService: DatabaseService,
  hubspotCrmClient: HubspotCrmClient
) => {
  clearFiles(fileService);

  const csvHeaders: (keyof InviteAndConnectToCompanyInput)[] = [
    'inviteType',
    'companyDuns',
    'firstName',
    'lastName',
    'email',
    'note',
  ];

  const csvData = await csvService.readFile<InviteAndConnectToCompanyInput>(
    path,
    csvHeaders
  );

  const { validData, errors } = csvService.validateData(
    csvData,
    {
      firstName: userNameValidateAndSanitise,
      lastName: userNameValidateAndSanitise,
      companyDuns: companyDunsValidation,
      email: emailValidationAndSanitise,
      note: safeStringValidationAndSanitise,
      inviteType: inviteTypeValidation,
    },
    1
  );

  const hasErrors = !!Object.keys(errors).length;
  if (hasErrors) {
    fileService.writeJsonToFile(`${__dirname}/csvErrors.json`, errors);
    throw new Error(
      [
        'Errors detected in CSV data. Please correct the data.',
        `No Companies have been uploaded`,
        `Errors can be view in generated file ${__dirname}/csvErrors.json`,
      ].join('\n')
    );
  }

  if (!validData.length) {
    throw new Error(`No data has been entered into the csv`);
  }

  logger.info(`All CSV data is valid.`);

  const duns = validData.map((data) =>
    data.companyDuns.trim().replace(/-/g, '')
  );

  const companyRepo = await databaseService.getRepository(CompanyRepository);
  const companies = await companyRepo.find({ duns: In(duns) });

  const companyIds = companies.map(({ id }) => id);
  const userRepo = await databaseService.getRepository(UserRepository);
  const users = await userRepo.find({
    where: { companyId: In(companyIds) },
    relations: ['company'],
  });

  const inviter = await userRepo.findOneOrFail(inviterId);

  const errorsArr = [];
  const successArr = [];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    try {
      await hubspotCrmClient.createContact(user, inviter);
      const message = `${i + 1} - User ${user.id} success: companyId - ${
        user.companyId
      }`;
      logger.info(message);
      successArr.push(message);
    } catch (error) {
      const message = `${i + 1} - User ${user.id} error: ${error.message}`;
      logger.error(message);
      errorsArr.push(message);
    }
  }

  fileService.writeJsonToFile(
    `${__dirname}/serverSuccessResponses.json`,
    successArr
  );

  if (errorsArr.length) {
    fileService.writeJsonToFile(`${__dirname}/serverErrors.json`, errorsArr);
    throw new Error(
      `Errors can be view in generated file ${__dirname}/serverErrors.json`
    );
  }
};

if (require.main === module) {
  const { csvPath, inviterId } = commandLineArgs([
    {
      name: 'csvPath',
      alias: 'p',
      type: String,
    },
    {
      name: 'inviterId',
      alias: 'i',
      type: String,
    },
  ]);

  const { hubspotCrmToken } = getConfig();

  const fileService = new FileService(
    (undefined as unknown) as DatabaseService,
    (undefined as unknown) as AzureBlobClient
  );
  const csvService = new CsvService();
  const databaseService = new DatabaseService();
  const hubspotCrmClient = new HubspotCrmClient(
    new HubspotClient(hubspotCrmToken)
  );

  main(
    csvPath,
    inviterId,
    fileService,
    csvService,
    databaseService,
    hubspotCrmClient
  )
    .then(() => {
      logger.info('script finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(err.message);
      process.exit(1);
    });
}
