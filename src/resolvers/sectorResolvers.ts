import { Sector } from '../types';
import { ResolverFunction } from './types';

type SectorResolverType = {
  Query: {
    sectors: ResolverFunction<
      { searchTerm?: string; pageNumber?: number; pageSize?: number },
      Sector[]
    >;
  };
};

export const sectorResolvers: SectorResolverType = {
  Query: {
    async sectors(_, args, context) {
      return context.controllers.sector.findAll(args, context);
    },
  },
};
