import { CarbonIntensityEntity } from '../entities/CarbonIntensity';
import { CarbonIntensityMetricType, CarbonIntensityType } from '../types';

export const createCarbonIntensityMock = (
  overrides: Partial<CarbonIntensityEntity> & {
    id?: string;
    emissionId: string;
    companyId: string;
  }
): CarbonIntensityEntity => {
  const entity = new CarbonIntensityEntity();
  if (overrides.id) {
    entity.id = overrides.id;
  }
  entity.year = overrides.year ?? new Date().getFullYear();
  entity.intensityMetric =
    overrides.intensityMetric ?? CarbonIntensityMetricType.CubicMetres;
  entity.intensityValue = overrides.intensityValue ?? 1000;
  entity.emissionId = overrides.emissionId;
  entity.companyId = overrides.companyId;
  entity.createdBy = overrides.createdBy;
  entity.updatedBy = overrides.updatedBy;
  entity.targets = overrides.targets ?? [];
  entity.type = overrides.type ?? CarbonIntensityType.UserSubmitted;

  return entity;
};
