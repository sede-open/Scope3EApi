import fs from 'fs';
import { main } from '.';
import { AzureBlobClient } from '../../clients/AzureBlobClient';
import { CsvService } from '../../services/CsvService';
import { DatabaseService } from '../../services/DatabaseService/DatabaseService';
import { FileService } from '../../services/FileService';
import {
  CompanyRelationshipType,
  InviteAndConnectToCompanyInput,
} from '../../types';

jest.mock('fs');

const mockedFs = jest.mocked(fs);
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({
      ...actual.getConfig(),
      batchCompanyUploadJWTToken: 'exampleJwtToken',
    }),
  };
});

describe('companyUpload', () => {
  const createFileServiceMock = () => {
    const fileService = new FileService(
      (undefined as unknown) as DatabaseService,
      (undefined as unknown) as AzureBlobClient
    );
    const writeJsonToFileSpy = jest.spyOn(fileService, 'writeJsonToFile');
    return { fileService, writeJsonToFileSpy };
  };

  const createCsvServiceMock = ({
    readFile = <T>() => ([] as unknown) as Promise<T[]>,
  }: {
    readFile?: InstanceType<typeof CsvService>['readFile'];
  }) => {
    const csvService = new CsvService();
    const readFileSpy = jest
      .spyOn(csvService, 'readFile')
      .mockImplementation(readFile);

    const validateDataSpy = jest.spyOn(csvService, 'validateData');
    return { csvService, readFileSpy, validateDataSpy };
  };
  beforeEach(() => {
    mockedFs.existsSync.mockReset();
    mockedFs.existsSync.mockImplementation(() => true);
  });

  describe('when arguements are invalid', () => {
    it('should throw error with missing serverUrl', async () => {
      const { fileService } = createFileServiceMock();
      const { csvService } = createCsvServiceMock({});
      await expect(async () => {
        await main('', '', csvService, fileService, jest.fn());
      }).rejects.toThrowError('--serverUrl argument is missing');
    });

    it('should throw error with missing csvPath', async () => {
      const { csvService } = createCsvServiceMock({});
      const { fileService } = createFileServiceMock();
      await expect(async () => {
        await main(
          '',
          'http://localhost:3000/graphql',
          csvService,
          fileService,
          jest.fn()
        );
      }).rejects.toThrowError('--csvPath argument is missing');
    });

    it('should throw error with missing file', async () => {
      mockedFs.existsSync.mockImplementation(() => false);
      const { csvService } = createCsvServiceMock({});
      const { fileService } = createFileServiceMock();
      const fileName = './Template.csv';
      await expect(async () => {
        await main(
          fileName,
          'http://localhost:3000/graphql',
          csvService,
          fileService,
          jest.fn()
        );
      }).rejects.toThrowError(`No file found at ${fileName}`);
    });
  });

  it('should call validateData with csvData', async () => {
    const csvData: InviteAndConnectToCompanyInput[] = [
      {} as InviteAndConnectToCompanyInput,
      {
        inviteType: CompanyRelationshipType.Customer,
        email: 'test@example.com',
        firstName: 'john',
        lastName: 'smith',
        companyDuns: '123456',
      },
    ];
    const { csvService, validateDataSpy } = createCsvServiceMock({
      readFile: async <T>() => {
        return ([...csvData] as unknown) as T[];
      },
    });
    const { fileService } = createFileServiceMock();
    await main(
      `${__dirname}/Template.csv`,
      'http://localhost:3000/graphql',
      csvService,
      fileService,
      jest.fn().mockReturnValue({ errors: [], successfulResponses: [''] })
    );
    expect(validateDataSpy).toHaveBeenCalled();
  });

  describe('when csv data is invalid', () => {
    it('should throw error on invalid data', async () => {
      const csvData: InviteAndConnectToCompanyInput[] = [
        {} as InviteAndConnectToCompanyInput,
        {
          inviteType: (CompanyRelationshipType.Customer +
            'invalid') as CompanyRelationshipType,
          email: 'testexample.com',
          firstName: 'john!@',
          lastName: '@!smith',
          companyDuns: '',
        },
      ];
      const { csvService } = createCsvServiceMock({
        readFile: async <T>() => {
          return ([...csvData] as unknown) as T[];
        },
      });
      const { fileService, writeJsonToFileSpy } = createFileServiceMock();

      await expect(async () => {
        await main(
          `${__dirname}/Template.csv`,
          'http://localhost:3000/graphql',
          csvService,
          fileService,
          jest.fn().mockReturnValue({ errors: [], successfulResponses: [''] })
        );
      }).rejects.toThrowError(
        [
          'Errors detected in CSV data. Please correct the data before uploading again.',
          `No Companies have been uploaded`,
          `Errors can be view in generated file ${__dirname}/csvErrors.json`,
        ].join('\n')
      );

      expect(writeJsonToFileSpy).toHaveBeenCalledWith(
        `${__dirname}/csvErrors.json`,
        {
          'row 2': {
            inviteType: `${csvData[1].inviteType} is not a valid Invite Type`,
            email: `Value is not a valid email address: ${csvData[1].email}`,
            firstName: `Value contains forbidden characters: ${csvData[1].firstName}`,
            lastName: `Value contains forbidden characters: ${csvData[1].lastName}`,
            companyDuns: 'Value is required',
          },
        }
      );
    });

    it('should throw error on no data', async () => {
      const csvData: InviteAndConnectToCompanyInput[] = [
        {} as InviteAndConnectToCompanyInput,
      ];
      const { csvService } = createCsvServiceMock({
        readFile: async <T>() => {
          return ([...csvData] as unknown) as T[];
        },
      });
      const { fileService, writeJsonToFileSpy } = createFileServiceMock();

      await expect(async () => {
        await main(
          `${__dirname}/Template.csv`,
          'http://localhost:3000/graphql',
          csvService,
          fileService,
          jest.fn().mockReturnValue({ errors: [], successfulResponses: [''] })
        );
      }).rejects.toThrowError('No data has been entered into the csv');

      expect(writeJsonToFileSpy).toHaveBeenNthCalledWith(
        1,
        `${__dirname}/csvErrors.json`,
        {}
      );
    });
  });

  describe('when csv data is valid', () => {
    it('should upload data to server', async () => {
      const csvData: InviteAndConnectToCompanyInput[] = [
        {} as InviteAndConnectToCompanyInput,
        {
          inviteType: CompanyRelationshipType.Customer,
          email: 'test@example.com',
          firstName: 'john',
          lastName: 'smith',
          companyDuns: '123456',
        },
      ];
      const { csvService } = createCsvServiceMock({
        readFile: async <T>() => {
          return ([...csvData] as unknown) as T[];
        },
      });
      const { fileService, writeJsonToFileSpy } = createFileServiceMock();

      const uploadDataToServer = jest.fn();
      const successfulResponses = ['valid row'];
      uploadDataToServer.mockReturnValue({
        errors: [],
        successfulResponses,
      });
      await main(
        `${__dirname}/Template.csv`,
        'http://localhost:3000/graphql',
        csvService,
        fileService,
        uploadDataToServer
      );

      expect(uploadDataToServer).toHaveBeenCalled();
      expect(writeJsonToFileSpy).toHaveBeenNthCalledWith(
        4,
        `${__dirname}/serverSuccessResponses.json`,
        successfulResponses
      );
    });
  });
});
