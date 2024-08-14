import { EntityRepository } from 'typeorm';
import { CompanyPrivacyEntity } from '../../entities/CompanyPrivacy';
import { CustomRepository } from '../Repository';
import { CompanyPrivacy, CompanyPrivacyCount } from './types';

@EntityRepository(CompanyPrivacyEntity)
export class CompanyPrivacyRepository extends CustomRepository<
  CompanyPrivacyEntity,
  CompanyPrivacy
> {
  async createEntity(attributes: Omit<CompanyPrivacy, 'id'>) {
    return this.save(attributes);
  }

  async updateEntity(attributes: CompanyPrivacy) {
    if (attributes.id) {
      return this.save(attributes);
    }
    const companyPrivacy = await this.findOneOrFail({
      companyId: attributes.companyId,
    });
    return this.save({ ...attributes, id: companyPrivacy.id });
  }

  async numEmissionsMissingAccessInfo(
    companyId: string
  ): Promise<CompanyPrivacyCount> {
    const query = `
      SELECT
        c.id AS company_id,
        SUM(
          CASE WHEN ce.id IS NOT NULL AND cea.id IS NULL THEN
            1
          ELSE
            0
          END) AS count
      FROM
        COMPANY c
        LEFT JOIN CORPORATE_EMISSION ce ON ce.company_id = c.id
        LEFT JOIN CORPORATE_EMISSION_ACCESS cea ON cea.emission_id = ce.id
      WHERE
        c.id = @0
      GROUP BY
        c.id;
    `;
    return (await this.query(query, [companyId])).shift();
  }

  async numIntensityTargetsMissingPrivacyType(
    companyId: string
  ): Promise<CompanyPrivacyCount> {
    const query = `
      SELECT
        c.id AS company_id,
        SUM(
          CASE WHEN t_intensity.id IS NOT NULL AND t_intensity.privacy_type IS NULL THEN
            1
          ELSE
            0
          END) AS count
      FROM
        COMPANY c
        LEFT JOIN TARGET t_intensity ON t_intensity.company_id = c.id
          AND t_intensity.target_type = 'INTENSITY'
      WHERE
        c.id = @0
      GROUP BY
        c.id;
    `;
    return (await this.query(query, [companyId])).shift();
  }

  async numAbsoluteTargetsMissingPrivacyType(
    companyId: string
  ): Promise<CompanyPrivacyCount> {
    const query = `
      SELECT
        c.id AS company_id,
        SUM(
          CASE WHEN t_absolute.id IS NOT NULL AND t_absolute.privacy_type IS NULL THEN
            1
          ELSE
            0
          END) AS count
      FROM
        COMPANY c
        LEFT JOIN TARGET t_absolute ON t_absolute.company_id = c.id
          AND t_absolute.target_type = 'ABSOLUTE'
      WHERE
        c.id = @0
      GROUP BY
        c.id;
    `;

    return (await this.query(query, [companyId])).shift();
  }
}
