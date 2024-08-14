import { CarbonIntensityMetricType, CarbonIntensityType } from '../../types';

export interface ICarbonIntensity {
  id: string;
  companyId: string;
  year: number;
  intensityMetric: CarbonIntensityMetricType;
  intensityValue: number;
  emissionId: string;
  type: CarbonIntensityType;
}
