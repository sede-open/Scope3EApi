import { EntityRepository } from 'typeorm';
import { AuditEntity } from '../../entities/Audit';
import { Audit } from '../../services/AuditService/types';
import { CustomRepository } from '../Repository';

@EntityRepository(AuditEntity)
export class AuditRepository extends CustomRepository<AuditEntity, Audit> {
  async createEntity(attributes: Omit<Audit, 'id'>): Promise<AuditEntity> {
    return this.save(attributes);
  }
}
