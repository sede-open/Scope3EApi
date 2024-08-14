import { EntityRepository } from 'typeorm';
import { CompanySectorEntity } from '../../entities/CompanySector';
import { ICompanySector } from '../../services/CompanySectorService/types';
import { CustomRepository } from '../Repository';

@EntityRepository(CompanySectorEntity)
export class CompanySectorRepository extends CustomRepository<
  CompanySectorEntity,
  ICompanySector
> {
  async findCompanyIdsByDivisions(
    divisions: string[],
    requestingCompanyId: string
  ) {
    if (divisions.length === 0) {
      return [];
    }
    const companyIds = await this.createQueryBuilder('companySector')
      .innerJoin('companySector.sector', 'sector')
      .where('sector.division IN (:...divisions)', { divisions })
      .andWhere('companySector.company_id != :requestingCompanyId', {
        requestingCompanyId,
      })
      .select('DISTINCT companySector.company_id', 'companyId')
      .getRawMany<{ companyId: string }>();
    return companyIds.map(({ companyId }) => companyId);
  }
}
