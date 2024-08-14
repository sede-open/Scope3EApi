import { ApolloError } from 'apollo-server-errors';
import { EntityManager, Repository } from 'typeorm';
import {
  COMPANY_SECTOR_CREATED_ACTION,
  COMPANY_SECTOR_UPDATED_ACTION,
} from '../../constants/audit';
import { CompanySectorEntity } from '../../entities/CompanySector';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import {
  CompanySector,
  CompanySectorInput,
  CompanySectorType,
  UpdateCompanySectorsInput,
} from '../../types';
import { ControllerFunctionAsync } from '../types';
import { getRepository } from '../utils';
import {
  getCompanySectorId,
  getCompanySectorType,
  getCompanySectorWithUpdatedFlag,
  isSectorsPayloadValid,
} from './utils';

export const INCORRECT_SECTOR_PAYLOAD =
  'The company sectors payload must be correctly-formed';
export const COMPANY_SECTOR_EXISTS_ERROR =
  'This company already has this sector assigned';

export class CompanySectorController {
  constructor(
    private companySectorRepository: Repository<CompanySectorEntity>
  ) {}

  private getCompanyRepository = (entityManager?: EntityManager) => {
    return getRepository(
      CompanySectorEntity,
      this.companySectorRepository,
      entityManager
    );
  };

  findByCompanyId: ControllerFunctionAsync<
    {
      companyId: string;
    },
    CompanySector[]
  > = async ({ companyId }) => {
    const companySectors = await this.companySectorRepository.find({
      where: {
        companyId,
      },
    });

    const companySectorsWithUpdatedFlags = companySectors.map(
      getCompanySectorWithUpdatedFlag
    );

    return companySectorsWithUpdatedFlags;
  };

  create: ControllerFunctionAsync<
    { companyId: string; sectorId: string; sectorType: CompanySectorType },
    CompanySectorEntity
  > = async ({ companyId, sectorId, sectorType }, context, entityManager) => {
    const companySectorRepository = this.getCompanyRepository(entityManager);

    const existingCompanySector = await companySectorRepository.findOne({
      companyId,
      sectorId,
    });

    if (existingCompanySector) {
      throw new ApolloError(COMPANY_SECTOR_EXISTS_ERROR);
    }

    const companySector = new CompanySectorEntity(
      companyId,
      sectorId,
      sectorType
    );

    const newCompanySector = await companySectorRepository.save(companySector);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_SECTOR_CREATED_ACTION,
        currentPayload: JSON.stringify(newCompanySector),
      },
      context,
      entityManager
    );

    return newCompanySector;
  };

  updateCompanySectors: ControllerFunctionAsync<
    UpdateCompanySectorsInput,
    CompanySectorEntity[]
  > = async ({ companyId, sectors }, context) => {
    if (companyId !== context.user.companyId) {
      throw new ApolloError(USER_COMPANY_ERROR);
    }

    if (!isSectorsPayloadValid(sectors)) {
      throw new ApolloError(INCORRECT_SECTOR_PAYLOAD);
    }

    const previousCompanySectors = await this.companySectorRepository.find({
      where: { companyId },
    });

    const previousCompanySectorTypes = previousCompanySectors.map(
      getCompanySectorType
    );

    const newCompanySectorTypes = sectors.map(getCompanySectorType);

    // To be deleted
    const obsoleteCompanySectorIds = previousCompanySectors
      .filter(({ sectorType }) => !newCompanySectorTypes.includes(sectorType))
      .map(getCompanySectorId);

    // To be updated
    const updatedCompanySectorTypes = previousCompanySectors
      .filter(({ sectorType }: CompanySectorEntity) =>
        newCompanySectorTypes.includes(sectorType)
      )
      .map(getCompanySectorType);

    // To be added
    const newSbtiCompanySectors = sectors.filter(
      ({ sectorType }: CompanySectorInput) =>
        !previousCompanySectorTypes.includes(sectorType)
    );

    await this.companySectorRepository.manager.transaction(
      async (entityManager) => {
        // Delete obsolete company SBTI sectors
        await Promise.all(
          obsoleteCompanySectorIds.map(async (id) =>
            entityManager.delete(CompanySectorEntity, id)
          )
        );

        // Update existing company SBTI sectors
        await Promise.all(
          updatedCompanySectorTypes.map(async (updatedCompanySectorType) => {
            const updatedCompanySectorInput = sectors.find(
              ({ sectorType }) => updatedCompanySectorType === sectorType
            );

            return updatedCompanySectorInput
              ? entityManager.update(
                  CompanySectorEntity,
                  { sectorType: updatedCompanySectorType, companyId },
                  {
                    sectorId: updatedCompanySectorInput.id,
                    updatedBy: context.user.id,
                  }
                )
              : Promise.resolve();
          })
        );

        // Save new company sectors
        await Promise.all(
          newSbtiCompanySectors.map(async ({ id: sectorId, sectorType }) => {
            const newCompanySector = new CompanySectorEntity(
              companyId,
              sectorId,
              sectorType
            );

            newCompanySector.updatedBy = context.user.id;
            newCompanySector.createdBy = context.user.id;

            return entityManager.save(newCompanySector);
          })
        );
      }
    );

    const newCompanySectors = await this.companySectorRepository.find({
      where: { companyId },
    });

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: COMPANY_SECTOR_UPDATED_ACTION,
        currentPayload: JSON.stringify(newCompanySectors),
        previousPayload: JSON.stringify(previousCompanySectors),
      },
      context
    );

    return newCompanySectors;
  };
}
