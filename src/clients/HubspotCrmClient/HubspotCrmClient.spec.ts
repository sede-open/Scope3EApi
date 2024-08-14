import { HubspotCrmClient } from '.';
import { HubspotClient } from '../HubspotClient';
import { getOrCreateDBConnection } from '../../dbConnection';
import {
  CompanyRelationshipType,
  CompanyStatus,
  CorporateEmissionType,
  RoleName,
  TargetType,
  UserStatus,
} from '../../types';
import { CompanyEntity } from '../../entities/Company';
import { UserEntity } from '../../entities/User';
import { addJobHubspotContactCreatedToQueue } from '../../jobs/tasks/user/queue';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { getLDTestData } from '../LaunchDarklyClient';
import { LaunchDarklyFlags } from '../../config';
import { TargetEntity } from '../../entities/Target';
import { UserRepository } from '../../repositories/UserRepository';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';
import { getInviteLink } from '../NotificationClient/utils';

const companyHubspotId = 'company-hubspot-id';
const companyId = 'company-id';
const companyName = 'company-name';
const companyStatus = CompanyStatus.Active;
const companyCountry = 'company-country';

const userHubspotId = 'user-hubspot-id';
const userId = 'user-id';
const userFirstName = 'user-first-name';
const userLastName = 'user-last-name';
const userEmail = 'user-email';
const userStatus = UserStatus.Active;
const userCreatedAt = new Date().toISOString();

const emissionId = 'emission-id';
const targetId = 'target-id';

jest.mock('../HubspotClient', () => ({
  HubspotClient: jest.fn().mockReturnValue({
    createCompanyRequest: jest
      .fn()
      .mockResolvedValue({ id: 'company-hubspot-id' }),
    updateCompanyRequest: jest
      .fn()
      .mockResolvedValue({ id: 'company-hubspot-id' }),
    createContactRequest: jest
      .fn()
      .mockResolvedValue({ id: 'user-hubspot-id' }),
    associateContactWithCompany: jest.fn().mockResolvedValue({}),
    updateContactRequest: jest
      .fn()
      .mockResolvedValue({ id: 'user-hubspot-id' }),
    deleteContactRequest: jest.fn().mockResolvedValue(undefined),
  }),
}));
jest.mock('../../dbConnection');
jest.mock('../../jobs/tasks/user/queue');
jest.mock('../../config', () => {
  const actual = jest.requireActual('../../config');
  return {
    ...actual,
    getConfig: jest.fn().mockReturnValue({
      ...actual.getConfig(),
      flags: {
        isHubspotCrmEnabled: true,
      },
    }),
  };
});
jest.mock('../NotificationClient/utils');

describe('HubspotCrmClient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCompany', () => {
    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('should call HubspotClient to create company and update hubspotId in DB', async () => {
        const dbUpdate = jest.fn().mockResolvedValueOnce({});
        const getRepository = jest.fn().mockReturnValue({
          update: dbUpdate,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
        } as CompanyEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        const companyObject = await hubspotCrmClient.createCompany(company);

        expect(hubspotClient.createCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.createCompanyRequest).toHaveBeenCalledWith({
          name: company.name,
          status: company.status,
          dnbCountry: company.dnbCountry,
        });
        expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
        expect(dbUpdate).toHaveBeenCalledTimes(1);
        expect(dbUpdate).toHaveBeenCalledWith(company.id, {
          hubspotId: companyObject!.id,
        });
      });
    });

    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
        } as CompanyEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.createCompany(company);
        expect(hubspotClient.createCompanyRequest).not.toHaveBeenCalled();
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
      });
    });
  });
  describe('updateCompany', () => {
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        } as CompanyEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompany(company);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
      });
    });

    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('should call HubspotClient to create company if the company does not have hubspotId', async () => {
        const dbUpdate = jest.fn().mockResolvedValueOnce({});
        const getRepository = jest.fn().mockReturnValue({
          update: dbUpdate,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });

        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
        } as CompanyEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        const companyObject = await hubspotCrmClient.updateCompany(company);

        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
        expect(hubspotClient.createCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.createCompanyRequest).toHaveBeenCalledWith({
          name: company.name,
          status: company.status,
          dnbCountry: company.dnbCountry,
        });
        expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
        expect(dbUpdate).toHaveBeenCalledTimes(1);
        expect(dbUpdate).toHaveBeenCalledWith(company.id, {
          hubspotId: companyObject!.id,
        });
      });

      it('should call HubspotClient to update company if the company has hubspotId', async () => {
        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        } as CompanyEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompany(company);

        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          company.hubspotId,
          {
            name: company.name,
            status: company.status,
            dnbCountry: company.dnbCountry,
          }
        );
      });
    });
  });
  describe('updateCompanyEmission', () => {
    afterEach(() => {
      jest.useRealTimers();
    });
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const emission = ({
          id: emissionId,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });

    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('does not execute the logic when the provided data is neither the baseline nor the last year emission', async () => {
        const currentYear = 2018;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));

        const emission = ({
          id: emissionId,
          year: 2013,
          type: CorporateEmissionType.Actual,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('populates the company if not populated', async () => {
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });

        const emission = ({
          id: emissionId,
          type: CorporateEmissionType.Baseline,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);

        expect(findOneOrFail).toHaveBeenCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(emission.companyId);
      });
      it('does not populate the company, if already populated', async () => {
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const emission = ({
          id: emissionId,
          type: CorporateEmissionType.Baseline,
          companyId,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);

        expect(findOneOrFail).not.toHaveBeenCalledWith(emission.company.id);
      });
      it('does not call to update the Hubspot company if the company does not have hubspotId', async () => {
        const emission = ({
          id: emissionId,
          companyId,
          company: {
            id: companyId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not call to update the Hubspot company if the populated company does not have hubspotId', async () => {
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
          hubspotId: undefined,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const emission = ({
          id: emissionId,
          type: CorporateEmissionType.Baseline,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(emission);
        expect(findOneOrFail).toBeCalledWith(emission.companyId);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('updates the Hubspot company with the last year data', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));

        const dbCompany = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        };

        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });

        const lastYearEmission = ({
          id: emissionId,
          type: CorporateEmissionType.Actual,
          scope1: 23,
          year: currentYear - 1,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(lastYearEmission);

        expect(findOneOrFail).toHaveBeenCalledWith(lastYearEmission.companyId);

        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          dbCompany.hubspotId,
          {
            name: dbCompany.name,
            status: dbCompany.status,
            dnbCountry: dbCompany.dnbCountry,
            lastYearScope1: lastYearEmission.scope1,
          }
        );
      });

      it('updates the Hubspot company with the last year data and the baseline', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));

        const lastYearBaselineEmission = ({
          id: emissionId,
          type: CorporateEmissionType.Baseline,
          scope1: 23,
          year: currentYear - 1,
          companyId,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
            hubspotId: companyHubspotId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(lastYearBaselineEmission);

        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          lastYearBaselineEmission.company.hubspotId,
          {
            name: lastYearBaselineEmission.company.name,
            status: lastYearBaselineEmission.company.status,
            dnbCountry: lastYearBaselineEmission.company.dnbCountry,
            lastYearScope1: lastYearBaselineEmission.scope1,
            baselineScope1: lastYearBaselineEmission.scope1,
          }
        );
      });
      it('updates the baseline data', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));

        const baselineEmission = ({
          id: emissionId,
          type: CorporateEmissionType.Baseline,
          year: 2012,
          scope1: 23,
          companyId,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
            hubspotId: companyHubspotId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyEmission(baselineEmission);

        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          baselineEmission.company.hubspotId,
          {
            name: baselineEmission.company.name,
            status: baselineEmission.company.status,
            dnbCountry: baselineEmission.company.dnbCountry,
            baselineScope1: baselineEmission.scope1,
            lastYearScope1: undefined,
          }
        );
      });
    });
  });
  describe('updateCompanyTarget', () => {
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });
    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('does not execute the logic when the target is not absolute', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Intensity,
          reduction: 23,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('populates the company if the provided data does not include the company', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const findOneOrFail = jest
          .fn()
          .mockResolvedValueOnce({ id: target.companyId });

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);
        expect(findOneOrFail).toHaveBeenCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
      });
      it('does not update the provided company, if the provided company does not have hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
          company: {
            id: companyId,
            hubspotId: undefined,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not update the populated company, if the provided company does not have hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const dbCompany = {
          id: target.companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: undefined,
        };

        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(findOneOrFail).toBeCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('updates the company ambitions with the provided company hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          target.company.hubspotId,
          {
            name: target.company.name,
            status: target.company.status,
            dnbCountry: target.company.dnbCountry,
            ambition: target.reduction,
          }
        );
      });
      it('updates the company ambitions with the populated company hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const dbCompany = {
          id: target.companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        };

        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateCompanyTarget(target);

        expect(findOneOrFail).toBeCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          dbCompany.hubspotId,
          {
            name: dbCompany.name,
            status: dbCompany.status,
            dnbCountry: dbCompany.dnbCountry,
            ambition: target.reduction,
          }
        );
      });
    });
  });
  describe('deleteCompanyTarget', () => {
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });

    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('does not execute the logic when the target is not absolute', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Intensity,
          reduction: 23,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('populates the company if the provided data does not include the company', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const findOneOrFail = jest
          .fn()
          .mockResolvedValueOnce({ id: target.companyId });

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);
        expect(findOneOrFail).toHaveBeenCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
      });
      it('does not update the provided company, if the provided company does not have hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
          company: {
            id: companyId,
            hubspotId: undefined,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not update the populated company, if the provided company does not have hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const dbCompany = {
          id: target.companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: undefined,
        };

        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(findOneOrFail).toBeCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('updates the company ambitions with the provided company hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
            hubspotId: companyHubspotId,
          },
        } as unknown) as TargetEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          target.company.hubspotId,
          {
            name: target.company.name,
            status: target.company.status,
            dnbCountry: target.company.dnbCountry,
            ambition: '',
          }
        );
      });
      it('updates the company ambitions with the populated company hubspotId', async () => {
        const target = ({
          id: targetId,
          targetType: TargetType.Absolute,
          reduction: 23,
          companyId,
        } as unknown) as TargetEntity;

        const dbCompany = {
          id: target.companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        };

        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);

        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteCompanyTarget(target);

        expect(findOneOrFail).toBeCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(target.companyId);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          dbCompany.hubspotId,
          {
            name: dbCompany.name,
            status: dbCompany.status,
            dnbCountry: dbCompany.dnbCountry,
            ambition: '',
          }
        );
      });
    });
  });
  describe('deleteLastYearEmission', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const corporateEmission = ({
          id: emissionId,
          type: CorporateEmissionType.Actual,
          scope1: 23,
          year: currentYear - 1,
          companyId,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(corporateEmission);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });

    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      it('does not execute the logic if the emission is not the last year data', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const corporateEmission = ({
          id: emissionId,
          type: CorporateEmissionType.Actual,
          scope1: 23,
          year: currentYear - 2,
          companyId,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(corporateEmission);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('populates the company if not populated', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });

        const emission = ({
          id: emissionId,
          year: currentYear - 1,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(emission);

        expect(findOneOrFail).toHaveBeenCalledTimes(1);
        expect(findOneOrFail).toHaveBeenCalledWith(emission.companyId);
      });
      it('does not populate the company, if already populated', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const emission = ({
          id: emissionId,
          year: currentYear - 1,
          companyId,
          company: {
            id: companyId,
            hubspotId: companyHubspotId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(emission);

        expect(findOneOrFail).not.toHaveBeenCalledWith(emission.company.id);
      });
      it('does not call to update the Hubspot company if the company does not have hubspotId', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const emission = ({
          id: emissionId,
          year: currentYear - 1,
          companyId,
          company: {
            id: companyId,
          },
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(emission);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not call to update the Hubspot company if the populated company does not have hubspotId', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const findOneOrFail = jest.fn().mockResolvedValueOnce({
          id: companyId,
          hubspotId: undefined,
        });
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const emission = ({
          id: emissionId,
          year: currentYear - 1,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(emission);
        expect(findOneOrFail).toBeCalledWith(emission.companyId);
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('calls to delete the last year emission', async () => {
        const currentYear = 2015;
        jest.useFakeTimers().setSystemTime(Date.UTC(currentYear, 1, 1));
        const company = {
          id: companyId,
          name: companyName,
          status: companyStatus,
          dnbCountry: companyCountry,
          hubspotId: companyHubspotId,
        };
        const findOneOrFail = jest.fn().mockResolvedValueOnce(company);
        const getRepository = jest.fn().mockReturnValue({
          findOneOrFail,
        });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
          getRepository,
        });
        const emission = ({
          id: emissionId,
          year: currentYear - 1,
          companyId,
          company: undefined,
        } as unknown) as CorporateEmissionEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.deleteLastYearEmission(emission);
        expect(findOneOrFail).toBeCalledWith(emission.companyId);
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateCompanyRequest).toBeCalledWith(
          company.hubspotId,
          {
            name: company.name,
            status: company.status,
            dnbCountry: company.dnbCountry,
            lastYearScope1: '',
          }
        );
      });
    });
  });
  describe('updateFirstInvitation', () => {
    const supplierInvitationWithCustomer = {
      id: 'some-id',
      customerId: 'some-customer-id',
      supplierId: 'some-supplier-id',
      inviteType: CompanyRelationshipType.Supplier,
      customer: {
        name: 'customer-name',
        status: CompanyStatus.Active,
        dnbCountry: 'customer-country',
        hubspotId: 'customer-hubspot-id',
      },
    } as CompanyRelationshipEntity;
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });
      it('does not update the company', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateFirstInvitation(
          supplierInvitationWithCustomer
        );
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });
    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      describe('when the invitation relationship type is SUPPLIER', () => {
        it('does not update the company when the customer has no hubspotId', async () => {
          const supplierInvitation = {
            ...supplierInvitationWithCustomer,
            customer: {
              ...supplierInvitationWithCustomer.customer,
              hubspotId: undefined,
            },
          } as CompanyRelationshipEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(supplierInvitation);
          expect(getOrCreateDBConnection).not.toHaveBeenCalled();
          expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
        });
        it('calls to update firstSupplierInvited Company property', async () => {
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(
            supplierInvitationWithCustomer
          );
          expect(getOrCreateDBConnection).not.toHaveBeenCalled();
          expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
            supplierInvitationWithCustomer.customer.hubspotId,
            {
              name: supplierInvitationWithCustomer.customer.name,
              status: supplierInvitationWithCustomer.customer.status,
              dnbCountry: supplierInvitationWithCustomer.customer.dnbCountry,
              firstSupplierInvited: 'True',
            }
          );
        });
        it('populates the customer data and calls to updates firstSupplierInvited Company property ', async () => {
          const dbCompany = supplierInvitationWithCustomer.customer;
          const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);
          const getRepository = jest.fn().mockReturnValueOnce({
            findOneOrFail,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValueOnce({
            getRepository,
          });
          const supplierInvitation = {
            id: 'some-id',
            inviteType: CompanyRelationshipType.Supplier,
            customerId: 'some-customer-id',
            supplierId: 'some-supplier-id',
          } as CompanyRelationshipEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(supplierInvitation);
          expect(getOrCreateDBConnection).toHaveBeenCalled();
          expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
          expect(findOneOrFail).toHaveBeenCalledWith(
            supplierInvitation.customerId
          );
          expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
            dbCompany.hubspotId,
            {
              name: dbCompany.name,
              status: dbCompany.status,
              dnbCountry: dbCompany.dnbCountry,
              firstSupplierInvited: 'True',
            }
          );
        });
      });
      describe('when the invitation type is CUSTOMER', () => {
        const customerInvitationWithSupplier = {
          id: 'some-id',
          inviteType: CompanyRelationshipType.Customer,
          customerId: 'some-customer-id',
          supplierId: 'some-supplier-id',
          supplier: {
            name: 'supplier-name',
            status: CompanyStatus.Active,
            dnbCountry: 'supplier-country',
            hubspotId: 'supplier-hubspot-id',
          },
        } as CompanyRelationshipEntity;
        it('does not proceed when the customer company has no hubspotId', async () => {
          const customerInvitation = {
            ...customerInvitationWithSupplier,
            supplier: {
              ...customerInvitationWithSupplier.supplier,
              hubspotId: undefined,
            },
          } as CompanyRelationshipEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(customerInvitation);
          expect(getOrCreateDBConnection).not.toHaveBeenCalled();
          expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
        });
        it('calls to update firstCustomerInvited Company property with populated company data', async () => {
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(
            customerInvitationWithSupplier
          );
          expect(getOrCreateDBConnection).not.toHaveBeenCalled();
          expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
            customerInvitationWithSupplier.supplier.hubspotId,
            {
              name: customerInvitationWithSupplier.supplier.name,
              status: customerInvitationWithSupplier.supplier.status,
              dnbCountry: customerInvitationWithSupplier.supplier.dnbCountry,
              firstCustomerInvited: 'True',
            }
          );
        });
        it('populates the supplier data and calls to updates firstCustomerInvited Company property', async () => {
          const dbCompany = customerInvitationWithSupplier.supplier;
          const findOneOrFail = jest.fn().mockResolvedValueOnce(dbCompany);
          const getRepository = jest.fn().mockReturnValueOnce({
            findOneOrFail,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValueOnce({
            getRepository,
          });
          const customerInvitation = {
            id: 'some-id',
            inviteType: CompanyRelationshipType.Customer,
            customerId: 'some-customer-id',
            supplierId: 'some-supplier-id',
          } as CompanyRelationshipEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          await hubspotCrmClient.updateFirstInvitation(customerInvitation);
          expect(getOrCreateDBConnection).toHaveBeenCalled();
          expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
          expect(findOneOrFail).toHaveBeenCalledWith(
            customerInvitation.supplierId
          );
          expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
            dbCompany.hubspotId,
            {
              name: dbCompany.name,
              status: dbCompany.status,
              dnbCountry: dbCompany.dnbCountry,
              firstCustomerInvited: 'True',
            }
          );
        });
      });
    });
  });
  describe('updateEmissionAllocation', () => {
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });
      it('does not update the company emission allocation', async () => {
        const emissionAllocation = {
          id: 'allocation-id',
          supplierId: 'supplier-id',
          emissions: 1234,
          supplier: {
            id: 'supplier-id',
            hubspotId: 'supplier-hubspot-id',
          },
        } as EmissionAllocationEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(emissionAllocation);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
    });
    describe('hubspot-crm-flag enabled', () => {
      const emissionAllocationWithSupplier = {
        id: 'allocation-id',
        supplierId: 'supplier-id',
        emissions: 1234,
        supplier: {
          id: 'supplier-id',
          name: 'supplier-name',
          status: CompanyStatus.Active,
          dnbCountry: 'supplier-country',
          hubspotId: 'supplier-hubspot-id',
        },
      } as EmissionAllocationEntity;
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });
      it('does not update the company emission allocation when supplierId is not provided', async () => {
        const emissionAllocation = {
          ...emissionAllocationWithSupplier,
          supplierId: undefined,
        } as EmissionAllocationEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(emissionAllocation);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not update the company emission allocation when emissions is not provided', async () => {
        const emissionAllocation = {
          ...emissionAllocationWithSupplier,
          emissions: undefined,
        } as EmissionAllocationEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(emissionAllocation);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('does not update the company emission allocation when the supplier has no hubspotId', async () => {
        const emissionAllocation = {
          ...emissionAllocationWithSupplier,
          supplier: {
            ...emissionAllocationWithSupplier.supplier,
            hubspotId: undefined,
          },
        } as EmissionAllocationEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(emissionAllocation);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).not.toHaveBeenCalled();
      });
      it('updates the company emission allocation with the provided supplier data', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(
          emissionAllocationWithSupplier
        );
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          emissionAllocationWithSupplier.supplier!.hubspotId,
          {
            name: emissionAllocationWithSupplier.supplier!.name,
            status: emissionAllocationWithSupplier.supplier!.status,
            dnbCountry: emissionAllocationWithSupplier.supplier!.dnbCountry,
            firstCustomerInvited: 'True',
            emissionsAllocation: emissionAllocationWithSupplier.emissions,
          }
        );
      });
      it('populates the supplier data and updates the company emission allocation', async () => {
        const dbSupplier = emissionAllocationWithSupplier.supplier as CompanyEntity;
        const findOneOrFail = jest.fn().mockResolvedValueOnce(dbSupplier);
        const getRepository = jest.fn().mockReturnValueOnce({ findOneOrFail });
        (getOrCreateDBConnection as jest.Mock).mockResolvedValueOnce({
          getRepository,
        });
        const emissionAllocation = {
          ...emissionAllocationWithSupplier,
          supplier: undefined,
        } as EmissionAllocationEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateEmissionAllocation(emissionAllocation);
        expect(getOrCreateDBConnection).toHaveBeenCalled();
        expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
        expect(findOneOrFail).toHaveBeenCalledWith(
          emissionAllocation.supplierId
        );
        expect(hubspotClient.updateCompanyRequest).toHaveBeenCalledWith(
          dbSupplier.hubspotId,
          {
            name: dbSupplier.name,
            status: dbSupplier.status,
            dnbCountry: dbSupplier.dnbCountry,
            firstCustomerInvited: 'True',
            emissionsAllocation: emissionAllocation.emissions,
          }
        );
      });
    });
  });
  describe('createContact', () => {
    const baseUser = ({
      id: userId,
      firstName: userFirstName,
      lastName: userLastName,
      email: userEmail,
      status: userStatus,
      createdAt: userCreatedAt,
      companyId,
      roles: [{ name: RoleName.SupplierViewer }],
    } as unknown) as UserEntity;
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.createContact(baseUser);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.createContactRequest).not.toHaveBeenCalled();
        expect(addJobHubspotContactCreatedToQueue).not.toHaveBeenCalled();
      });
    });
    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });

      describe('when the company data is not populated', () => {
        it('gets the user company from the db, creates the contact and associates with the company', async () => {
          const dbCompany = {
            id: companyId,
            name: companyName,
            hubspotId: companyHubspotId,
          };
          const dbFindOne = jest.fn().mockResolvedValueOnce(dbCompany);
          const dbUpdate = jest.fn().mockResolvedValueOnce({});
          const getRepository = jest.fn().mockReturnValue({
            findOneOrFail: dbFindOne,
            update: dbUpdate,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
            getRepository,
          });
          const user = ({
            ...baseUser,
            roles: [{ name: RoleName.SupplierViewer }],
          } as unknown) as UserEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          hubspotCrmClient.associateContactWithCompany = jest.fn();
          await hubspotCrmClient.createContact(user);
          expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
          expect(dbFindOne).toHaveBeenCalledWith(user.companyId, {
            lock: { mode: 'dirty_read' },
          });
          expect(hubspotClient.createContactRequest).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createContactRequest).toHaveBeenCalledWith({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: RoleName.SupplierViewer,
            companyName: dbCompany.name,
          });
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledTimes(1);
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledWith({
            contact: expect.objectContaining({ id: userHubspotId }),
            companyId: companyHubspotId,
          });
          expect(getRepository).toHaveBeenCalledWith(UserEntity);
          expect(dbUpdate).toHaveBeenCalledWith(user.id, {
            hubspotId: userHubspotId,
          });
        });
      });
      describe('when the company data is already populated', () => {
        it('does not get the user company from the db, creates the contact and associates with the company', async () => {
          const dbFindOne = jest.fn().mockResolvedValueOnce({
            id: companyId,
            hubspotId: companyHubspotId,
          });
          const dbUpdate = jest.fn().mockResolvedValueOnce({});
          const getRepository = jest.fn().mockReturnValue({
            findOneOrFail: dbFindOne,
            update: dbUpdate,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
            getRepository,
          });
          const user = ({
            ...baseUser,
            company: {
              id: companyId,
              name: companyName,
              hubspotId: companyHubspotId,
            },
            roles: [{ name: RoleName.SupplierViewer }],
          } as unknown) as UserEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          hubspotCrmClient.associateContactWithCompany = jest.fn();
          await hubspotCrmClient.createContact(user);
          expect(getRepository).not.toHaveBeenCalledWith(CompanyEntity);
          expect(dbFindOne).not.toHaveBeenCalled();
          expect(hubspotClient.createContactRequest).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createContactRequest).toHaveBeenCalledWith({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: RoleName.SupplierViewer,
            companyName: user.company!.name,
          });
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledTimes(1);
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledWith({
            contact: expect.objectContaining({ id: userHubspotId }),
            companyId: companyHubspotId,
          });
          expect(getRepository).toHaveBeenCalledWith(UserEntity);
          expect(dbUpdate).toHaveBeenCalledWith(user.id, {
            hubspotId: userHubspotId,
          });
        });
      });
      describe('when the company does not have hubspotId', () => {
        it('creates a company object, the contact object and associates them together saving the user hubspotId', async () => {
          const dbFindOne = jest.fn().mockResolvedValueOnce({
            id: companyId,
            hubspotId: companyHubspotId,
          });
          const dbUpdate = jest.fn().mockResolvedValueOnce({});
          const getRepository = jest.fn().mockReturnValue({
            findOneOrFail: dbFindOne,
            update: dbUpdate,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
            getRepository,
          });
          const user = ({
            ...baseUser,
            company: {
              id: companyId,
              name: companyName,
              status: companyStatus,
              dnbCountry: companyCountry,
            } as CompanyEntity,
            roles: [{ name: RoleName.SupplierViewer }],
          } as unknown) as UserEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClientNew = new HubspotCrmClient(hubspotClient);
          hubspotCrmClientNew.associateContactWithCompany = jest.fn();
          await hubspotCrmClientNew.createContact(user);
          expect(dbFindOne).not.toHaveBeenCalled();
          expect(hubspotClient.createCompanyRequest).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createCompanyRequest).toHaveBeenCalledWith({
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
          });
          expect(hubspotClient.createContactRequest).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createContactRequest).toHaveBeenCalledWith({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: RoleName.SupplierViewer,
            companyName: user.company!.name,
          });
          expect(
            hubspotCrmClientNew.associateContactWithCompany
          ).toHaveBeenCalledTimes(1);
          expect(
            hubspotCrmClientNew.associateContactWithCompany
          ).toHaveBeenCalledWith({
            contact: expect.objectContaining({ id: userHubspotId }),
            companyId: companyHubspotId,
          });
          expect(getRepository).toHaveBeenCalledWith(UserEntity);
          expect(dbUpdate).toHaveBeenCalledWith(user.id, {
            hubspotId: userHubspotId,
          });
        });
      });
      describe('when the inviter is available', () => {
        it('populates the inviter company, generates an invite link and creates a contact', async () => {
          const inviter = ({
            id: 'inviter-id',
            firstName: 'inviter-first-name',
            lastName: 'inviter-last-name',
            companyId: 'inviter-company-id',
          } as unknown) as UserEntity;
          const inviterCompany = {
            id: inviter.companyId,
            name: 'inviter-company-name',
          };
          const inviteLink = 'https://test.com/invite-link';
          const dbFindOne = jest.fn().mockResolvedValueOnce(inviterCompany);
          const dbUpdate = jest.fn().mockResolvedValueOnce({});
          const getRepository = jest.fn().mockReturnValue({
            findOneOrFail: dbFindOne,
            update: dbUpdate,
          });
          (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
            getRepository,
          });
          (getInviteLink as jest.Mock).mockReturnValueOnce(inviteLink);
          const user = ({
            ...baseUser,
            company: {
              id: companyId,
              name: companyName,
              hubspotId: companyHubspotId,
            },
            roles: [{ name: RoleName.SupplierViewer }],
          } as unknown) as UserEntity;
          const hubspotClient = new HubspotClient('AUTH_TOKEN');
          const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
          hubspotCrmClient.associateContactWithCompany = jest.fn();
          await hubspotCrmClient.createContact(user, inviter);
          expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
          expect(dbFindOne).toHaveBeenCalledWith(inviter.companyId);
          expect(dbFindOne).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createContactRequest).toHaveBeenCalledTimes(1);
          expect(hubspotClient.createContactRequest).toHaveBeenCalledWith({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: RoleName.SupplierViewer,
            companyName: user.company!.name,
            inviterName: `${inviter.firstName} ${inviter.lastName}`,
            inviterCompanyName: inviterCompany.name,
            inviteLink,
          });
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledTimes(1);
          expect(
            hubspotCrmClient.associateContactWithCompany
          ).toHaveBeenCalledWith({
            contact: expect.objectContaining({ id: userHubspotId }),
            companyId: companyHubspotId,
          });
          expect(getRepository).toHaveBeenCalledWith(UserEntity);
          expect(dbUpdate).toHaveBeenCalledWith(user.id, {
            hubspotId: userHubspotId,
          });
        });
      });
    });
  });
  describe('updateContact', () => {
    const baseUser = ({
      id: userId,
      firstName: userFirstName,
      lastName: userLastName,
      email: userEmail,
      status: userStatus,
      createdAt: userCreatedAt,
      companyId,
      hubspotId: userHubspotId,
    } as unknown) as UserEntity;
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(baseUser);
        expect(getOrCreateDBConnection).not.toHaveBeenCalled();
        expect(hubspotClient.updateContactRequest).not.toHaveBeenCalled();
      });
    });

    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });
      it('calls to create a contact object, if the user does not have hubspotId', async () => {
        const user = ({
          ...baseUser,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
          } as CompanyEntity,
          roles: [{ name: RoleName.SupplierViewer }],
          hubspotId: undefined,
        } as unknown) as UserEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(user);
        expect(hubspotClient.updateContactRequest).not.toHaveBeenCalled();
        expect(hubspotClient.createContactRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.createContactRequest).toHaveBeenCalledWith({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          status: user.status,
          createdAt: user.createdAt,
          roles: RoleName.SupplierViewer,
          companyName: user.company!.name,
        });
      });
      it('calls to update the object, if the user has hubspotId', async () => {
        const user = ({
          ...baseUser,
          company: {
            id: companyId,
            name: companyName,
            status: companyStatus,
            dnbCountry: companyCountry,
          } as CompanyEntity,
          roles: [{ name: RoleName.SupplierViewer }],
        } as unknown) as UserEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(user);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledWith(
          user.hubspotId,
          {
            firstName: userFirstName,
            lastName: userLastName,
            email: userEmail,
            status: userStatus,
            createdAt: user.createdAt,
            roles: RoleName.SupplierViewer,
            companyName: user.company!.name,
          }
        );
      });
    });
    describe('when the user roles are already populated', () => {
      it('reformats the roles and calls to update a contact', async () => {
        const user = ({
          ...baseUser,
          company: {
            id: companyId,
            name: companyName,
            hubspotId: companyHubspotId,
          },
          roles: [
            { name: RoleName.SupplierViewer },
            { name: RoleName.SupplierEditor },
            { name: RoleName.Admin },
          ],
        } as unknown) as UserEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(user);

        expect(hubspotClient.updateContactRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledWith(
          user.hubspotId,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: user.roles!.map(({ name }) => name).join(';'),
            companyName: user.company!.name,
          }
        );
      });
    });
    describe('when the user roles are not populated', () => {
      it('populates the user roles and calls to update a contact', async () => {
        const dbRoles = [
          { name: RoleName.SupplierViewer },
          { name: RoleName.SupplierEditor },
          { name: RoleName.Admin },
        ];
        const getRelation = jest.fn().mockResolvedValue(dbRoles);
        const getCustomRepository = jest.fn().mockReturnValue({ getRelation });
        (getOrCreateDBConnection as jest.Mock).mockReturnValue({
          getCustomRepository,
        });
        const user = ({
          ...baseUser,
          company: {
            id: companyId,
            name: companyName,
            hubspotId: companyHubspotId,
          },
        } as unknown) as UserEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(user);
        expect(getCustomRepository).toHaveBeenCalledWith(UserRepository);
        expect(getRelation).toHaveBeenCalledWith(user, 'roles');
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledWith(
          user.hubspotId,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: dbRoles.map(({ name }) => name).join(';'),
            companyName: user.company!.name,
          }
        );
      });
    });
    describe('when the user company is not populated', () => {
      it('populates the company data and updates the contact with the company name', async () => {
        const dbCompany = {
          id: companyId,
          name: companyName,
        };
        const findOneOrFail = jest.fn().mockResolvedValue(dbCompany);
        const getRepository = jest.fn().mockReturnValue({ findOneOrFail });
        (getOrCreateDBConnection as jest.Mock).mockReturnValue({
          getRepository,
        });
        const user = ({
          ...baseUser,
          roles: [
            { name: RoleName.SupplierViewer },
            { name: RoleName.SupplierEditor },
            { name: RoleName.Admin },
          ],
        } as unknown) as UserEntity;
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.updateContact(user);
        expect(getOrCreateDBConnection).toHaveBeenCalledTimes(1);
        expect(getRepository).toHaveBeenCalledWith(CompanyEntity);
        expect(findOneOrFail).toHaveBeenCalledWith(user.companyId);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledTimes(1);
        expect(hubspotClient.updateContactRequest).toHaveBeenCalledWith(
          user.hubspotId,
          {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
            roles: user.roles!.map(({ name }) => name).join(';'),
            companyName: dbCompany.name,
          }
        );
      });
    });
  });
  describe('associateContactWithCompany', () => {
    describe('hubspot-crm-flag disabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(false)
        );
      });

      it('does not execute the logic when feature flagged', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.associateContactWithCompany({
          contact: { id: userHubspotId, properties: {} },
          companyId: companyHubspotId,
        });
        expect(
          hubspotClient.associateContactWithCompany
        ).not.toHaveBeenCalled();
      });
    });
    describe('hubspot-crm-flag enabled', () => {
      beforeAll(async () => {
        const td = await getLDTestData();
        await td.update(
          td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
        );
      });
      it('calls HubspotClient to create association between the contact and the company', async () => {
        const hubspotClient = new HubspotClient('AUTH_TOKEN');
        const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
        await hubspotCrmClient.associateContactWithCompany({
          contact: { id: userHubspotId, properties: {} },
          companyId: companyHubspotId,
        });
        expect(hubspotClient.associateContactWithCompany).toBeCalledTimes(1);
        expect(hubspotClient.associateContactWithCompany).toBeCalledWith(
          userHubspotId,
          companyHubspotId
        );
      });
    });
  });
  describe('deleteContact', () => {
    beforeAll(async () => {
      const td = await getLDTestData();
      await td.update(
        td.flag(LaunchDarklyFlags.HUBSPOT_CRM_ENABLED).valueForAllUsers(true)
      );
    });
    it('does not call to delete the object, if the user does not have hubspotId', async () => {
      const user = {
        id: userId,
      } as UserEntity;
      const hubspotClient = new HubspotClient('AUTH_TOKEN');
      const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
      await hubspotCrmClient.deleteContact(user);
      expect(hubspotClient.deleteContactRequest).not.toHaveBeenCalled();
    });
    it('calls to delete the object, if the user has hubspotId', async () => {
      const dbUpdate = jest.fn().mockResolvedValue({});
      const getCustomRepository = jest
        .fn()
        .mockReturnValue({ update: dbUpdate });
      (getOrCreateDBConnection as jest.Mock).mockResolvedValue({
        getCustomRepository,
      });
      const user = {
        id: userId,
        hubspotId: userHubspotId,
      } as UserEntity;
      const hubspotClient = new HubspotClient('AUTH_TOKEN');
      const hubspotCrmClient = new HubspotCrmClient(hubspotClient);
      await hubspotCrmClient.deleteContact(user);
      expect(hubspotClient.deleteContactRequest).toHaveBeenCalledTimes(1);
      expect(hubspotClient.deleteContactRequest).toHaveBeenCalledWith(
        user.hubspotId
      );
      expect(getCustomRepository).toHaveBeenCalledWith(UserRepository);
      expect(dbUpdate).toHaveBeenCalledWith(user.id, { hubspot: undefined });
    });
  });
});
