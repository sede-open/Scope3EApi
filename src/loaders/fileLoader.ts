import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { FileEntity } from '../entities/File';

type BatchFile = (ids: readonly string[]) => Promise<FileEntity[]>;

export const batchFiles: BatchFile = async (ids) => {
  const idsToGet = [...ids];
  const files = await FileEntity.findByIds(idsToGet);

  const fileMap: { [key: string]: FileEntity } = keyBy('id', files);

  return idsToGet.map((id) => fileMap[id]);
};

export const fileLoader = () =>
  new DataLoader<string, FileEntity>((keys: readonly string[]) =>
    batchFiles(keys)
  );
