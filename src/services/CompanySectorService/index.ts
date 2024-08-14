import { CompanySectorEntity } from '../../entities/CompanySector';
import { CompanySectorRepository } from '../../repositories/CompanySectorRepository';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { ICompanySector } from './types';

export class CompanySectorService extends BaseService<
  CompanySectorEntity,
  ICompanySector
> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, CompanySectorRepository);
  }
  async findCompanyIdsInTheDivision(companyId: string): Promise<string[]> {
    const companySectorRepo = await this.databaseService.getRepository(
      CompanySectorRepository
    );
    const companySectors = await companySectorRepo.find({
      where: { companyId },
      relations: ['sector'],
    });

    const divisions = new Set<string>();

    companySectors.forEach((companySector) => {
      divisions.add(companySector.sector.division);
    });

    return companySectorRepo.findCompanyIdsByDivisions(
      [...divisions],
      companyId
    );
  }
}
