import { EntityManager, Repository, Like } from 'typeorm';
import { Sector, OrderBy, SectorSourceType } from '../../types';
import { ControllerFunctionAsync } from '../types';
import { SectorEntity } from '../../entities/Sector';
import { DnBCompanySector } from '../../clients/DnBClient/types';
import { getRepository } from '../utils';
import { ApolloError } from 'apollo-server-errors';
import { SECTOR_CREATED_ACTION } from '../../constants/audit';
import { getPageOffset } from '../../utils/db';

export const SECTOR_EXISTS_ERROR = 'Sector already exists';

export class SectorController {
  constructor(private sectorRepository: Repository<SectorEntity>) {}

  private getSectorRepository = (entityManager?: EntityManager) => {
    return getRepository(SectorEntity, this.sectorRepository, entityManager);
  };

  findAll: ControllerFunctionAsync<
    { searchTerm?: string; pageNumber?: number; pageSize?: number } | undefined,
    Sector[]
  > = async ({ searchTerm, pageNumber, pageSize } = {}) => {
    return this.sectorRepository.find({
      where: {
        ...(searchTerm ? { name: Like(`%${searchTerm}%`) } : {}),
      },
      order: { name: OrderBy.Asc },
      ...getPageOffset(pageSize, pageNumber),
    });
  };

  create: ControllerFunctionAsync<
    {
      industryCode: string;
      typeDescription: string;
      industryDescription: string;
    },
    Sector | undefined
  > = async (
    { industryCode, typeDescription, industryDescription },
    context,
    entityManager
  ) => {
    const sectorRepository = this.getSectorRepository(entityManager);

    const existingSector = await sectorRepository.findOne({
      where: {
        name: industryDescription,
      },
    });

    if (existingSector) {
      throw new ApolloError(SECTOR_EXISTS_ERROR);
    }

    const newSector = new SectorEntity();
    newSector.name = industryDescription;
    newSector.industryCode = industryCode;
    newSector.industryType = typeDescription;
    // for now we only have one source for sectors
    newSector.sourceName = SectorSourceType.Dnb;

    const savedSector = await sectorRepository.save(newSector);

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: SECTOR_CREATED_ACTION,
        currentPayload: JSON.stringify(savedSector),
      },
      context,
      entityManager
    );

    return savedSector;
  };

  findOrCreateFromDnBProfile: ControllerFunctionAsync<
    { sector: DnBCompanySector },
    Sector | undefined
  > = async ({ sector }, context, entityManager) => {
    if (
      typeof sector.typeDescription !== 'string' ||
      typeof sector.industryCode !== 'string' ||
      typeof sector.industryDescription !== 'string'
    ) {
      return undefined;
    }

    const sectorRepository = this.getSectorRepository(entityManager);

    const existingSector = await sectorRepository.findOne({
      where: {
        name: sector.industryDescription,
      },
    });

    if (existingSector) {
      return existingSector;
    }

    return this.create(
      {
        industryCode: sector.industryCode,
        typeDescription: sector.typeDescription,
        industryDescription: sector.industryDescription,
      },
      context,
      entityManager
    );
  };
}
