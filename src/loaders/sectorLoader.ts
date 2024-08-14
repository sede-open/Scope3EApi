import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { SectorEntity } from '../entities/Sector';

type BatchSector = (ids: readonly string[]) => Promise<SectorEntity[]>;

export const batchSectors: BatchSector = async (ids) => {
  const idsToGet = [...ids];
  const sectors = await SectorEntity.findByIds(idsToGet);

  const sectorMap: { [key: string]: SectorEntity } = keyBy('id', sectors);

  return idsToGet.map((id) => sectorMap[id]);
};

export const sectorLoader = () =>
  new DataLoader<string, SectorEntity>((keys: readonly string[]) =>
    batchSectors(keys)
  );
