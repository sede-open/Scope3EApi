import moment from 'moment';
import { DnBService } from '.';
import { DnBClient } from '../../clients/DnBClient';
import { AppMetaName } from '../../constants/appMeta';
import { AppMetaRepository } from '../../repositories/AppMetaRepository';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('DnBService', () => {
  const mockValidTokenValue = {
    access_token: 'ACCESS_TOKEN',
    createdAt: moment().add(-1, 'h').toDate(),
    expiresIn: 10800, // 3 hours
  };
  const newDnBToken = {
    access_token: 'NEW_ACCESS_TOKEN',
    expiresIn: 18000,
  };
  describe('companyByDuns', () => {
    const mockDnbCompany = {
      duns: 'SOME_ID',
    };
    const dunsId = 'DUNS_ID';
    describe('when there is a valid token in the db', () => {
      it('gets the valid token and calls to get the company from DnB', async () => {
        const mockDnBToken = {
          name: AppMetaName.DNB_TOKEN,
          value: JSON.stringify(mockValidTokenValue),
        };
        const findDnBToken = jest.fn().mockResolvedValueOnce(mockDnBToken);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn(),
          companyByDunsRequest: jest.fn().mockResolvedValue(mockDnbCompany),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.companyByDuns(dunsId);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).not.toBeCalled();
        expect(upsertDnBToken).not.toBeCalled();
        expect(dnbClient.companyByDunsRequest).toBeCalledWith(
          dunsId,
          mockValidTokenValue.access_token
        );
        expect(result).toBe(mockDnbCompany);
      });
    });
    describe('when the token is invalid', () => {
      it('fetches a new token, stores it in the db and calls to get the company from DnB', async () => {
        const mockDnBToken = {
          name: AppMetaName.DNB_TOKEN,
          value: JSON.stringify({ ...mockValidTokenValue, expiresIn: 1000 }),
        };
        const findDnBToken = jest.fn().mockResolvedValueOnce(mockDnBToken);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn().mockResolvedValueOnce(newDnBToken),
          companyByDunsRequest: jest.fn().mockResolvedValue(mockDnbCompany),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.companyByDuns(dunsId);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).toBeCalledTimes(1);
        expect(upsertDnBToken).toBeCalledWith(JSON.stringify(newDnBToken));
        expect(dnbClient.companyByDunsRequest).toBeCalledWith(
          dunsId,
          newDnBToken.access_token
        );
        expect(result).toBe(mockDnbCompany);
      });
    });
    describe('when no token found in the db', () => {
      it('fetches a new token, stores it in the db and calls to get the company from DnB', async () => {
        const findDnBToken = jest.fn().mockResolvedValueOnce(undefined);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn().mockResolvedValueOnce(newDnBToken),
          companyByDunsRequest: jest.fn().mockResolvedValue(mockDnbCompany),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.companyByDuns(dunsId);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).toBeCalledTimes(1);
        expect(upsertDnBToken).toBeCalledWith(JSON.stringify(newDnBToken));
        expect(dnbClient.companyByDunsRequest).toBeCalledWith(
          dunsId,
          newDnBToken.access_token
        );
        expect(result).toBe(mockDnbCompany);
      });
    });
  });
  describe('typeahead', () => {
    const mockTypeaheadResult = [{ duns: 'SOME_ID' }];
    const searchTerm = 'SEARCH_TERM';
    describe('when there is a valid token in the db', () => {
      it('gets the valid token and calls to get the companies from DnB', async () => {
        const mockDnBToken = {
          name: AppMetaName.DNB_TOKEN,
          value: JSON.stringify(mockValidTokenValue),
        };
        const findDnBToken = jest.fn().mockResolvedValueOnce(mockDnBToken);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn(),
          typeaheadRequest: jest.fn().mockResolvedValue(mockTypeaheadResult),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.typeahead(searchTerm);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).not.toBeCalled();
        expect(upsertDnBToken).not.toBeCalled();
        expect(dnbClient.typeaheadRequest).toBeCalledWith(
          searchTerm,
          mockValidTokenValue.access_token
        );
        expect(result).toBe(mockTypeaheadResult);
      });
    });
    describe('when the token is invalid', () => {
      it('fetches a new token, stores it in the db and calls to get the companies from DnB', async () => {
        const mockDnBToken = {
          name: AppMetaName.DNB_TOKEN,
          value: JSON.stringify({ ...mockValidTokenValue, expiresIn: 1000 }),
        };
        const findDnBToken = jest.fn().mockResolvedValueOnce(mockDnBToken);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn().mockResolvedValueOnce(newDnBToken),
          typeaheadRequest: jest.fn().mockResolvedValue(mockTypeaheadResult),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.typeahead(searchTerm);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).toBeCalledTimes(1);
        expect(upsertDnBToken).toBeCalledWith(JSON.stringify(newDnBToken));
        expect(dnbClient.typeaheadRequest).toBeCalledWith(
          searchTerm,
          newDnBToken.access_token
        );
        expect(result).toBe(mockTypeaheadResult);
      });
    });
    describe('when no token found in the db', () => {
      it('fetches a new token, stores it in the db and calls to get the companies from DnB', async () => {
        const findDnBToken = jest.fn().mockResolvedValueOnce(undefined);
        const upsertDnBToken = jest.fn();
        const dbService = ({
          getRepository: jest.fn().mockResolvedValueOnce({
            findDnBToken,
            upsertDnBToken,
          }),
        } as unknown) as DatabaseService;

        const dnbClient = ({
          generateAuthToken: jest.fn().mockResolvedValueOnce(newDnBToken),
          typeaheadRequest: jest.fn().mockResolvedValue(mockTypeaheadResult),
        } as unknown) as DnBClient;

        const dnbService = new DnBService(dbService, dnbClient);

        const result = await dnbService.typeahead(searchTerm);

        expect(dbService.getRepository).toHaveBeenCalledWith(
          AppMetaRepository
        );
        expect(findDnBToken).toBeCalledTimes(1);
        expect(dnbClient.generateAuthToken).toBeCalledTimes(1);
        expect(upsertDnBToken).toBeCalledWith(JSON.stringify(newDnBToken));
        expect(dnbClient.typeaheadRequest).toBeCalledWith(
          searchTerm,
          newDnBToken.access_token
        );
        expect(result).toBe(mockTypeaheadResult);
      });
    });
  });
});
