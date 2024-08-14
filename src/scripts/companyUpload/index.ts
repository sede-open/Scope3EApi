import { gql } from 'apollo-server-express';
import commandLineArgs from 'command-line-args';
import * as dotenv from 'dotenv';
import fs from 'fs';
import { print } from 'graphql';
import { AzureBlobClient } from '../../clients/AzureBlobClient';
import { getConfig } from '../../config';
import { validateAndSanitise as emailValidationAndSanitise } from '../../scalars/email';
import { validateAndSanitise as safeStringValidationAndSanitise } from '../../scalars/safeString';
import { validateAndSanitise as userNameValidateAndSanitise } from '../../scalars/userName';
import { CsvService } from '../../services/CsvService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { FileService } from '../../services/FileService';
import { AuthProvider, InviteAndConnectToCompanyInput } from '../../types';
import { logger } from '../../utils/logger';
import { isInviteType, validateIsTruthy } from '../../utils/validators';
dotenv.config();

const config = getConfig();

const FETCH_UNAUTH_STATUS = 'UNAUTHENTICATED';
const FETCH_NO_CONNECTION_STATUS = 'ECONNREFUSED';

const companyDunsValidation = (value: string | null | undefined) => {
  return safeStringValidationAndSanitise(validateIsTruthy(value));
};

const inviteTypeValidation = (value: string | null | undefined) => {
  if (!isInviteType(value as string)) {
    throw new Error(`${value} is not a valid Invite Type`);
  }
  return value?.toUpperCase();
};

const InviteAndConnectToCompany = gql`
  mutation Mutation($input: InviteAndConnectToCompanyInput!) {
    inviteAndConnectToCompany(input: $input) {
      id
    }
  }
`;

const dataRowIndex = 1;

/**
 * Loops through each csv row and sends a request to invite that company
 * @param csvData
 * @param serverUrl
 * @returns a list of errors or success messages, 1 message per row uploaded
 */
const uploadDataToServer = async (
  csvData: InviteAndConnectToCompanyInput[],
  serverUrl: string
) => {
  const errors = [];
  const successfulResponses = [];
  for (let i = 0; i < csvData.length; i++) {
    const csvRow = csvData[i];
    csvRow.companyDuns = csvRow.companyDuns.replace(/-/g, '');
    try {
      const rawResponse = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          Authorization: config.batchCompanyUploadJWTToken as string,
          'X-Token-Issuer': AuthProvider.Port,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: print(InviteAndConnectToCompany),
          variables: {
            input: csvRow,
          },
        }),
      });
      const response = await rawResponse.json();
      if (response.errors?.length) {
        const message = `Row ${i + dataRowIndex} error: ${
          response.errors[0].message
        }`;
        logger.error(message);
        errors.push(message);
        if (response.errors[0].extensions.code === FETCH_UNAUTH_STATUS) {
          throw new Error(FETCH_UNAUTH_STATUS);
        }
      } else {
        const message = `Row ${i + dataRowIndex} success: companyDuns - ${
          csvRow.companyDuns
        } companyRelationshipId - ${
          response.data.inviteAndConnectToCompany.id
        }`;
        logger.info(message);
        successfulResponses.push(message);
      }
    } catch (err) {
      const message = `Row ${i + dataRowIndex} error: ${err.message}`;
      errors.push(message);
      if (err.message === FETCH_UNAUTH_STATUS) {
        throw new Error(
          'Bad Response from server, it is likely your jwt token has expired. The script has Exited.'
        );
      }
      if (err.code === FETCH_NO_CONNECTION_STATUS) {
        throw new Error(
          'No connection to server. Is the server running?. The script has Exited'
        );
      }
    }
  }
  return { errors, successfulResponses };
};

const clearFiles = (fileService: FileService) => {
  fileService.writeJsonToFile(`${__dirname}/csvErrors.json`, {});
  fileService.writeJsonToFile(`${__dirname}/serverErrors.json`, {});
  fileService.writeJsonToFile(`${__dirname}/serverSuccessResponses.json`, {});
};

/**
 * Entrypoint for the script
 */
export const main = async (
  path: string,
  serverUrl: string,
  csvService: CsvService,
  fileService: FileService,
  uploadDataToServer: (
    csvData: InviteAndConnectToCompanyInput[],
    serverUrl: string
  ) => Promise<{
    errors: string[];
    successfulResponses: string[];
  }>
) => {
  if (!serverUrl) {
    throw new Error('--serverUrl argument is missing');
  }
  if (!path) {
    throw new Error('--csvPath argument is missing');
  }
  const fileExists = fs.existsSync(path);
  if (path && !fileExists) {
    throw new Error(`No file found at ${path}`);
  }

  if (!config.batchCompanyUploadJWTToken) {
    throw new Error('BATCH_COMPANY_UPLOAD_JWT_TOKEN env is not set');
  }

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
    dataRowIndex
  );
  const hasErrors = !!Object.keys(errors).length;
  if (hasErrors) {
    fileService.writeJsonToFile(`${__dirname}/csvErrors.json`, errors);
    throw new Error(
      [
        'Errors detected in CSV data. Please correct the data before uploading again.',
        `No Companies have been uploaded`,
        `Errors can be view in generated file ${__dirname}/csvErrors.json`,
      ].join('\n')
    );
  }

  if (!validData.length) {
    throw new Error(`No data has been entered into the csv`);
  }

  logger.info(`All CSV data is valid.`);

  const {
    errors: serverErrors,
    successfulResponses,
  } = await uploadDataToServer(validData, serverUrl);

  if (serverErrors.length) {
    logger.error(
      [
        'Errors detected in SERVER data. Please correct the data before uploading again.',
        `Errors can be view in generated file ${__dirname}/serverErrors.json`,
      ].join('\n')
    );
    fileService.writeJsonToFile(`${__dirname}/serverErrors.json`, serverErrors);
  }

  if (successfulResponses.length) {
    fileService.writeJsonToFile(
      `${__dirname}/serverSuccessResponses.json`,
      successfulResponses
    );
  }

  if (successfulResponses.length && serverErrors.length) {
    logger.warn(
      [
        `Some data is valid and has been uploaded to the server.`,
        `Successfully uploaded data can be viewed in the generated file ${__dirname}/serverSuccessResponses.json`,
      ].join('\n')
    );
  } else if (successfulResponses.length) {
    logger.info(
      [
        `ALL data is valid and has been uploaded to the server.`,
        `Successfully uploaded data can be viewed in the generated file ${__dirname}/serverSuccessResponses.json`,
      ].join('\n')
    );
  } else {
    throw new Error(
      `Requests to the XYZ server failed. See ${__dirname}/serverErrors.json for more information`
    );
  }
};

if (require.main === module) {
  const { serverUrl, csvPath } = commandLineArgs([
    { name: 'serverUrl', alias: 'u', type: String },
    {
      name: 'csvPath',
      alias: 'p',
      type: String,
    },
  ]);

  const csvService = new CsvService();
  const fileService = new FileService(
    (undefined as unknown) as DatabaseService,
    (undefined as unknown) as AzureBlobClient
  );
  main(csvPath, serverUrl, csvService, fileService, uploadDataToServer)
    .then(() => {
      logger.info('script finished.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error(err.message);
      process.exit(1);
    });
}
