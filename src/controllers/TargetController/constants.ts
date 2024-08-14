export const TARGET_DOESNT_EXIST = 'No ambitions have been set';
export const TARGET_SCOPE_3_FIELDS_INVALID =
  'Required fields are missing. Scope 3 data requires _both_ year and reduction _or_ none';
export const TARGET_NOT_SAVED = 'Ambition could not be saved';

export const INTENSITY_TARGET_MISSING_REQUIRED_FIELD =
  'Intensity Targets must provide an Intensity Metric';

export const NO_BASELINE_ERROR =
  'Cannot create a target if the user has not saved a baseline emission';

export const MAX_ABSOLUTE_TARGETS_PER_COMPANY = 1;
export const MAX_INTENSITY_TARGETS_PER_COMPANY = 1;

export const MAX_ABSOLUTE_TARGETS_EXCEEDED_ERROR = `Number of Absolute Targets for company exceeded, max: ${MAX_ABSOLUTE_TARGETS_PER_COMPANY}`;
export const MAX_INTENSITY_TARGETS_EXCEEDED_ERROR = `Number of Absolute Targets for company exceeded, max: ${MAX_INTENSITY_TARGETS_PER_COMPANY}`;

export const INTENSITY_METRIC_NOT_ASSOCIATED_TO_BASELINE = `An Intensity Target did not meet the requirements, the Intensity Metric must be included in the set of Intensity Metrics associated to the Baseline Emission Year`;
