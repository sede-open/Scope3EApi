import { EntityManager, Repository } from 'typeorm';
import { ControllerFunctionAsync } from '../types';
import { AuditEntity } from '../../entities/Audit';
import { AuditActionType } from '../../constants/audit';
import { logger } from '../../utils/logger';
import { getRepository } from '../utils';

export type AuditTrailInput = {
  userId: string;
  action: AuditActionType;
  currentPayload?: string;
  previousPayload?: string;
};

export class AuditController {
  constructor(private auditRepository: Repository<AuditEntity>) {}

  private getAuditRepository = (entityManager?: EntityManager) => {
    return getRepository(AuditEntity, this.auditRepository, entityManager);
  };

  saveAuditTrail: ControllerFunctionAsync<AuditTrailInput, void> = async (
    args,
    _,
    entityManager
  ) => {
    const auditRepository = this.getAuditRepository(entityManager);

    try {
      await auditRepository.insert({
        userId: args.userId,
        action: args.action,
        currentPayload: args.currentPayload,
        previousPayload: args.previousPayload,
      });
    } catch (err) {
      logger.error(
        err,

        'Audit trail could not be saved'
      );
    }
  };

  saveAuditTrails: ControllerFunctionAsync<
    { auditTrails: AuditTrailInput[]; raiseExceptions?: boolean },
    void
  > = async ({ auditTrails, raiseExceptions }, _, entityManager) => {
    const auditRepository = this.getAuditRepository(entityManager);

    try {
      await auditRepository.insert(
        auditTrails.map((audit) => ({
          userId: audit.userId,
          action: audit.action,
          currentPayload: audit.currentPayload,
          previousPayload: audit.previousPayload,
        }))
      );
    } catch (err) {
      logger.error(err, 'Audit trails could not be saved');
      if (raiseExceptions) {
        throw err;
      }
    }
  };
}
