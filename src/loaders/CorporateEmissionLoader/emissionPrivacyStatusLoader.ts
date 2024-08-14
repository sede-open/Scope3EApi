import DataLoader from 'dataloader';
import { In } from 'typeorm';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { EmissionPrivacyStatus } from '../../types';
import { getCorporateEmissionService } from '../../utils/apolloContext';

type BatchEmission = (
  companyIds: readonly string[]
) => Promise<(EmissionPrivacyStatus | null)[]>;

export const batchCorporateEmissions: BatchEmission = async (companyIds) => {
  const companyIdsMutable = [...companyIds];
  const corporateEmissionService = getCorporateEmissionService();
  const emissions = await corporateEmissionService.findMany({
    where: {
      companyId: In(companyIdsMutable),
    },
    relations: ['corporateEmissionAccess'],
  });
  const emissionMap: { [key: string]: CorporateEmissionEntity[] } = {};
  emissions.forEach((emission) => {
    const { companyId } = emission;
    if (emissionMap[companyId]) {
      emissionMap[companyId].push(emission);
    } else {
      emissionMap[companyId] = [emission];
    }
  });
  const sortedCompanyIds = companyIds.map((id) =>
    emissionMap[id]
      ? EmissionPrivacyStatus.Shared
      : EmissionPrivacyStatus.NotShared
  );
  return sortedCompanyIds;
};

export const emissionPrivacyStatusLoader = () =>
  new DataLoader<string, EmissionPrivacyStatus | null>(
    (keys: readonly string[]) => {
      return batchCorporateEmissions(keys);
    }
  );
