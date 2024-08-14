import { EntityRepository } from 'typeorm';
import { SectorEntity } from '../../entities/Sector';
import { Sector } from '../../types';
import { CustomRepository } from '../Repository';

@EntityRepository(SectorEntity)
export class SectorRepository extends CustomRepository<SectorEntity, Sector> {}
