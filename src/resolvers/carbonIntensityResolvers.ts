import { CarbonIntensity, CarbonIntensityConfig } from '../types';
import { getCarbonIntensityConfigs } from '../utils/carbonIntensity';
import { ResolverFunction } from './types';

type CarbonIntensityResolverType = {
  Query: {
    carbonIntensities: ResolverFunction<
      { companyId: string },
      CarbonIntensity[] | undefined
    >;
    carbonIntensityConfig: ResolverFunction<
      undefined,
      CarbonIntensityConfig[] | undefined
    >;
  };
};

export const carbonIntensityResolvers: CarbonIntensityResolverType = {
  Query: {
    async carbonIntensities(_, args, context) {
      return context.controllers.carbonIntensity.findAllByCompanyId(
        args,
        context
      );
    },
    async carbonIntensityConfig() {
      return getCarbonIntensityConfigs();
    },
  },
};
