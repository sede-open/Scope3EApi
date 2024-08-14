import { EntityRepository } from 'typeorm';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { ICorporateEmission } from '../../services/CorporateEmissionService/types';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';
import { CustomRepository } from '../Repository';
import { EmissionMissingIntensity } from './types';

@EntityRepository(CorporateEmissionEntity)
export class CorporateEmissionRepository extends CustomRepository<
  CorporateEmissionEntity,
  ICorporateEmission
> {
  updateEntity(
    attributes: ICorporateEmission
  ): Promise<CorporateEmissionEntity> {
    return this.save(attributes);
  }

  createEntity(
    attributes: Omit<ICorporateEmission, 'id'>
  ): Promise<CorporateEmissionEntity> {
    return this.save(attributes);
  }

  findEmissionsMissingEstimatedIntensity(
    intensityMetric:
      | CarbonIntensityMetricType.NumberOfEmployees
      | CarbonIntensityMetricType.UsdOfRevenue
  ): Promise<EmissionMissingIntensity[]> {
    /**
     * Checking if the company's latest public emission has a carbon intensity
     */
    return this.query(
      `
      SELECT
        e.id AS emissionId,
        e.company_id AS companyId,
        e.year AS emissionYear,
        c.name AS companyName,
        c.dnb_duns AS duns
      FROM
        CORPORATE_EMISSION AS e
        LEFT JOIN COMPANY AS c ON c.id = e.company_id
        LEFT JOIN CARBON_INTENSITY AS ci ON ci.company_id = e.company_id
          AND ci.carbon_intensity_metric = @0
          AND ci.year = e.year
          AND ci.type = @1
      WHERE
        ci.carbon_intensity_value IS NULL --missing intensity
        AND e.year = (
          SELECT
            MAX(em.year) --last public emission year
          FROM
            CORPORATE_EMISSION AS em
          LEFT JOIN CORPORATE_EMISSION_ACCESS AS access
            ON em.id = access.emission_id
          WHERE
            em.company_id = e.company_id
            AND access.scope_1_2 = 1);
    `,
      [intensityMetric, CarbonIntensityType.Estimated]
    );
  }

  findEmissionsConsideringAccess(
    targetCompanyId: string
  ): Promise<CorporateEmissionEntity[]> {
    return this.query(
      `
      SELECT
        corporateEmission.id,
        corporateEmission.type,
        corporateEmission.year,
        corporateEmission.scope_1 AS scope1,
        corporateEmission.scope_2 AS scope2,
        (CASE
          WHEN emissionAccess.scope_3 = 1 THEN corporateEmission.scope_3 ELSE NULL
        END) AS scope3,
        corporateEmission.scope_2_type AS scope2Type,
        (CASE
          WHEN emissionAccess.carbon_offsets = 1 THEN corporateEmission.offset ELSE NULL
        END) AS offset
      FROM CORPORATE_EMISSION AS corporateEmission
        LEFT JOIN CORPORATE_EMISSION_ACCESS AS emissionAccess
          ON emissionAccess.emission_id = corporateEmission.id
            AND (emissionAccess.scope_1_2 = 1)
      WHERE
        corporateEmission.company_id = @0
          AND emissionAccess.scope_1_2 = 1
      ORDER BY
        corporateEmission.year ASC
      ;
    `,
      [targetCompanyId]
    );
  }
}
