import DataLoader from 'dataloader';
import keyBy from 'lodash/fp/keyBy';
import { CategoryEntity } from '../entities/Category';

type BatchCategories = (ids: readonly string[]) => Promise<CategoryEntity[]>;

export const batchCategories: BatchCategories = async (ids) => {
  const idsToGet = [...ids];
  const categories = await CategoryEntity.findByIds(idsToGet);

  const categoryMap: { [key: string]: CategoryEntity } = keyBy(
    'id',
    categories
  );

  return idsToGet.map((id) => categoryMap[id]);
};

export const categoryLoader = () =>
  new DataLoader<string, CategoryEntity>((keys: readonly string[]) =>
    batchCategories(keys)
  );
