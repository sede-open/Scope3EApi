import { CompanySectorEntity } from '../../entities/CompanySector';
import { CompanySectorInput, CompanySectorType } from '../../types';

export const getCompanySectorId = ({
  id,
}: CompanySectorInput | CompanySectorEntity) => id;
export const getCompanySectorType = ({
  sectorType,
}: CompanySectorInput | CompanySectorEntity) => sectorType;

export const isSectorsPayloadValid = (sectors: CompanySectorInput[]) => {
  const sectorTypes = sectors.map(getCompanySectorType);

  const primarySectorType =
    sectorTypes.filter(
      (sectorType) => sectorType === CompanySectorType.Primary
    ) || [];

  if (primarySectorType.length !== 1) {
    return false;
  }

  const secondarySectorType =
    sectorTypes.filter(
      (sectorType) => sectorType === CompanySectorType.Secondary
    ) || [];

  if (secondarySectorType.length > 1) {
    return false;
  }

  return true;
};

export const getCompanySectorWithUpdatedFlag = (
  companySector: CompanySectorEntity
) => ({
  ...companySector,
  hasBeenUpdated: Boolean(companySector.createdBy),
});
