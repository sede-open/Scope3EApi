import {
  CarbonIntensityConfig,
  CarbonIntensityGroupType,
  CarbonIntensityMetricType,
} from '../types';

type CarbonIntensityConfigType = {
  [key in CarbonIntensityMetricType]: {
    minValue: number;
    maxValue: number;
    numberOfDecimals: number;
    group: CarbonIntensityGroupType;
  };
};

export const CARBON_INTENSITY_CONFIG: CarbonIntensityConfigType = {
  [CarbonIntensityMetricType.UsdOfRevenue]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.NumberOfEmployees]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.NumberOfFte]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.MetricTonProduction]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.MetricTonKm]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.SquareMetre]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.UnitsSold]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Common,
  },
  [CarbonIntensityMetricType.BusinessTravelPerPassengerKm]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.CubicMetres]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.NumberOfEnginesManufactored]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.EquivalentProductUnits]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.Gj]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.KgOfRawMilk]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.Km]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.Kwh]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.LetterAndParcelDelivery]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.LitreOfFinishedProduct]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.LitreOfProducedBeverage]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.LitrePacked]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.M3OfThroughput]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfAgrigulturalProduct]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfCementitiousMaterials]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfFoodProduced]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfGoodsDelivered]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfGoodShippedPerKm]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfPaper]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfPulpPaper]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfStainlessSteel]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfSteelProduced]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MetricTonsOfTires]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MillionEngineeringHours]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MillionEuroValueAddedXMillionKmDistanceTravelled]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MillionGrossMetricTonKm]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.Mj]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.MwInstalled]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.NauticalMile]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.OperationalUtilizationPerHour]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.OperationsPerJoule]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.PairsOfShoes]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.PassengersPerKm]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.PerRollingCage]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.PintsOfProductSold]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.PerRoomNightBooked]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.Tj]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.TrackKm]: {
    minValue: 0.01,
    maxValue: 1_000_000_000,
    numberOfDecimals: 2,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.NumberVehiclesProduced]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.OperatingHours]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
  [CarbonIntensityMetricType.OperatingDays]: {
    minValue: 1,
    maxValue: 1_000_000_000,
    numberOfDecimals: 0,
    group: CarbonIntensityGroupType.Other,
  },
};

export const getCarbonIntensityConfigs = (): CarbonIntensityConfig[] => {
  return ((Object.keys(
    CARBON_INTENSITY_CONFIG
  ) as unknown) as CarbonIntensityMetricType[]).map(
    (carbonIntensity: CarbonIntensityMetricType) => ({
      type: carbonIntensity,
      ...CARBON_INTENSITY_CONFIG[carbonIntensity],
    })
  );
};
