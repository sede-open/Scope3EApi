import { Connection, In } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { createCompanyMock } from '../../mocks/company';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';
import { CarbonIntensityRepository } from '../CarbonIntensityRepository';
import { CompanyRepository } from '../CompanyRepository';
import { CorporateEmissionRepository } from '.';
import { CorporateEmissionAccessRepository } from '../CorporateEmissionAccessRepository';
import { createCorporateEmissionAccessMock } from '../../mocks/emissionAccess';

describe('CorporateEmissionRepository', () => {
  let connection: Connection;
  let companyRepository: CompanyRepository;
  let corporateEmissionRepository: CorporateEmissionRepository;
  let corporateEmissionAccessRepository: CorporateEmissionAccessRepository;
  let carbonIntensityRepository: CarbonIntensityRepository;

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getCustomRepository(CompanyRepository);
    corporateEmissionRepository = connection.getCustomRepository(
      CorporateEmissionRepository
    );
    corporateEmissionAccessRepository = connection.getCustomRepository(
      CorporateEmissionAccessRepository
    );
    carbonIntensityRepository = connection.getCustomRepository(
      CarbonIntensityRepository
    );
  });
  describe('findEmissionsMissingEstimatedIntensity', () => {
    const companyWithBothIntensities = {
      id: 'D98E0700-70C7-11ED-8A30-0800200C9A66',
      name: 'Company with both intensities',
      duns: '1',
    };

    const companyMissingBothIntensities = {
      id: '528A8CB5-F4D7-4806-9476-5BA78B0DB89A',
      name: 'Company with no intensities',
      duns: '2',
    };

    const companyMissingUsdOfRevenue = {
      id: '17A05283-A326-49C6-9AD1-3FFA16A66A70',
      name: 'Company with usd of revenue',
      duns: '3',
    };

    const companyMissingNumberOfEmployees = {
      id: '9CD2A32B-F6B2-458B-9CF9-8C7EDF8DB3F5',
      name: 'Company with number of employees',
      duns: '4',
    };

    const companies = [
      companyWithBothIntensities,
      companyMissingBothIntensities,
      companyMissingUsdOfRevenue,
      companyMissingNumberOfEmployees,
    ];

    const emissions = [
      {
        id: '0EAA1505-22EE-4B17-8F86-E86D683D7F11',
        companyId: companyWithBothIntensities.id,
        year: 2020,
        publicAccess: true,
      },
      {
        id: '66905DAC-8BF5-43F2-ACFA-3467C86489C5',
        companyId: companyWithBothIntensities.id,
        year: 2021,
        publicAccess: false,
      },
      {
        id: '74108B51-8963-4B05-BC90-C29020BD5993',
        companyId: companyMissingBothIntensities.id,
        year: 2010,
        publicAccess: true,
      },
      {
        id: 'EC858B30-AE80-49ED-A1DA-9FFA48D57B90',
        companyId: companyMissingBothIntensities.id,
        year: 2013,
        publicAccess: false,
      },
      {
        id: '9CD2A32B-F6B2-458B-9CF9-8C7EDF8DB3F5',
        companyId: companyMissingUsdOfRevenue.id,
        year: 2018,
        publicAccess: true,
      },
      {
        id: 'D1CE0830-5D01-46AE-AF9D-475C48EC3D70',
        companyId: companyMissingNumberOfEmployees.id,
        year: 2000,
        publicAccess: true,
      },
    ];

    const intensities = [
      {
        id: '4AA73533-15E5-42C8-B22D-ED2C2448DF7D',
        emissionId: '0EAA1505-22EE-4B17-8F86-E86D683D7F11', // 2020
        year: 2020,
        companyId: companyWithBothIntensities.id,
        metric: CarbonIntensityMetricType.UsdOfRevenue,
        type: CarbonIntensityType.Estimated,
      },
      {
        id: '580D7982-1737-4837-8C9E-2082B54AF59C',
        emissionId: '0EAA1505-22EE-4B17-8F86-E86D683D7F11', // 2020
        year: 2020,
        companyId: companyWithBothIntensities.id,
        metric: CarbonIntensityMetricType.NumberOfEmployees,
        type: CarbonIntensityType.Estimated,
      },
      {
        id: '1E0F13D0-70CB-11ED-8A30-0800200C9A66',
        emissionId: 'EC858B30-AE80-49ED-A1DA-9FFA48D57B90', // 2013
        year: 2013,
        companyId: companyMissingBothIntensities.id,
        metric: CarbonIntensityMetricType.NumberOfEmployees,
        type: CarbonIntensityType.Estimated,
      },
      {
        id: '45A3C7EC-426F-419B-AA41-C9DD090585D0',
        emissionId: '9CD2A32B-F6B2-458B-9CF9-8C7EDF8DB3F5',
        year: 2018,
        companyId: companyMissingUsdOfRevenue.id,
        metric: CarbonIntensityMetricType.NumberOfEmployees,
        type: CarbonIntensityType.Estimated,
      },
      {
        id: '17A05283-A326-49C6-9AD1-3FFA16A66A70',
        emissionId: '9CD2A32B-F6B2-458B-9CF9-8C7EDF8DB3F5',
        year: 2018,
        companyId: companyMissingUsdOfRevenue.id,
        metric: CarbonIntensityMetricType.NumberOfEmployees,
        type: CarbonIntensityType.UserSubmitted,
      },
      {
        id: '9507CE4B-A361-443F-B2E9-DA9B385E08C8',
        emissionId: 'D1CE0830-5D01-46AE-AF9D-475C48EC3D70',
        year: 2000,
        companyId: companyMissingNumberOfEmployees.id,
        metric: CarbonIntensityMetricType.UsdOfRevenue,
        type: CarbonIntensityType.Estimated,
      },
    ];

    const getLatestPublicEmission = (companyId: string) => {
      const [latestPublicEmission] = emissions
        .filter(
          (emission) =>
            emission.publicAccess && emission.companyId === companyId
        )
        .sort((a, b) => b.year - a.year);
      return latestPublicEmission;
    };
    const setup = async () => {
      await companyRepository.save(
        companies.map(({ id, duns, name }) =>
          createCompanyMock({ id, duns, name })
        )
      );
      await corporateEmissionRepository.save(
        emissions.map(({ id, year, companyId }) => {
          return createCorporateEmissionMock({
            id,
            companyId,
            year,
          });
        })
      );
      await corporateEmissionAccessRepository.save(
        emissions.map(({ id, publicAccess }) => {
          return createCorporateEmissionAccessMock({
            id: undefined,
            emissionId: id,
            scope1And2: publicAccess,
          });
        })
      );
      await carbonIntensityRepository.save(
        intensities.map(({ id, emissionId, metric, type, companyId, year }) => {
          return createCarbonIntensityMock({
            id,
            companyId,
            emissionId,
            year,
            intensityMetric: metric,
            type,
          });
        })
      );
    };
    const teardown = async () => {
      await carbonIntensityRepository.delete(intensities.map(({ id }) => id));
      await corporateEmissionRepository.delete(emissions.map(({ id }) => id));
      await corporateEmissionAccessRepository.delete({
        emissionId: In(emissions.map(({ id }) => id)),
      });
      await companyRepository.delete(companies.map(({ id }) => id));
    };

    beforeEach(async () => {
      await teardown();
      await setup();
    });
    afterAll(async () => {
      await teardown();
    });
    it(`returns the latest public emission data missing the ${CarbonIntensityMetricType.UsdOfRevenue} estimated carbon intensity`, async () => {
      const result = await corporateEmissionRepository.findEmissionsMissingEstimatedIntensity(
        CarbonIntensityMetricType.UsdOfRevenue
      );

      expect(result.length).toBe(2);
      expect(result).toContainEqual({
        companyId: companyMissingBothIntensities.id,
        duns: companyMissingBothIntensities.duns,
        companyName: companyMissingBothIntensities.name,
        emissionId: getLatestPublicEmission(companyMissingBothIntensities.id)
          .id,
        emissionYear: getLatestPublicEmission(companyMissingBothIntensities.id)
          .year,
      });
      expect(result).toContainEqual({
        companyId: companyMissingUsdOfRevenue.id,
        duns: companyMissingUsdOfRevenue.duns,
        companyName: companyMissingUsdOfRevenue.name,
        emissionId: getLatestPublicEmission(companyMissingUsdOfRevenue.id).id,
        emissionYear: getLatestPublicEmission(companyMissingUsdOfRevenue.id)
          .year,
      });
    });
    it(`returns the latest public emission data missing the ${CarbonIntensityMetricType.NumberOfEmployees} estimated carbon intensity`, async () => {
      const result = await corporateEmissionRepository.findEmissionsMissingEstimatedIntensity(
        CarbonIntensityMetricType.NumberOfEmployees
      );

      expect(result.length).toBe(2);
      expect(result).toContainEqual({
        companyId: companyMissingBothIntensities.id,
        duns: companyMissingBothIntensities.duns,
        companyName: companyMissingBothIntensities.name,
        emissionId: getLatestPublicEmission(companyMissingBothIntensities.id)
          .id,
        emissionYear: getLatestPublicEmission(companyMissingBothIntensities.id)
          .year,
      });
      expect(result).toContainEqual({
        companyId: companyMissingNumberOfEmployees.id,
        duns: companyMissingNumberOfEmployees.duns,
        companyName: companyMissingNumberOfEmployees.name,
        emissionId: getLatestPublicEmission(companyMissingNumberOfEmployees.id)
          .id,
        emissionYear: getLatestPublicEmission(
          companyMissingNumberOfEmployees.id
        ).year,
      });
    });
  });
  describe('findEmissionsConsideringAccess', () => {
    const companyId = 'C0E1C8A2-7B3A-4A0C-BF61-1A1C1D1A8F60';
    const scope1 = 1000;
    const scope2 = 2000;
    const scope3 = 3000;
    const offset = 400;
    const publicEmission = {
      id: '9CD2A32B-F6B2-458B-9CF9-8C7EDF8DB3F5',
      year: 2018,
      scope1And2Access: true,
      scope3Access: true,
      offsetAccess: true,
    };
    const privateEmission = {
      id: 'D1CE0830-5D01-46AE-AF9D-475C48EC3D70',
      year: 2017,
      scope1And2Access: false,
      scope3Access: false,
      offsetAccess: false,
    };
    const scop1And2Emission = {
      id: '8A5F0C0E-6F1A-4F1C-9A6F-7A5D5C5E7C5D',
      year: 2016,
      scope1And2Access: true,
      scope3Access: false,
      offsetAccess: false,
    };
    const scope1And2And3Emission = {
      id: 'E1C8D1C0-A6C7-4E1E-AC9D-5D5A5A5D5E5B',
      year: 2015,
      scope1And2Access: true,
      scope3Access: true,
      offsetAccess: false,
    };
    const scope1And2AndOffsetEmission = {
      id: 'A6F3E1D3-6C9B-4B1C-9A6F-7A5D5C5E7C5D',
      year: 2014,
      scope1And2Access: true,
      scope3Access: false,
      offsetAccess: true,
    };
    const scope3Emission = {
      id: 'C1A8D1C0-A6C7-4E1E-AC9D-5D5A5A5D5E5B',
      year: 2013,
      scope1And2Access: false,
      scope3Access: true,
      offsetAccess: false,
    };
    const offsetEmission = {
      id: 'B1A8D1C0-A6C7-4E1E-AC9D-5D5A5A5D5E5B',
      year: 2012,
      scope1And2Access: false,
      scope3Access: false,
      offsetAccess: true,
    };
    const emissions = [
      publicEmission,
      privateEmission,
      scop1And2Emission,
      scope1And2And3Emission,
      scope1And2AndOffsetEmission,
      scope3Emission,
      offsetEmission,
    ];
    const setup = async () => {
      await companyRepository.save(createCompanyMock({ id: companyId }));
      await corporateEmissionRepository.save(
        emissions.map(({ id, year }) => {
          return createCorporateEmissionMock({
            id,
            companyId,
            year,
            scope1,
            scope2,
            scope3,
            offset,
          });
        })
      );
      await corporateEmissionAccessRepository.save(
        emissions.map(
          ({ id, scope1And2Access, scope3Access, offsetAccess }) => {
            return createCorporateEmissionAccessMock({
              emissionId: id,
              scope1And2: scope1And2Access,
              scope3: scope3Access,
              carbonOffsets: offsetAccess,
            });
          }
        )
      );
    };
    const teardown = async () => {
      await corporateEmissionAccessRepository.delete({
        emissionId: In(emissions.map(({ id }) => id)),
      });
      await corporateEmissionRepository.delete(emissions.map(({ id }) => id));
      await companyRepository.delete(companyId);
    };
    beforeEach(async () => {
      await teardown();
      await setup();
    });
    afterAll(async () => {
      await teardown();
    });
    it('returns all the emissions that have public scope 1 and 2 access and hides the private data', async () => {
      const result = await corporateEmissionRepository.findEmissionsConsideringAccess(
        companyId
      );

      expect(result).toEqual([
        expect.objectContaining({
          id: scope1And2AndOffsetEmission.id,
          year: scope1And2AndOffsetEmission.year,
          scope1,
          scope2,
          scope3: null,
          offset,
        }),
        expect.objectContaining({
          id: scope1And2And3Emission.id,
          year: scope1And2And3Emission.year,
          scope1,
          scope2,
          scope3,
          offset: null,
        }),
        expect.objectContaining({
          id: scop1And2Emission.id,
          year: scop1And2Emission.year,
          scope1,
          scope2,
          scope3: null,
          offset: null,
        }),
        expect.objectContaining({
          id: publicEmission.id,
          year: publicEmission.year,
          scope1,
          scope2,
          scope3,
          offset,
        }),
      ]);

      expect(result).not.toContainEqual([
        expect.objectContaining({ id: privateEmission.id }),
        expect.objectContaining({ id: scope3Emission.id }),
        expect.objectContaining({ id: offsetEmission.id }),
      ]);
    });
  });
});
