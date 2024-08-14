import { EntityRepository, In } from 'typeorm';
import { CompanyEntity } from '../../entities/Company';
import {
  CarbonIntensityMetricType,
  CarbonIntensityType,
  CompaniesBenchmarkInput,
  CompaniesBenchmarkOrderBy,
  Company,
  CompanyBenchmark,
  CompanyRelationshipType,
  CorporateEmissionType,
  InviteStatus,
} from '../../types';
import { CustomRepository } from '../Repository';
import { CompanyWithDuns } from './types';

@EntityRepository(CompanyEntity)
export class CompanyRepository extends CustomRepository<
  CompanyEntity,
  Company
> {
  companiesWithDuns(): Promise<CompanyWithDuns[]> {
    return this.createQueryBuilder('company')
      .select(
        'company.id as id, company.name as name, company.dnb_duns as duns'
      )
      .where('company.dnb_duns IS NOT NULL')
      .getRawMany<CompanyWithDuns>();
  }

  async dunsNumbersToCompanyIds(
    dunsNumbers: string[]
  ): Promise<{ id: string; duns: string }[]> {
    return this.createQueryBuilder('company')
      .select('company.id as id, company.dnb_duns as duns')
      .where({ duns: In(dunsNumbers) })
      .getRawMany<{ id: string; duns: string }>();
  }

  async dunsNumbersToCompanyIdsAsMap(dunsNumbers: string[]) {
    const dunsToCompanyIdMap: Record<string, string> = {};

    const data = await this.dunsNumbersToCompanyIds(dunsNumbers);

    data.forEach(({ id, duns }) => {
      dunsToCompanyIdMap[duns] = id;
    });

    return dunsToCompanyIdMap;
  }

  async getCompaniesBenchmark(
    requesterCompanyId: string,
    companies: string[],
    options: CompaniesBenchmarkInput
  ): Promise<CompanyBenchmark[]> {
    if (companies.length === 0) {
      return [];
    }

    const orderByMap: Record<CompaniesBenchmarkOrderBy, string> = {
      COMPANY_NAME: 'companyName',
      CARBON_INTENSITY_RATIO: 'emissionToIntensityRatio',
      ESTIMATED_NUMBER_OF_EMPLOYEES: 'estimatedNumberOfEmployees',
      BASELINE_YEAR: 'baselineYear',
      TOTAL_EMISSION_VARIANCE: 'totalEmissionVariance',
      ANNUAL_EMISSION_VARIANCE: 'annualEmissionVariance',
      COMPANY_RELATIONSHIP: `companyRelationshipType ${options.order}, companyRelationshipStatus`,
    };

    const orderBy = orderByMap[options.orderBy];
    const checkColumn =
      orderBy === orderByMap.COMPANY_RELATIONSHIP
        ? 'companyRelationshipType'
        : orderBy;

    const companyIndices = companies.map((_, i) => `@${i + 3}`).join(',');

    return this.query(
      `
      WITH results AS (
        SELECT
          DISTINCT company.id AS companyId,
          company.dnb_duns AS companyDuns,
          company.name AS companyName,
          estimatedEmployeesIntensity.carbon_intensity_value AS estimatedNumberOfEmployees,
          relationship.status AS companyRelationshipStatus,
          (
            CASE
              WHEN relationship.customer_id = @0 THEN '${
                CompanyRelationshipType.Supplier
              }'
              WHEN relationship.supplier_id = @0 THEN '${
                CompanyRelationshipType.Customer
              }'
            END) AS companyRelationshipType,
          (
            CASE
              WHEN baselineAccess.scope_1_2 = 1 AND privacy.id IS NOT NULL THEN baseline. [year]
            END) AS baselineYear,
          (
            CASE
              WHEN privacy.id IS NULL THEN NULL
              WHEN lastAvailableEmission. [year] - firstAvailableEmission. [year] = 0 THEN 0
              ELSE CONVERT(DECIMAL (10, 2), 
                ((lastAvailableEmission.scope_1 + lastAvailableEmission.scope_2) - (firstAvailableEmission.scope_1 + firstAvailableEmission.scope_2))
                / (firstAvailableEmission.scope_1 + firstAvailableEmission.scope_2) * 100)
            END
          ) AS totalEmissionVariance,
          (
            CASE
              WHEN privacy.id IS NULL THEN NULL
              WHEN lastAvailableEmission. [year] - firstAvailableEmission. [year] = 0 THEN 0
              ELSE CONVERT(DECIMAL (10, 2),
                ((lastAvailableEmission.scope_1 + lastAvailableEmission.scope_2) - (firstAvailableEmission.scope_1 + firstAvailableEmission.scope_2))
                  / (firstAvailableEmission.scope_1 + firstAvailableEmission.scope_2) * 100
                  / (lastAvailableEmission. [year] - firstAvailableEmission. [year]))
            END) AS annualEmissionVariance,
          (
            CASE 
              WHEN ${
                options.intensityType === CarbonIntensityType.UserSubmitted
                  ? 'privacy.id IS NOT NULL AND lastAvailableEmissionAccess.carbon_intensity = 1'
                  : ''
              } lastAvailableEmission.id IS NOT NULL AND carbonIntensity.carbon_intensity_value > 0 THEN
                CONVERT(DECIMAL (10, 2), (lastAvailableEmission.scope_1 + lastAvailableEmission.scope_2) / carbonIntensity.carbon_intensity_value ${
                  options.intensityMetric ===
                  CarbonIntensityMetricType.UsdOfRevenue
                    ? '* 1000000'
                    : ''
                })
              END) AS emissionToIntensityRatio
        FROM
          COMPANY AS company
          LEFT JOIN COMPANY_RELATIONSHIP AS relationship ON
            (relationship.customer_id = @0 AND relationship.supplier_id = company.id)
              OR (relationship.supplier_id = @0 AND relationship.customer_id = company.id)
          LEFT JOIN COMPANY_PRIVACY AS privacy ON privacy.company_id = company.id
            AND (privacy.all_platform = 1
              OR (relationship.status = '${InviteStatus.Approved}'
                AND (relationship.supplier_id = @0 AND privacy.supplier_network = 1)
                OR (relationship.customer_id = @0 AND privacy.customer_network = 1)))
          LEFT JOIN CORPORATE_EMISSION AS baseline ON baseline.company_id = company.id
            AND baseline. [type] = '${CorporateEmissionType.Baseline}'
          LEFT JOIN CORPORATE_EMISSION_ACCESS AS baselineAccess ON baselineAccess.emission_id = baseline.id
          LEFT JOIN (
            SELECT
              publicEmission.company_id,
              MAX(publicEmission. [year]) AS maxYear,
              MIN(publicEmission. [year]) AS minYear
            FROM
              CORPORATE_EMISSION AS publicEmission
              INNER JOIN CORPORATE_EMISSION_ACCESS AS publicEmissionAccess ON publicEmission.id = publicEmissionAccess.emission_id
            WHERE
              publicEmissionAccess.scope_1_2 = 1
            GROUP BY
              publicEmission.company_id) AS availableEmissionData ON availableEmissionData.company_id = company.id
          LEFT JOIN CORPORATE_EMISSION AS firstAvailableEmission ON firstAvailableEmission.company_id = company.id
            AND firstAvailableEmission. [year] = availableEmissionData.minYear
          LEFT JOIN CORPORATE_EMISSION AS lastAvailableEmission ON lastAvailableEmission.company_id = company.id
            AND lastAvailableEmission. [year] = availableEmissionData.maxYear
          LEFT JOIN CORPORATE_EMISSION_ACCESS AS lastAvailableEmissionAccess ON lastAvailableEmissionAccess.emission_id = lastAvailableEmission.id
          LEFT JOIN CARBON_INTENSITY AS estimatedEmployeesIntensity ON estimatedEmployeesIntensity.emission_id = lastAvailableEmission.id
            AND estimatedEmployeesIntensity. [type] = '${
              CarbonIntensityType.Estimated
            }'
            AND estimatedEmployeesIntensity.carbon_intensity_metric = '${
              CarbonIntensityMetricType.NumberOfEmployees
            }'
          LEFT JOIN CARBON_INTENSITY AS carbonIntensity ON carbonIntensity.emission_id = lastAvailableEmission.id
            AND carbonIntensity. [type] = '${options.intensityType}'
            AND carbonIntensity.carbon_intensity_metric = @1
        WHERE
          company.id IN (${companyIndices})
        )

      SELECT * FROM results
      ORDER BY
        CASE WHEN companyId = @2 THEN 0 ELSE 1 END,
        CASE WHEN ${checkColumn} IS NULL THEN 1 ELSE 0 END,
        ${orderBy} ${options.order}
      OFFSET ${options.offset} ROWS
      FETCH NEXT ${options.limit} ROWS ONLY
      ;
    `,
      [
        requesterCompanyId,
        options.intensityMetric,
        options.selectedCompanyId,
        ...companies,
      ]
    );
  }
}
