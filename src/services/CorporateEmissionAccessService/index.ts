import { CORPORATE_EMISSION_UPDATED_ACTION } from '../../constants/audit';
import { CorporateEmissionAccessEntity } from '../../entities/CorporateEmissionAccess';
import { CorporateEmissionAccessRepository } from '../../repositories/CorporateEmissionAccessRepository';
import { AuditService } from '../AuditService';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { CorporateEmissionAccess } from './types';

export class CorporateEmissionAccessService extends BaseService<
  CorporateEmissionAccessEntity,
  CorporateEmissionAccess
> {
  constructor(
    databaseService: DatabaseService,
    private auditService: AuditService
  ) {
    super(databaseService, CorporateEmissionAccessRepository);
  }

  async updateEmissionAccess(
    attributes: Omit<CorporateEmissionAccess, 'id'>,
    userId: string
  ) {
    const repo = await this.getRepository<CorporateEmissionAccessRepository>();
    const corporateEmissionAccess = await this.findOne({
      where: {
        emissionId: attributes.emissionId,
      },
    });

    const previousPayload: { [key: string]: unknown } = {
      id: attributes.emissionId,
      corporateEmissionAccess,
    };

    const updatedCorporateEmission = repo.upsert(attributes);
    const currentPayload: { [key: string]: unknown } = {
      id: attributes.emissionId,
      corporateEmissionAccess: updatedCorporateEmission,
    };
    await this.auditService.createEntity(
      {
        userId,
        action: CORPORATE_EMISSION_UPDATED_ACTION,
      },
      currentPayload,
      previousPayload
    );
    return updatedCorporateEmission;
  }
}
