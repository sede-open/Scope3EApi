import { EntityRepository } from 'typeorm';
import { CorporateEmissionAccessEntity } from '../entities/CorporateEmissionAccess';
import { CorporateEmissionAccess } from '../services/CorporateEmissionAccessService/types';
import { CustomRepository } from './Repository';

@EntityRepository(CorporateEmissionAccessEntity)
export class CorporateEmissionAccessRepository extends CustomRepository<
  CorporateEmissionAccessEntity,
  CorporateEmissionAccess
> {
  async upsert(attributes: Omit<CorporateEmissionAccess, 'id'>) {
    let publicLink: string | null = null;
    if (attributes.publicLink) {
      publicLink = attributes.publicLink;
    }
    const existingCorporateEmissionAccessEntity = await this.findOne({
      emissionId: attributes.emissionId,
    });
    if (existingCorporateEmissionAccessEntity) {
      return this.save({
        ...attributes,
        publicLink,
        id: existingCorporateEmissionAccessEntity.id,
      });
    }
    return this.save({ ...attributes, publicLink });
  }
}
