import { Connection, In } from 'typeorm';
import { CompanyRepository } from '.';
import { getOrCreateConnection } from '../../dbConnection';
import { createCompanyMock } from '../../mocks/company';
import { createCompanyPrivacyMock } from '../../mocks/companyPrivacy';
import { createCompanyRelationshipMock } from '../../mocks/companyRelationship';
import { createCorporateEmissionMock } from '../../mocks/emission';
import { getCorporateEmissionAccessMock } from '../../mocks/emissionAccess';
import {
  CarbonIntensityMetricType,
  CarbonIntensityType,
  CompaniesBenchmarkOrderBy,
  CompanyBenchmark,
  CompanyRelationshipType,
  CompanyStatus,
  CorporateEmissionType,
  InviteStatus,
  OrderBy,
} from '../../types';
import { CompanyPrivacyRepository } from '../CompanyPrivacyRepository';
import { CompanyRelationshipRepository } from '../CompanyRelationshipRepository';
import { CorporateEmissionAccessRepository } from '../CorporateEmissionAccessRepository';
import { CorporateEmissionRepository } from '../CorporateEmissionRepository';
import { CarbonIntensityRepository } from '../CarbonIntensityRepository';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';

type CarbonIntensityMock = {
  year: number;
  intensityMetric: CarbonIntensityMetricType;
  intensityValue: number;
  type: CarbonIntensityType;
};

type EmissionMock = {
  year: number;
  type: CorporateEmissionType;
  isPublic: boolean;
  scope1: number;
  scope2: number;
  carbonIntensities: CarbonIntensityMock[];
};

type CompanyMock = {
  id: string;
  name: string;
  duns: string;
  corporateEmissions: EmissionMock[];
  companyRelationship?: {
    companyRelationshipType: CompanyRelationshipType;
    companyRelationshipStatus: InviteStatus;
  };
  privacySettings?: Record<
    'allPlatform' | 'supplierNetwork' | 'customerNetwork',
    boolean
  >;
};

describe('benchmark', () => {
  function getEmissions(baseline: Partial<EmissionMock> = {}) {
    return [
      {
        year: 2010,
        type: CorporateEmissionType.Baseline,
        isPublic: false,
        scope1: 100,
        scope2: 200,
        carbonIntensities: [],
        ...baseline,
      },
      {
        year: 2011,
        type: CorporateEmissionType.Actual,
        isPublic: true,
        scope1: 300,
        scope2: 200,
        carbonIntensities: [],
      },
      {
        year: 2020,
        type: CorporateEmissionType.Actual,
        isPublic: true,
        scope1: 500,
        scope2: 300,
        carbonIntensities: [],
      },
      {
        year: 2021,
        type: CorporateEmissionType.Actual,
        isPublic: false,
        scope1: 600,
        scope2: 300,
        carbonIntensities: [],
      },
    ];
  }

  const myCompany = {
    id: '5AF74C80-7B2B-11ED-A77E-0800200C9A66',
    name: 'My Company',
    duns: '111111111',
  };

  const selectedCompany = {
    id: '5AF74C80-7B2B-11ED-A77E-0800200C9A67',
    name: 'Selected Company',
    duns: '222222222',
  };

  const companyWithPublicPrivacy = {
    id: '44934C20-7B1F-11ED-A77E-0800200C9A66',
    name: 'companyWithPublicPrivacy',
    duns: '333333333',
    corporateEmissions: getEmissions({ isPublic: false, year: 1995 }),
    lastYearCarbonIntensities: [],
    privacySettings: {
      allPlatform: true,
    },
  };
  const companyWithSupplierPrivacy = {
    id: '6D6658E0-7B1F-11ED-A77E-0800200C9A66',
    name: 'companyWithSupplierPrivacy',
    duns: '444444444',
    corporateEmissions: getEmissions({ isPublic: true }),
    privacySettings: {
      supplierNetwork: true,
    },
  };
  const companyWithCustomerPrivacy = {
    id: '91355EB0-7B1F-11ED-A77E-0800200C9A66',
    name: 'companyWithCustomerPrivacy',
    duns: '555555555',
    corporateEmissions: getEmissions({ isPublic: true }),
    privacySettings: {
      customerNetwork: true,
    },
  };
  const companyWithPrivatePrivacy = {
    id: 'A076DB60-7B1F-11ED-A77E-0800200C9A66',
    name: 'companyWithPrivatePrivacy',
    duns: '666666666',
    corporateEmissions: getEmissions({ isPublic: true }),
  };
  const inactiveCompany = {
    id: '838C51DA-7C7B-11ED-A1EB-0242AC120002',
    name: 'inactiveCompany',
    status: CompanyStatus.PendingUserActivation,
  };

  const customerWithPublicPrivacy = {
    id: 'C91395E0-7B1F-11ED-A77E-0800200C9A66',
    name: 'customerWithPublicPrivacy',
    duns: '777777777',
    corporateEmissions: getEmissions({ isPublic: true }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Customer,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      allPlatform: true,
    },
  };
  const customerWithSupplierPrivacy = {
    id: 'C91395E1-7B1F-11ED-A77E-0800200C9A66',
    name: 'customerWithSupplierPrivacy',
    duns: '888888888',
    corporateEmissions: getEmissions({ isPublic: false }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Customer,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      supplierNetwork: true,
    },
  };
  const awaitingCustomerWithSupplierPrivacy = {
    id: 'BDFCBCD0-7B2F-11ED-A77E-0800200C9A66',
    name: 'awaitingCustomerWithSupplierPrivacy',
    duns: '999999999',
    corporateEmissions: getEmissions({ isPublic: true }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Customer,
      companyRelationshipStatus: InviteStatus.AwaitingCustomerApproval,
    },
    privacySettings: {
      supplierNetwork: true,
    },
  };
  const customerWithCustomerPrivacy = {
    id: 'C91395E2-7B1F-11ED-A77E-0800200C9A66',
    name: 'customerWithCustomerPrivacy',
    duns: '1010101010',
    corporateEmissions: getEmissions({ isPublic: false }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Customer,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      customerNetwork: true,
    },
  };
  const customerWithPrivatePrivacy = {
    id: 'C91395E3-7B1F-11ED-A77E-0800200C9A66',
    name: 'customerWithPrivatePrivacy',
    duns: '1111111111111',
    corporateEmissions: getEmissions({ isPublic: true }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Customer,
      companyRelationshipStatus: InviteStatus.Approved,
    },
  };

  const supplierWithPublicPrivacy = {
    id: '29543DB0-7B20-11ED-A77E-0800200C9A66',
    name: 'supplierWithPublicPrivacy',
    duns: '121212121212',
    corporateEmissions: getEmissions({ isPublic: true }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Supplier,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      allPlatform: true,
    },
  };
  const supplierWithSupplierPrivacy = {
    id: '29543DB1-7B20-11ED-A77E-0800200C9A66',
    name: 'supplierWithSupplierPrivacy',
    duns: '131313131313',
    corporateEmissions: getEmissions({ isPublic: false }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Supplier,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      supplierNetwork: true,
    },
  };
  const supplierWithCustomerPrivacy = {
    id: '29543DB2-7B20-11ED-A77E-0800200C9A66',
    name: 'supplierWithCustomerPrivacy',
    duns: '141414141414',
    corporateEmissions: getEmissions({ isPublic: true }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Supplier,
      companyRelationshipStatus: InviteStatus.Approved,
    },
    privacySettings: {
      customerNetwork: true,
    },
  };
  const awaitingSupplierWithCustomerPrivacy = {
    id: 'BDFCBCD1-7B2F-11ED-A77E-0800200C9A66',
    name: 'awaitingSupplierWithCustomerPrivacy',
    duns: '151515151515',
    corporateEmissions: getEmissions({ isPublic: false }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Supplier,
      companyRelationshipStatus: InviteStatus.AwaitingSupplierApproval,
    },
    privacySettings: {
      customerNetwork: true,
    },
  };
  const supplierWithPrivatePrivacy = {
    id: '29543DB3-7B20-11ED-A77E-0800200C9A66',
    name: 'supplierWithPrivatePrivacy',
    duns: '161616161616',
    corporateEmissions: getEmissions({ isPublic: false }),
    companyRelationship: {
      companyRelationshipType: CompanyRelationshipType.Supplier,
      companyRelationshipStatus: InviteStatus.Approved,
    },
  };

  const companies: CompanyMock[] = [
    companyWithPublicPrivacy,
    companyWithSupplierPrivacy,
    companyWithCustomerPrivacy,
    companyWithPrivatePrivacy,
    customerWithPublicPrivacy,
    customerWithSupplierPrivacy,
    awaitingCustomerWithSupplierPrivacy,
    customerWithCustomerPrivacy,
    customerWithPrivatePrivacy,
    supplierWithPublicPrivacy,
    supplierWithSupplierPrivacy,
    supplierWithCustomerPrivacy,
    awaitingSupplierWithCustomerPrivacy,
    supplierWithPrivatePrivacy,
  ];

  companies.forEach((company, i) => {
    company.corporateEmissions = company.corporateEmissions.map(
      (emission, j) => {
        const year = emission.year + i + j;
        return {
          ...emission,
          year,
          carbonIntensities: [
            {
              year,
              intensityMetric: CarbonIntensityMetricType.Km,
              intensityValue: 100 * i * j,
              type: CarbonIntensityType.UserSubmitted,
            },
            {
              year,
              intensityMetric: CarbonIntensityMetricType.NumberOfEmployees,
              intensityValue: 10 * i * j,
              type: CarbonIntensityType.Estimated,
            },
          ],
        };
      }
    );
  });

  const companyIds = [
    selectedCompany.id,
    ...companies.map((company) => company.id),
  ];

  const findAvailableEmissions = (emissions: EmissionMock[]) => {
    const publicEmissions = emissions.filter(({ isPublic }) => isPublic);
    const publicEmissionsSorted = [...publicEmissions].sort(
      (a, b) => b.year - a.year
    );

    return {
      first: publicEmissionsSorted[publicEmissionsSorted.length - 1],
      last: publicEmissionsSorted[0],
    };
  };

  const findIntensityMetric = (
    emission: EmissionMock,
    carbonIntensityMetric: CarbonIntensityMetricType,
    carbonIntensityType: CarbonIntensityType
  ) => {
    const found = emission.carbonIntensities.find((intensity) => {
      return (
        intensity.intensityMetric === carbonIntensityMetric &&
        intensity.type === carbonIntensityType
      );
    });

    if (!found) {
      throw new Error('Carbon intensity mock not found');
    }

    return found;
  };

  const findEstimatedIntensity = (
    emission: EmissionMock,
    carbonIntensityMetric: CarbonIntensityMetricType
  ) => {
    return findIntensityMetric(
      emission,
      carbonIntensityMetric,
      CarbonIntensityType.Estimated
    );
  };

  const calculateEmissionVariance = (
    first: EmissionMock,
    last: EmissionMock
  ) => {
    const total =
      ((last.scope1 + last.scope2 - (first.scope1 + first.scope2)) /
        (first.scope1 + first.scope2)) *
      100;
    const annual = total / (last.year - first.year);

    return {
      total: Number(total.toFixed(2)),
      annual: Number(annual.toFixed(2)),
    };
  };

  const calculateEmissionToIntensityRatio = (
    last: EmissionMock,
    intensityMetric: CarbonIntensityMetricType
  ) => {
    return last.carbonIntensities.find(
      (intensity) => intensity.intensityMetric === intensityMetric
    );
  };

  const calculateBenchmarkData = (company: CompanyMock) => {
    const availableBaseline = company.corporateEmissions.find(
      (emission) =>
        emission.type === CorporateEmissionType.Baseline && emission.isPublic
    );
    const { first, last } = findAvailableEmissions(company.corporateEmissions);
    const estimatedNumberOfEmployees = findEstimatedIntensity(
      last,
      CarbonIntensityMetricType.NumberOfEmployees
    );
    const { total, annual } = calculateEmissionVariance(first, last);
    const intensityRatio = calculateEmissionToIntensityRatio(
      last,
      CarbonIntensityMetricType.UsdOfRevenue
    );

    return {
      companyId: company.id,
      companyName: company.name,
      companyDuns: company.duns,
      estimatedNumberOfEmployees:
        estimatedNumberOfEmployees.intensityValue ?? null,
      baselineYear: availableBaseline?.year ?? null,
      totalEmissionVariance: total,
      annualEmissionVariance: annual,
      emissionToIntensityRatio: intensityRatio ?? null,
      companyRelationshipType:
        company.companyRelationship?.companyRelationshipType ?? null,
      companyRelationshipStatus:
        company.companyRelationship?.companyRelationshipStatus ?? null,
    };
  };

  const convertToPrivateBenchmarkData = (company: CompanyMock) => {
    const lastAvailableEmission = findAvailableEmissions(
      company.corporateEmissions
    ).last;
    const estimatedNumberOfEmployees = findEstimatedIntensity(
      lastAvailableEmission,
      CarbonIntensityMetricType.NumberOfEmployees
    );

    return {
      companyId: company.id,
      companyName: company.name,
      companyDuns: company.duns,
      estimatedNumberOfEmployees:
        estimatedNumberOfEmployees.intensityValue ?? null,
      baselineYear: null,
      totalEmissionVariance: null,
      annualEmissionVariance: null,
      emissionToIntensityRatio: null,
      companyRelationshipType:
        company.companyRelationship?.companyRelationshipType ?? null,
      companyRelationshipStatus:
        company.companyRelationship?.companyRelationshipStatus ?? null,
    };
  };

  const selectedCompanyPinSort = (a: CompanyBenchmark, b: CompanyBenchmark) => {
    if (a.companyId === selectedCompany.id) {
      return -1;
    }
    if (b.companyId === selectedCompany.id) {
      return 1;
    }
    return 0;
  };

  let connection: Connection;
  let companyRepository: CompanyRepository;
  let companyPrivacyRepository: CompanyPrivacyRepository;
  let companyRelationshipRepository: CompanyRelationshipRepository;
  let corporateEmissionRepository: CorporateEmissionRepository;
  let corporateEmissionAccessRepository: CorporateEmissionAccessRepository;
  let carbonIntensityRepository: CarbonIntensityRepository;

  const setupPrivacySettings = () => {
    return companyPrivacyRepository.save(
      companies
        .filter(({ privacySettings }) => privacySettings)
        .map(({ id, privacySettings }) =>
          createCompanyPrivacyMock({
            companyId: id,
            ...privacySettings,
          })
        )
    );
  };

  const setupCompanyRelationships = () => {
    return companyRelationshipRepository.save(
      companies
        .filter(({ companyRelationship }) => companyRelationship)
        .map(({ id, companyRelationship }) =>
          createCompanyRelationshipMock({
            supplierApproverId: undefined,
            customerApproverId: undefined,
            customerId:
              companyRelationship?.companyRelationshipType ===
              CompanyRelationshipType.Customer
                ? id
                : myCompany.id,
            supplierId:
              companyRelationship?.companyRelationshipType ===
              CompanyRelationshipType.Customer
                ? myCompany.id
                : id,
            status: companyRelationship?.companyRelationshipStatus,
          })
        )
    );
  };

  const setupCorporateEmissions = () => {
    return Promise.all(
      companies.map((company) => {
        return Promise.all(
          company.corporateEmissions.map(async (emission) => {
            const emissionEntity = await corporateEmissionRepository.save(
              createCorporateEmissionMock({
                companyId: company.id,
                scope1: emission.scope1,
                scope2: emission.scope2,
                type: emission.type,
                year: emission.year,
              })
            );
            await Promise.all([
              corporateEmissionAccessRepository.save(
                getCorporateEmissionAccessMock({
                  emissionId: emissionEntity.id,
                  scope1And2: emission.isPublic,
                })
              ),
              carbonIntensityRepository.save(
                emission.carbonIntensities.map((carbonIntensity) =>
                  createCarbonIntensityMock({
                    ...carbonIntensity,
                    companyId: company.id,
                    emissionId: emissionEntity.id,
                  })
                )
              ),
            ]);
          })
        );
      })
    );
  };

  const setup = async () => {
    await companyRepository.save(
      [myCompany, selectedCompany, ...companies].map(({ id, name, duns }) =>
        createCompanyMock({ id, name, duns })
      )
    );
    await companyRepository.save(createCompanyMock(inactiveCompany));
    await setupPrivacySettings();
    await setupCompanyRelationships();
    await setupCorporateEmissions();
  };

  const teardown = async () => {
    const emissions = await corporateEmissionRepository.find({
      companyId: In(companies.map(({ id }) => id)),
    });
    if (emissions.length) {
      const emissionIds = emissions.map(({ id }) => id);

      await carbonIntensityRepository.delete({
        emissionId: In(emissionIds),
      });
      await corporateEmissionAccessRepository.delete({
        emissionId: In(emissionIds),
      });

      await corporateEmissionRepository.delete(emissions.map(({ id }) => id));
    }
    await companyRelationshipRepository.delete({ supplierId: myCompany.id });
    await companyRelationshipRepository.delete({ customerId: myCompany.id });
    await companyPrivacyRepository.delete({
      companyId: In(companies.map(({ id }) => id)),
    });
    await companyRepository.delete(
      [myCompany, selectedCompany, inactiveCompany, ...companies].map(
        ({ id }) => id
      )
    );
  };

  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getCustomRepository(CompanyRepository);
    companyPrivacyRepository = connection.getCustomRepository(
      CompanyPrivacyRepository
    );
    companyRelationshipRepository = connection.getCustomRepository(
      CompanyRelationshipRepository
    );
    corporateEmissionRepository = connection.getCustomRepository(
      CorporateEmissionRepository
    );
    corporateEmissionAccessRepository = connection.getCustomRepository(
      CorporateEmissionAccessRepository
    );
    carbonIntensityRepository = connection.getCustomRepository(
      CarbonIntensityRepository
    );

    await teardown();
    await setup();
  });
  afterAll(async () => {
    await teardown();
  });
  describe('getCompaniesBenchmark', () => {
    describe('filter', () => {
      it('returns all the active companies except for the requesting company', async () => {
        const benchmarkData = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit: 1000,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );
        expect(benchmarkData).toEqual(
          expect.arrayContaining(
            companies.map(({ id, name }) =>
              expect.objectContaining({ companyId: id, companyName: name })
            )
          )
        );
        expect(benchmarkData).not.toEqual(
          expect.arrayContaining(
            [myCompany, inactiveCompany].map(({ id, name }) =>
              expect.objectContaining({
                companyId: id,
                companyName: name,
              })
            )
          )
        );
        expect(benchmarkData.length).toBe(companyIds.length);
      });
      it('returns the correct number of rows as per "limit" parameter', async () => {
        const limit = 5;
        const benchmarkData = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );
        expect(benchmarkData.length).toBe(limit);
      });
      it('returns the correct number of rows skipping the "offset" number og nows', async () => {
        const limit = 8;
        const benchmarkDataWithoutOffset = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );

        const offset = 3;
        const benchmarkDataWithOffset = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset,
            limit,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );

        expect(benchmarkDataWithOffset.length).toBe(limit);
        expect(benchmarkDataWithoutOffset[offset]).toEqual(
          benchmarkDataWithOffset[0]
        );
      });
    });
    describe('sort', () => {
      it('returns the data sorted with company name in desc order', async () => {
        const benchmarkData = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit: 100,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );

        const sortingFunction = (a: CompanyBenchmark, b: CompanyBenchmark) => {
          return b.companyName.localeCompare(a.companyName);
        };
        const sorted = [...benchmarkData]
          .sort(sortingFunction)
          .sort(selectedCompanyPinSort);
        expect(benchmarkData).toStrictEqual(sorted);
      });
      it('returns the data sorted with company name in asc order', async () => {
        const benchmarkData = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit: 100,
            orderBy: CompaniesBenchmarkOrderBy.CompanyName,
            order: OrderBy.Asc,
            selectedCompanyId: selectedCompany.id,
          }
        );

        const sortingFunction = (a: CompanyBenchmark, b: CompanyBenchmark) => {
          return a.companyName.localeCompare(b.companyName);
        };

        expect(benchmarkData).toStrictEqual(
          [...benchmarkData].sort(sortingFunction).sort(selectedCompanyPinSort)
        );
      });
      it('returns the data sorted with baseline year in desc order', async () => {
        const benchmarkData = await companyRepository.getCompaniesBenchmark(
          myCompany.id,
          companyIds,
          {
            intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
            intensityType: CarbonIntensityType.Estimated,
            offset: 0,
            limit: 100,
            orderBy: CompaniesBenchmarkOrderBy.BaselineYear,
            order: OrderBy.Desc,
            selectedCompanyId: selectedCompany.id,
          }
        );

        const sortingFunction = (a: CompanyBenchmark, b: CompanyBenchmark) => {
          if (a.baselineYear && b.baselineYear) {
            return b.baselineYear - a.baselineYear;
          }
          return 0;
        };
        const sorted = [...benchmarkData]
          .sort(sortingFunction)
          .sort(selectedCompanyPinSort);
        expect(benchmarkData).toStrictEqual(sorted);
      });
    });
    it('returns the data sorted with baseline year in asc order', async () => {
      const benchmarkData = await companyRepository.getCompaniesBenchmark(
        myCompany.id,
        companyIds,
        {
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityType: CarbonIntensityType.Estimated,
          offset: 0,
          limit: 100,
          orderBy: CompaniesBenchmarkOrderBy.BaselineYear,
          order: OrderBy.Asc,
          selectedCompanyId: selectedCompany.id,
        }
      );

      const sortingFunction = (a: CompanyBenchmark, b: CompanyBenchmark) => {
        if (a.baselineYear && b.baselineYear) {
          return a.baselineYear - b.baselineYear;
        }
        return 0;
      };
      const sorted = [...benchmarkData].sort(sortingFunction);
      expect(benchmarkData).toStrictEqual(sorted);
    });
  });
  describe("when the companies' privacy settings are set to private", () => {
    it('returns the company name, estimated number of employees, company relationship', async () => {
      const benchmarkData = await companyRepository.getCompaniesBenchmark(
        myCompany.id,
        companyIds,
        {
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityType: CarbonIntensityType.Estimated,
          offset: 0,
          limit: 100,
          orderBy: CompaniesBenchmarkOrderBy.CompanyName,
          order: OrderBy.Asc,
          selectedCompanyId: selectedCompany.id,
        }
      );

      const companiesWithPrivateSettings = companies
        .filter(({ privacySettings }) => !privacySettings)
        .map(convertToPrivateBenchmarkData);

      expect(companiesWithPrivateSettings.length).toMatchSnapshot();
      expect(benchmarkData).toEqual(
        expect.arrayContaining(companiesWithPrivateSettings)
      );
    });
  });
  describe("when the companies' privacy settings give access to the customers", () => {
    it('returns the supplier companies benchmark data correctly', async () => {
      const benchmarkData = await companyRepository.getCompaniesBenchmark(
        myCompany.id,
        companyIds,
        {
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityType: CarbonIntensityType.Estimated,
          offset: 0,
          limit: 100,
          orderBy: CompaniesBenchmarkOrderBy.CompanyName,
          order: OrderBy.Asc,
          selectedCompanyId: selectedCompany.id,
        }
      );

      const suppliersGivingAccessToCustomers = companies
        .filter(
          (company) =>
            company.privacySettings?.customerNetwork &&
            company.companyRelationship?.companyRelationshipType ===
              CompanyRelationshipType.Supplier &&
            company.companyRelationship?.companyRelationshipStatus ===
              InviteStatus.Approved
        )
        .map(calculateBenchmarkData);

      expect(suppliersGivingAccessToCustomers.length).toMatchSnapshot();
      expect(benchmarkData).toEqual(
        expect.arrayContaining(suppliersGivingAccessToCustomers)
      );
    });
  });
  describe("when the companies' privacy settings give access to the suppliers", () => {
    it('returns the customer companies benchmark data correctly', async () => {
      const benchmarkData = await companyRepository.getCompaniesBenchmark(
        myCompany.id,
        companyIds,
        {
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityType: CarbonIntensityType.Estimated,
          offset: 0,
          limit: 100,
          orderBy: CompaniesBenchmarkOrderBy.CompanyName,
          order: OrderBy.Asc,
          selectedCompanyId: selectedCompany.id,
        }
      );

      const customersGivingAccessToSuppliers = companies
        .filter(
          (company) =>
            company.privacySettings?.supplierNetwork &&
            company.companyRelationship?.companyRelationshipType ===
              CompanyRelationshipType.Customer &&
            company.companyRelationship?.companyRelationshipStatus ===
              InviteStatus.Approved
        )
        .map(calculateBenchmarkData);

      expect(customersGivingAccessToSuppliers.length).toMatchSnapshot();
      expect(benchmarkData).toEqual(
        expect.arrayContaining(customersGivingAccessToSuppliers)
      );
    });
  });
  describe("when the companies' privacy settings are set to public", () => {
    it('returns the benchmark data correctly', async () => {
      const benchmarkData = await companyRepository.getCompaniesBenchmark(
        myCompany.id,
        companyIds,
        {
          intensityMetric: CarbonIntensityMetricType.UsdOfRevenue,
          intensityType: CarbonIntensityType.Estimated,
          offset: 0,
          limit: 100,
          orderBy: CompaniesBenchmarkOrderBy.CompanyName,
          order: OrderBy.Asc,
          selectedCompanyId: selectedCompany.id,
        }
      );

      const companyWithPublicSettings = companies
        .filter((company) => Boolean(company.privacySettings?.allPlatform))
        .map(calculateBenchmarkData);

      expect(companyWithPublicSettings.length).toMatchSnapshot();
      expect(benchmarkData).toEqual(
        expect.arrayContaining(companyWithPublicSettings)
      );
    });
  });
});
