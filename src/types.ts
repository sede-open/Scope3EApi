import { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: Date;
  Email: string;
  PageSize: number;
  SafeString: string;
  UUID: string;
  UserName: string;
};

export type AbsoluteTarget = {
  __typename?: 'AbsoluteTarget';
  companyId: Scalars['String'];
  includeCarbonOffset: Scalars['Boolean'];
  scope1And2PrivacyType?: Maybe<TargetPrivacyType>;
  scope1And2Reduction: Scalars['Float'];
  scope1And2Year: Scalars['Int'];
  scope3PrivacyType?: Maybe<TargetPrivacyType>;
  scope3Reduction?: Maybe<Scalars['Float']>;
  scope3Year?: Maybe<Scalars['Int']>;
  strategy: TargetStrategyType;
};

export type AcceptCompanyInviteInput = {
  companyId: Scalars['UUID'];
};

export enum AmbitionPrivacyStatus {
  NotShared = 'NOT_SHARED',
  Shared = 'SHARED',
  SharedSbti = 'SHARED_SBTI'
}

export type ApproveCompanyInput = {
  companyId: Scalars['UUID'];
};

export enum AuthProvider {
  /** For external users only */
  Akamai = 'AKAMAI',
  /** For invites for minimal querying and updates */
  Invite = 'INVITE',
  /** For internal users only */
  Port = 'PORT'
}

export type CarbonIntensity = {
  __typename?: 'CarbonIntensity';
  company: Company;
  createdAt: Scalars['Date'];
  createdByUser: User;
  id: Scalars['UUID'];
  intensityMetric: CarbonIntensityMetricType;
  intensityValue: Scalars['Float'];
  type: CarbonIntensityType;
  updatedAt?: Maybe<Scalars['Date']>;
  updatedByUser?: Maybe<User>;
  year: Scalars['Int'];
};

export type CarbonIntensityConfig = {
  __typename?: 'CarbonIntensityConfig';
  group: CarbonIntensityGroupType;
  maxValue: Scalars['Float'];
  minValue: Scalars['Float'];
  numberOfDecimals: Scalars['Int'];
  type: CarbonIntensityMetricType;
};

export enum CarbonIntensityGroupType {
  Common = 'COMMON',
  Other = 'OTHER'
}

export enum CarbonIntensityMetricType {
  /** Business travel per passenger (km) */
  BusinessTravelPerPassengerKm = 'BUSINESS_TRAVEL_PER_PASSENGER_KM',
  /** Cubic metres (m3) */
  CubicMetres = 'CUBIC_METRES',
  /** Equivalent product units */
  EquivalentProductUnits = 'EQUIVALENT_PRODUCT_UNITS',
  /** GJ */
  Gj = 'GJ',
  /** Kg of raw milk */
  KgOfRawMilk = 'KG_OF_RAW_MILK',
  /** Kilometre (km) */
  Km = 'KM',
  /** kWh (gross) */
  Kwh = 'KWH',
  /** Letter and parcel delivery */
  LetterAndParcelDelivery = 'LETTER_AND_PARCEL_DELIVERY',
  /** Litre of finished product */
  LitreOfFinishedProduct = 'LITRE_OF_FINISHED_PRODUCT',
  /** Litre of produced beverage */
  LitreOfProducedBeverage = 'LITRE_OF_PRODUCED_BEVERAGE',
  /** Litre packed */
  LitrePacked = 'LITRE_PACKED',
  /** m3 of throughput */
  M3OfThroughput = 'M3_OF_THROUGHPUT',
  /** Metric tons of agricultural product */
  MetricTonsOfAgrigulturalProduct = 'METRIC_TONS_OF_AGRIGULTURAL_PRODUCT',
  /** Metric tons of cementitious materials */
  MetricTonsOfCementitiousMaterials = 'METRIC_TONS_OF_CEMENTITIOUS_MATERIALS',
  /** Metric tons of food produced */
  MetricTonsOfFoodProduced = 'METRIC_TONS_OF_FOOD_PRODUCED',
  /** Metric tons of goods delivered */
  MetricTonsOfGoodsDelivered = 'METRIC_TONS_OF_GOODS_DELIVERED',
  /** Metric tons of goods shipped per kilometre */
  MetricTonsOfGoodShippedPerKm = 'METRIC_TONS_OF_GOOD_SHIPPED_PER_KM',
  /** Metric tons of paper */
  MetricTonsOfPaper = 'METRIC_TONS_OF_PAPER',
  /** Metric tons of pulp and paper */
  MetricTonsOfPulpPaper = 'METRIC_TONS_OF_PULP_PAPER',
  /** Metric tons of stainless steel */
  MetricTonsOfStainlessSteel = 'METRIC_TONS_OF_STAINLESS_STEEL',
  /** Metric tons of steel produced */
  MetricTonsOfSteelProduced = 'METRIC_TONS_OF_STEEL_PRODUCED',
  /** Metric tons of tires */
  MetricTonsOfTires = 'METRIC_TONS_OF_TIRES',
  /** Metric ton-kilometre */
  MetricTonKm = 'METRIC_TON_KM',
  /** Metric ton production */
  MetricTonProduction = 'METRIC_TON_PRODUCTION',
  /** Million engineering hours */
  MillionEngineeringHours = 'MILLION_ENGINEERING_HOURS',
  /** Million Euro value added x million km distance travelled */
  MillionEuroValueAddedXMillionKmDistanceTravelled = 'MILLION_EURO_VALUE_ADDED_X_MILLION_KM_DISTANCE_TRAVELLED',
  /** Million gross metric ton kilometres */
  MillionGrossMetricTonKm = 'MILLION_GROSS_METRIC_TON_KM',
  /** MJ */
  Mj = 'MJ',
  /** MW installed */
  MwInstalled = 'MW_INSTALLED',
  /** Nautical mile */
  NauticalMile = 'NAUTICAL_MILE',
  /** Number of Employees */
  NumberOfEmployees = 'NUMBER_OF_EMPLOYEES',
  /** Number of Engines manufactured */
  NumberOfEnginesManufactored = 'NUMBER_OF_ENGINES_MANUFACTORED',
  /** Number of FTE's */
  NumberOfFte = 'NUMBER_OF_FTE',
  /** Number of vehicles produced */
  NumberVehiclesProduced = 'NUMBER_VEHICLES_PRODUCED',
  /** Operating Days */
  OperatingDays = 'OPERATING_DAYS',
  /** Operating Hours */
  OperatingHours = 'OPERATING_HOURS',
  /** Operational utilization per hour */
  OperationalUtilizationPerHour = 'OPERATIONAL_UTILIZATION_PER_HOUR',
  /** Operations per joule */
  OperationsPerJoule = 'OPERATIONS_PER_JOULE',
  /** Pairs of shoes */
  PairsOfShoes = 'PAIRS_OF_SHOES',
  /** Passengers per kilometre */
  PassengersPerKm = 'PASSENGERS_PER_KM',
  /** Per rolling cage */
  PerRollingCage = 'PER_ROLLING_CAGE',
  /** Per room night booked */
  PerRoomNightBooked = 'PER_ROOM_NIGHT_BOOKED',
  /** Pints of products sold */
  PintsOfProductSold = 'PINTS_OF_PRODUCT_SOLD',
  /** Square metre (m2) */
  SquareMetre = 'SQUARE_METRE',
  /** TJ */
  Tj = 'TJ',
  /** Track (km) */
  TrackKm = 'TRACK_KM',
  /** Units sold */
  UnitsSold = 'UNITS_SOLD',
  /** $ of revenue */
  UsdOfRevenue = 'USD_OF_REVENUE'
}

export enum CarbonIntensityType {
  /** Intensity has been calculated, rather than submitted by user */
  Estimated = 'ESTIMATED',
  /** Submitted by user */
  UserSubmitted = 'USER_SUBMITTED'
}

export enum CategoriesSystemName {
  /** Business travel */
  BusinessTravel = 'BUSINESS_TRAVEL',
  /** Capital goods */
  CapitalGoods = 'CAPITAL_GOODS',
  /** Downstream leased assets */
  DownstreamLeasedAssets = 'DOWNSTREAM_LEASED_ASSETS',
  /** Downstream transportation and distribution */
  DownstreamTransportationAndDistribution = 'DOWNSTREAM_TRANSPORTATION_AND_DISTRIBUTION',
  /** Employee commuting */
  EmployeeCommuting = 'EMPLOYEE_COMMUTING',
  /** End of life treatment of sold products */
  EndOfLifeTreatmentOfSoldProducts = 'END_OF_LIFE_TREATMENT_OF_SOLD_PRODUCTS',
  /** Franchises */
  Franchises = 'FRANCHISES',
  /** Fuel and energy related activities */
  FuelAndEnergyRelatedActivities = 'FUEL_AND_ENERGY_RELATED_ACTIVITIES',
  /** Investments */
  Investments = 'INVESTMENTS',
  /** Processing of sold products */
  ProcessingOfSoldProducts = 'PROCESSING_OF_SOLD_PRODUCTS',
  /** Purchased goods and services */
  PurchasedGoodsAndServices = 'PURCHASED_GOODS_AND_SERVICES',
  /** Upstream leased assets */
  UpstreamLeasedAssets = 'UPSTREAM_LEASED_ASSETS',
  /** Upstream transportation and distribution */
  UpstreamTransportationAndDistribution = 'UPSTREAM_TRANSPORTATION_AND_DISTRIBUTION',
  /** Use of sold products */
  UseOfSoldProducts = 'USE_OF_SOLD_PRODUCTS',
  /** Waste generated in operations */
  WasteGeneratedInOperations = 'WASTE_GENERATED_IN_OPERATIONS'
}

export type Category = {
  __typename?: 'Category';
  createdAt: Scalars['Date'];
  id: Scalars['UUID'];
  name: Scalars['String'];
  order: Scalars['Int'];
  systemName: CategoriesSystemName;
  type: CategoryType;
};

export enum CategoryType {
  Scope_3 = 'SCOPE_3'
}

export type ComanyDataPrivacyCompleteness = {
  __typename?: 'ComanyDataPrivacyCompleteness';
  companyId: Scalars['UUID'];
  isComplete: Scalars['Boolean'];
  numAbsoluteTargetPrivacyTypeMissing: Scalars['Int'];
  numCorporateEmissionAccessMissing: Scalars['Int'];
  numIntensityTargetPrivacyTypeMissing: Scalars['Int'];
};

export type Companies = {
  __typename?: 'Companies';
  data: Array<Company>;
  total: Scalars['Int'];
};

export type CompaniesBenchmarkInput = {
  intensityMetric: CarbonIntensityMetricType;
  intensityType: CarbonIntensityType;
  limit: Scalars['Int'];
  offset: Scalars['Int'];
  order: OrderBy;
  orderBy: CompaniesBenchmarkOrderBy;
  selectedCompanyId: Scalars['ID'];
};

export enum CompaniesBenchmarkOrderBy {
  /** by the annual emission variance */
  AnnualEmissionVariance = 'ANNUAL_EMISSION_VARIANCE',
  /** by the baseline emission year */
  BaselineYear = 'BASELINE_YEAR',
  /** by the selected carbon intensity */
  CarbonIntensityRatio = 'CARBON_INTENSITY_RATIO',
  /** by the company name */
  CompanyName = 'COMPANY_NAME',
  /** by the network connection type */
  CompanyRelationship = 'COMPANY_RELATIONSHIP',
  /** by the size of the company */
  EstimatedNumberOfEmployees = 'ESTIMATED_NUMBER_OF_EMPLOYEES',
  /** by the total emission variance */
  TotalEmissionVariance = 'TOTAL_EMISSION_VARIANCE'
}

export type Company = {
  __typename?: 'Company';
  /** @deprecated Use `CompanySectors` where sectorType is PRIMARY. */
  businessSection?: Maybe<Scalars['String']>;
  companySectors?: Maybe<Array<CompanySector>>;
  createdAt?: Maybe<Scalars['Date']>;
  createdByUser?: Maybe<User>;
  dnbAddressLineOne?: Maybe<Scalars['String']>;
  dnbAddressLineTwo?: Maybe<Scalars['String']>;
  dnbCountry?: Maybe<Scalars['String']>;
  dnbCountryIso?: Maybe<Scalars['String']>;
  dnbPostalCode?: Maybe<Scalars['String']>;
  dnbRegion?: Maybe<Scalars['String']>;
  duns?: Maybe<Scalars['String']>;
  hubspotId?: Maybe<Scalars['String']>;
  id: Scalars['UUID'];
  location?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  reviewedAt?: Maybe<Scalars['Date']>;
  reviewedByUser?: Maybe<User>;
  status: CompanyStatus;
  /** @deprecated Use `CompanySectors` where sectorType is SECONDARY. */
  subSector?: Maybe<Scalars['String']>;
  updatedAt?: Maybe<Scalars['Date']>;
  updatedByUser?: Maybe<User>;
  users: Array<User>;
};

export type CompanyBenchmark = {
  __typename?: 'CompanyBenchmark';
  annualEmissionVariance?: Maybe<Scalars['Float']>;
  baselineYear?: Maybe<Scalars['Int']>;
  companyDuns: Scalars['String'];
  companyId: Scalars['String'];
  companyName: Scalars['String'];
  companyRelationshipStatus?: Maybe<InviteStatus>;
  companyRelationshipType?: Maybe<CompanyRelationshipType>;
  emissionToIntensityRatio?: Maybe<Scalars['Float']>;
  estimatedNumberOfEmployees?: Maybe<Scalars['Int']>;
  totalEmissionVariance?: Maybe<Scalars['Float']>;
};

export type CompanyBenchmarkRes = {
  __typename?: 'CompanyBenchmarkRes';
  data: Array<CompanyBenchmark>;
  total: Scalars['Int'];
};

export type CompanyDataPrivacyCompletenessInput = {
  companyId: Scalars['UUID'];
};

export type CompanyPrivacy = {
  __typename?: 'CompanyPrivacy';
  allPlatform: Scalars['Boolean'];
  companyId: Scalars['UUID'];
  customerNetwork: Scalars['Boolean'];
  id: Scalars['UUID'];
  supplierNetwork: Scalars['Boolean'];
};

export type CompanyPrivacyInput = {
  allPlatform: Scalars['Boolean'];
  customerNetwork: Scalars['Boolean'];
  supplierNetwork: Scalars['Boolean'];
};

export type CompanyProfile = {
  __typename?: 'CompanyProfile';
  absoluteTargetType?: Maybe<TargetPrivacyType>;
  activeRelationship?: Maybe<CompanyRelationshipType>;
  companyPrivacy?: Maybe<CompanyPrivacy>;
  dataShareRequestSent: Scalars['Boolean'];
  dnbCountryIso?: Maybe<Scalars['String']>;
  dnbRegion?: Maybe<Scalars['String']>;
  duns?: Maybe<Scalars['String']>;
  estimatedNumberOfEmployees?: Maybe<Scalars['Int']>;
  estimatedUsdOfRevenue?: Maybe<Scalars['Float']>;
  id: Scalars['UUID'];
  invitationPending: Scalars['Boolean'];
  isActive: Scalars['Boolean'];
  isPublic: Scalars['Boolean'];
  name: Scalars['String'];
  sectors: Array<Scalars['String']>;
};

export type CompanyRelationship = {
  __typename?: 'CompanyRelationship';
  ambitionPrivacyStatus?: Maybe<AmbitionPrivacyStatus>;
  createdAt: Scalars['Date'];
  customer: Company;
  customerApprover?: Maybe<User>;
  emissionPrivacyStatus?: Maybe<EmissionPrivacyStatus>;
  id: Scalars['UUID'];
  inviteType: CompanyRelationshipType;
  note?: Maybe<Scalars['String']>;
  status: InviteStatus;
  supplier: Company;
  supplierApprover?: Maybe<User>;
  updatedAt?: Maybe<Scalars['Date']>;
};

export type CompanyRelationshipRecommendation = {
  __typename?: 'CompanyRelationshipRecommendation';
  companyId?: Maybe<Scalars['UUID']>;
  country?: Maybe<Scalars['String']>;
  duns: Scalars['String'];
  id: Scalars['UUID'];
  name: Scalars['String'];
  recommendationStatus: CompanyRelationshipRecommendationStatus;
  region?: Maybe<Scalars['String']>;
  relationshipType: CompanyRelationshipType;
  sector?: Maybe<Scalars['String']>;
};

export enum CompanyRelationshipRecommendationStatus {
  Accepted = 'ACCEPTED',
  Declined = 'DECLINED',
  Unacknowledged = 'UNACKNOWLEDGED'
}

export enum CompanyRelationshipType {
  /** A company's customer */
  Customer = 'CUSTOMER',
  /** A company's supplier */
  Supplier = 'SUPPLIER'
}

export type CompanySector = {
  __typename?: 'CompanySector';
  company: Company;
  createdAt?: Maybe<Scalars['Date']>;
  createdByUser?: Maybe<User>;
  hasBeenUpdated?: Maybe<Scalars['Boolean']>;
  id: Scalars['UUID'];
  sector: Sector;
  sectorType: CompanySectorType;
  updatedAt?: Maybe<Scalars['Date']>;
  updatedByUser?: Maybe<User>;
};

export type CompanySectorInput = {
  id: Scalars['UUID'];
  sectorType: CompanySectorType;
};

export enum CompanySectorType {
  /** Primary Industry/Sector for a company */
  Primary = 'PRIMARY',
  /** Secondary Industry/Sector for a company */
  Secondary = 'SECONDARY'
}

export enum CompanyStatus {
  /** Active company - a user has logged in at least once */
  Active = 'ACTIVE',
  /** Company user has declined to join XYZ */
  InvitationDeclined = 'INVITATION_DECLINED',
  /** Support team has approved the company. Awaiting user login */
  PendingUserActivation = 'PENDING_USER_ACTIVATION',
  /** Invited company pending user confirmation. A user has not agreed to join XYZ */
  PendingUserConfirmation = 'PENDING_USER_CONFIRMATION',
  /** Support team have vetoed the company */
  Vetoed = 'VETOED',
  /** User has accepted to join XYZ. Support team are vetting the company */
  VettingInProgress = 'VETTING_IN_PROGRESS'
}

export enum ContactEmailSource {
  Email = 'EMAIL',
  Events = 'EVENTS',
  Other = 'OTHER',
  Recommended = 'RECOMMENDED',
  SearchEngine = 'SEARCH_ENGINE',
  SocialMedia = 'SOCIAL_MEDIA',
  WordOfMouth = 'WORD_OF_MOUTH'
}

export type CorporateCarbonIntensityComparison = {
  __typename?: 'CorporateCarbonIntensityComparison';
  companyIntensity: CorporateCarbonIntensityInfo;
  sectorIntensity: CorporateCarbonIntensityInfo;
  year: Scalars['Int'];
};

export type CorporateCarbonIntensityInfo = {
  __typename?: 'CorporateCarbonIntensityInfo';
  scope1?: Maybe<Scalars['Float']>;
  scope2?: Maybe<Scalars['Float']>;
  scope3?: Maybe<Scalars['Float']>;
};

export type CorporateEmission = {
  __typename?: 'CorporateEmission';
  carbonIntensities: Array<CarbonIntensity>;
  company: Company;
  corporateEmissionAccess?: Maybe<CorporateEmissionAccess>;
  createdAt: Scalars['Date'];
  createdByUser: User;
  headCount?: Maybe<Scalars['Int']>;
  id: Scalars['UUID'];
  offset?: Maybe<Scalars['Float']>;
  scope1: Scalars['Float'];
  scope2: Scalars['Float'];
  scope2Type: Scope2Type;
  scope3?: Maybe<Scalars['Float']>;
  examplePercentage?: Maybe<Scalars['Float']>;
  type: CorporateEmissionType;
  updatedAt: Scalars['Date'];
  updatedByUser?: Maybe<User>;
  verificationFile?: Maybe<File>;
  year: Scalars['Int'];
};

export type CorporateEmissionAccess = {
  __typename?: 'CorporateEmissionAccess';
  carbonIntensity?: Maybe<Scalars['Boolean']>;
  carbonOffsets?: Maybe<Scalars['Boolean']>;
  publicLink?: Maybe<Scalars['SafeString']>;
  scope1And2?: Maybe<Scalars['Boolean']>;
  scope3?: Maybe<Scalars['Boolean']>;
};

export type CorporateEmissionAccessInput = {
  carbonIntensity: Scalars['Boolean'];
  carbonOffsets: Scalars['Boolean'];
  publicLink?: InputMaybe<Scalars['SafeString']>;
  scope1And2: Scalars['Boolean'];
  scope3: Scalars['Boolean'];
};

export type CorporateEmissionRank = {
  __typename?: 'CorporateEmissionRank';
  businessSector?: Maybe<Scalars['String']>;
  currentYear: Scalars['Int'];
  hasPreviousYearVerificationFile: Scalars['Boolean'];
  hasVerificationFile: Scalars['Boolean'];
  id: Scalars['UUID'];
  primarySector?: Maybe<Scalars['String']>;
  rank: Scalars['Int'];
  rankType: ReductionRankType;
  reductionPercentage: Scalars['Float'];
  scope1: Scalars['Int'];
  scope2: Scalars['Int'];
  scope3?: Maybe<Scalars['Int']>;
  secondarySector?: Maybe<Scalars['String']>;
  subSector?: Maybe<Scalars['String']>;
};

export enum CorporateEmissionType {
  /** Actual emission levels */
  Actual = 'ACTUAL',
  /** Baseline emission submission */
  Baseline = 'BASELINE'
}

export type CorporateEmissionWithCarbonIntensityInfo = {
  __typename?: 'CorporateEmissionWithCarbonIntensityInfo';
  carbonIntensities: Array<CarbonIntensity>;
  company: Company;
  createdAt: Scalars['Date'];
  createdByUser: User;
  headCount?: Maybe<Scalars['Int']>;
  id: Scalars['UUID'];
  offset?: Maybe<Scalars['Float']>;
  scope1: Scalars['Float'];
  scope2: Scalars['Float'];
  scope2Type: Scope2Type;
  scope3?: Maybe<Scalars['Float']>;
  examplePercentage?: Maybe<Scalars['Float']>;
  type: CorporateEmissionType;
  updatedAt: Scalars['Date'];
  updatedByUser?: Maybe<User>;
  verificationFile?: Maybe<File>;
  year: Scalars['Int'];
};

export type CreateCarbonIntensityData = {
  type: CarbonIntensityMetricType;
  value: Scalars['Float'];
};

export type CreateCompanyRelationshipInput = {
  customerId: Scalars['UUID'];
  inviteType: CompanyRelationshipType;
  note?: InputMaybe<Scalars['SafeString']>;
  supplierId: Scalars['UUID'];
};

export type CreateCompanyUserInput = {
  authProvider: AuthProvider;
  companyId: Scalars['UUID'];
  email: Scalars['Email'];
  expertiseDomain?: InputMaybe<ExpertiseDomain>;
  firstName: Scalars['UserName'];
  lastName: Scalars['UserName'];
  roleName: RoleName;
};

export type CreateCorporateEmissionInput = {
  carbonIntensities?: InputMaybe<Array<CreateCarbonIntensityData>>;
  companyId: Scalars['UUID'];
  corporateEmissionAccess: CorporateEmissionAccessInput;
  headCount?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Float']>;
  scope1: Scalars['Float'];
  scope2: Scalars['Float'];
  scope2Type?: InputMaybe<Scope2Type>;
  scope3?: InputMaybe<Scalars['Float']>;
  examplePercentage?: InputMaybe<Scalars['Float']>;
  type: CorporateEmissionType;
  verificationFileId?: InputMaybe<Scalars['UUID']>;
  year: Scalars['Int'];
};

export type CreateEmissionAllocationInput = {
  allocationMethod?: InputMaybe<EmissionAllocationMethod>;
  customerEmissionId?: InputMaybe<Scalars['UUID']>;
  customerId: Scalars['UUID'];
  emissions?: InputMaybe<Scalars['Float']>;
  note?: InputMaybe<Scalars['SafeString']>;
  supplierEmissionId?: InputMaybe<Scalars['UUID']>;
  supplierId: Scalars['UUID'];
  year: Scalars['Int'];
};

export type CreateTargetInput = {
  companyId: Scalars['UUID'];
  includeCarbonOffset: Scalars['Boolean'];
  scope1And2Reduction: Scalars['Float'];
  scope1And2Year: Scalars['Int'];
  scope3Reduction?: InputMaybe<Scalars['Float']>;
  scope3Year?: InputMaybe<Scalars['Int']>;
  strategy: TargetStrategyType;
  targetType: TargetType;
};

export type CreateUserInput = {
  authProvider: AuthProvider;
  companyId: Scalars['UUID'];
  email: Scalars['Email'];
  expertiseDomain?: InputMaybe<ExpertiseDomain>;
  firstName: Scalars['UserName'];
  lastName: Scalars['UserName'];
  roleName: RoleName;
};

export type DataShareRequest = {
  __typename?: 'DataShareRequest';
  companyId: Scalars['UUID'];
  id: Scalars['UUID'];
  targetCompanyId: Scalars['UUID'];
};

export type DeclineCompanyInviteInput = {
  companyId: Scalars['UUID'];
  reason: Scalars['SafeString'];
};

export type DeleteCorporateEmissionInput = {
  id: Scalars['UUID'];
};

export type DeleteEmissionAllocationInput = {
  id: Scalars['UUID'];
};

export type DeleteUserInput = {
  id: Scalars['UUID'];
};

export type DnBAuthTokenResponse = {
  __typename?: 'DnBAuthTokenResponse';
  access_token: Scalars['String'];
  expiresIn: Scalars['Int'];
};

export type DnBTypeaheadResult = {
  __typename?: 'DnBTypeaheadResult';
  addressCountryIsoAlpha2Code?: Maybe<Scalars['String']>;
  addressLine1?: Maybe<Scalars['String']>;
  addressRegionName?: Maybe<Scalars['String']>;
  duns: Scalars['String'];
  globalUltimateDuns?: Maybe<Scalars['String']>;
  globalUltimatePrimaryName?: Maybe<Scalars['String']>;
  isGlobalUltimate: Scalars['Boolean'];
  primaryName: Scalars['String'];
};

export type EditCompanyUserInput = {
  email: Scalars['Email'];
  expertiseDomain?: InputMaybe<ExpertiseDomain>;
  firstName: Scalars['UserName'];
  lastName: Scalars['UserName'];
  roleName: RoleName;
};

export type EditPreferencesInput = {
  suppressTaskListPrompt?: InputMaybe<Scalars['Boolean']>;
};

export type EditUserInput = {
  companyId?: InputMaybe<Scalars['UUID']>;
  email: Scalars['Email'];
  firstName?: InputMaybe<Scalars['UserName']>;
  lastName?: InputMaybe<Scalars['UserName']>;
  roleName: RoleName;
};

export enum EmailEnquiry {
  /** ADIP Ultra for CO2 removal for authenticated contact form */
  AdipUltra = 'ADIP_ULTRA',
  /** Battery storage for authenticated contact form */
  BatteryStorage = 'BATTERY_STORAGE',
  /** Blue Hydrogen for heavy industries for authenticated contact form */
  BlueHydrogen = 'BLUE_HYDROGEN',
  /** Cansolv for authenticated contact form */
  Cansolv = 'CANSOLV',
  /** CO2 Capture Technology for all vessels for authenticated contact form */
  Co2CaptureTechnology = 'CO2_CAPTURE_TECHNOLOGY',
  /** Compensate the CO2 emissions of your fleet for authenticated contact form */
  Co2FleetEmissionCompensation = 'CO2_FLEET_EMISSION_COMPENSATION',
  /** Corporate Power Purchase Agreements for authenticated contact form */
  CorporatePowerPurchaseAgreements = 'CORPORATE_POWER_PURCHASE_AGREEMENTS',
  /** Corrosion-free pipelines for offshore */
  CorrosionFreePipelines = 'CORROSION_FREE_PIPELINES',
  /** Decarbonise your fleet while fuelling (Example TapUp) for authenticated contact form */
  DecarboniseYourFleet = 'DECARBONISE_YOUR_FLEET',
  /** Demo request */
  Demo = 'DEMO',
  /** Maximise industrial efficiency with AI (Detect Technology) */
  DetectTechnologyIndustrialEfficiency = 'DETECT_TECHNOLOGY_INDUSTRIAL_EFFICIENCY',
  /** Charging your electric vehicle solution for authenticated contact form */
  Emobility = 'EMOBILITY',
  /** Energy management for authenticated contact form */
  EnergyManagement = 'ENERGY_MANAGEMENT',
  /** General query for public and authenticated contact form */
  GeneralEnquiry = 'GENERAL_ENQUIRY',
  /** Hydrogen for Industry and Transport vehicle solution for authenticated contact form */
  Hydrogen = 'HYDROGEN',
  /** Smarter, Greener Fuel Management with i6 */
  I6FuelManagement = 'I6_FUEL_MANAGEMENT',
  /** Immersion cooling redefined for all vessels for authenticated contact form */
  ImmersionCooling = 'IMMERSION_COOLING',
  /** Innowatts Carbon & Energy Analytics */
  InnowattsCarbonEnergyAnalytics = 'INNOWATTS_CARBON_ENERGY_ANALYTICS',
  /** Decarbonise your road freight for all vessels for authenticated contact form */
  InstaFreight = 'INSTA_FREIGHT',
  /** Joining enquiry for public contact form */
  Join = 'JOIN',
  /** Leveraging Distributed Energy */
  LeveragingDistributedEnergy = 'LEVERAGING_DISTRIBUTED_ENERGY',
  /** Liquified Natural Gas for Transport solution for authenticated contact form */
  Lng = 'LNG',
  /** LO3 Energy Consumption Tracking */
  Lo3EnergyConsumptionTracking = 'LO3_ENERGY_CONSUMPTION_TRACKING',
  /** Sustainable long-haul transport with Bio LNG fuel */
  LongHaulBioLng = 'LONG_HAUL_BIO_LNG',
  /** Low carbon solution for public contact form */
  LowCarbonSolution = 'LOW_CARBON_SOLUTION',
  /** Lubricant Solutions solution for authenticated contact form */
  LubricantSolutions = 'LUBRICANT_SOLUTIONS',
  /** MachineMax for all vessels for authenticated contact form */
  MachineMax = 'MACHINE_MAX',
  /** Investing in Natural Ecosystems for authenticated contact form */
  NatureBased = 'NATURE_BASED',
  /** Onsite Renewable Power Generation */
  OnsiteRenewablePowerGeneration = 'ONSITE_RENEWABLE_POWER_GENERATION',
  /** Onsite solar for authenticated contact form */
  OnsiteSolar = 'ONSITE_SOLAR',
  /** Reducing CO2 intensity with Example Chemicals for all vessels for authenticated contact form */
  ReducingCo2IntensityWithExampleChemicals = 'REDUCING_CO2_INTENSITY_WITH_ABCD_CHEMICALS',
  /** Renewable Energy Certificates */
  RenewableEnergyCertificates = 'RENEWABLE_ENERGY_CERTIFICATES',
  /** Decarbonisation with Renewable Natural Gas */
  RenewableNaturalGas = 'RENEWABLE_NATURAL_GAS',
  /** Renewable Power */
  RenewablePower = 'RENEWABLE_POWER',
  /** Make Savings with Simulation Technology */
  SimulationTechnology = 'SIMULATION_TECHNOLOGY',
  /** Solar Solutions with Expert Advice */
  SolarSolution = 'SOLAR_SOLUTION',
  /** Sustainable Aviation Fuel for authenticated contact form */
  SustainableAviation = 'SUSTAINABLE_AVIATION',
  /** Sustainable Bitumen for all vessels for authenticated contact form */
  SustainableBitumen = 'SUSTAINABLE_BITUMEN',
  /** Sustainable Land Asset Enhancement */
  SustainableLandAssetEnhancement = 'SUSTAINABLE_LAND_ASSET_ENHANCEMENT',
  /** Telematics to reduce fuel consumption for authenticated contact form */
  Telematics = 'TELEMATICS',
  /** JAWS low-cost software for all vessels for authenticated contact form */
  VesselsSoftware = 'VESSELS_SOFTWARE'
}

export type EmissionAllocation = {
  __typename?: 'EmissionAllocation';
  addedToCustomerScopeTotal?: Maybe<Scalars['Boolean']>;
  allocationMethod?: Maybe<EmissionAllocationMethod>;
  category?: Maybe<Category>;
  categoryId?: Maybe<Scalars['UUID']>;
  createdAt: Scalars['Date'];
  customer: Company;
  customerApprover?: Maybe<User>;
  customerEmissionId?: Maybe<Scalars['UUID']>;
  customerId: Scalars['UUID'];
  emissions?: Maybe<Scalars['Float']>;
  id: Scalars['UUID'];
  note?: Maybe<Scalars['String']>;
  status: EmissionAllocationStatus;
  supplier?: Maybe<Company>;
  supplierApprover?: Maybe<User>;
  supplierId?: Maybe<Scalars['UUID']>;
  type: EmissionAllocationType;
  year: Scalars['Int'];
};

export enum EmissionAllocationDirection {
  /** Emissions allocated to the company by its suppliers */
  EmissionAllocatedBySuppliers = 'EMISSION_ALLOCATED_BY_SUPPLIERS',
  /** Emissions allocated to the company customers */
  EmissionAllocatedToCustomers = 'EMISSION_ALLOCATED_TO_CUSTOMERS'
}

export enum EmissionAllocationMethod {
  Economical = 'ECONOMICAL',
  Other = 'OTHER',
  Physical = 'PHYSICAL'
}

export enum EmissionAllocationStatus {
  Approved = 'APPROVED',
  AwaitingApproval = 'AWAITING_APPROVAL',
  Rejected = 'REJECTED',
  Requested = 'REQUESTED',
  RequestDismissed = 'REQUEST_DISMISSED'
}

export enum EmissionAllocationType {
  Scope_3 = 'SCOPE_3'
}

export enum EmissionPrivacyStatus {
  NotShared = 'NOT_SHARED',
  Shared = 'SHARED'
}

export type EnquiryEmailInput = {
  company?: InputMaybe<Scalars['SafeString']>;
  consent: Scalars['Boolean'];
  email: Scalars['Email'];
  enquiries: Array<EmailEnquiry>;
  message: Scalars['SafeString'];
  name: Scalars['UserName'];
  regions?: InputMaybe<Array<RegionName>>;
};

export enum ExpertiseDomain {
  /** Business Development */
  BusinessDevelopment = 'BUSINESS_DEVELOPMENT',
  /** Finance */
  Finance = 'FINANCE',
  /** Other */
  Other = 'OTHER',
  /** Procurement */
  Procurement = 'PROCUREMENT',
  /** Sustainability */
  Sustainability = 'SUSTAINABILITY'
}

export type File = {
  __typename?: 'File';
  azureBlobFilename: Scalars['String'];
  company: Company;
  createdByUser: User;
  id: Scalars['UUID'];
  mimetype: Scalars['String'];
  originalFilename: Scalars['String'];
  sizeInBytes: Scalars['Float'];
};

export type IntensityTarget = {
  __typename?: 'IntensityTarget';
  companyId: Scalars['String'];
  includeCarbonOffset: Scalars['Boolean'];
  intensityMetric: CarbonIntensityMetricType;
  intensityValue: Scalars['Float'];
  scope1And2PrivacyType?: Maybe<TargetPrivacyType>;
  scope1And2Reduction: Scalars['Float'];
  scope1And2Year: Scalars['Int'];
  scope3PrivacyType?: Maybe<TargetPrivacyType>;
  scope3Reduction?: Maybe<Scalars['Float']>;
  scope3Year?: Maybe<Scalars['Int']>;
  strategy: TargetStrategyType;
};

export type Invitation = {
  __typename?: 'Invitation';
  createdAt: Scalars['Date'];
  customerName: Scalars['String'];
  id: Scalars['UUID'];
  inviteType: CompanyRelationshipType;
  note?: Maybe<Scalars['String']>;
  status: InviteStatus;
  supplierName: Scalars['String'];
  updatedAt?: Maybe<Scalars['Date']>;
};

export type InviteAndConnectToCompanyInput = {
  companyDuns: Scalars['SafeString'];
  email: Scalars['Email'];
  firstName: Scalars['UserName'];
  inviteType: CompanyRelationshipType;
  lastName: Scalars['UserName'];
  note?: InputMaybe<Scalars['SafeString']>;
};

export type InviteCompanyEmailInput = {
  invitee: Invitee;
  inviter: Inviter;
};

export enum InviteStatus {
  Approved = 'APPROVED',
  AwaitingCustomerApproval = 'AWAITING_CUSTOMER_APPROVAL',
  AwaitingSupplierApproval = 'AWAITING_SUPPLIER_APPROVAL',
  RejectedByCustomer = 'REJECTED_BY_CUSTOMER',
  RejectedBySupplier = 'REJECTED_BY_SUPPLIER'
}

export type Invitee = {
  company: Scalars['SafeString'];
  email: Scalars['Email'];
  name: Scalars['SafeString'];
};

export type Inviter = {
  company: Scalars['SafeString'];
  email: Scalars['Email'];
  name: Scalars['SafeString'];
};

export type Me = {
  __typename?: 'Me';
  authProvider: AuthProvider;
  canEditCompanyMembers: Scalars['Boolean'];
  canEditCompanyRelationships: Scalars['Boolean'];
  canEditCompanySectors: Scalars['Boolean'];
  canEditEmissionAllocations: Scalars['Boolean'];
  canEditSupplyDashboard: Scalars['Boolean'];
  canInviteNewCompanyMembers: Scalars['Boolean'];
  canRemoveCompanyMembers: Scalars['Boolean'];
  canSubmitDataPrivacyInfo: Scalars['Boolean'];
  canViewCompaniesAdminDashboard: Scalars['Boolean'];
  canViewCompanyRelationships: Scalars['Boolean'];
  canViewEmissionAllocations: Scalars['Boolean'];
  canViewSupplyDashboard: Scalars['Boolean'];
  canViewUsersAdminDashboard: Scalars['Boolean'];
  company?: Maybe<Company>;
  email: Scalars['String'];
  expertiseDomain?: Maybe<ExpertiseDomain>;
  firstName: Scalars['String'];
  id: Scalars['UUID'];
  lastName: Scalars['String'];
  launchDarklyHash: Scalars['String'];
  preferences?: Maybe<Preferences>;
  roles: Array<Role>;
  status: UserStatus;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptCompanyInvite: Scalars['String'];
  activateUserAndCompany: User;
  approveCompany: Company;
  createCompanyPrivacy?: Maybe<CompanyPrivacy>;
  createCompanyRelationship: CompanyRelationship;
  createCompanyUser: User;
  createCorporateEmission?: Maybe<CorporateEmission>;
  createEmissionAllocation: EmissionAllocation;
  createTarget?: Maybe<AbsoluteTarget>;
  createUser: User;
  dataShareRequest: DataShareRequest;
  declineCompanyInvite: Scalars['String'];
  deleteCorporateEmission?: Maybe<Scalars['String']>;
  deleteEmissionAllocation: Scalars['String'];
  deleteUser: Scalars['String'];
  editCompanyUser: User;
  editPreferences?: Maybe<Preferences>;
  editUser: User;
  enquiryEmail: Scalars['String'];
  inviteAndConnectToCompany: CompanyRelationship;
  inviteCompanyEmail?: Maybe<Scalars['String']>;
  resendAkamaiInvite: Scalars['String'];
  resendUserInviteToJoinEmail: Scalars['String'];
  saveTargets: SimpleSuccess;
  updateCompanyPrivacy?: Maybe<CompanyPrivacy>;
  updateCompanyRelationship: CompanyRelationship;
  updateCompanyRelationshipRecommendationStatus: Scalars['String'];
  updateCompanySectors: Array<CompanySector>;
  updateCompanyStatus: Company;
  updateCorporateEmission?: Maybe<CorporateEmission>;
  updateEmissionAllocation: EmissionAllocation;
  updateMe: Me;
  updateTarget?: Maybe<AbsoluteTarget>;
  updateUserSolutionInterests: Array<UserSolutionInterest>;
  vetoCompany: Company;
};


export type MutationAcceptCompanyInviteArgs = {
  input: AcceptCompanyInviteInput;
};


export type MutationApproveCompanyArgs = {
  input: ApproveCompanyInput;
};


export type MutationCreateCompanyPrivacyArgs = {
  input: CompanyPrivacyInput;
};


export type MutationCreateCompanyRelationshipArgs = {
  input: CreateCompanyRelationshipInput;
};


export type MutationCreateCompanyUserArgs = {
  input: CreateCompanyUserInput;
};


export type MutationCreateCorporateEmissionArgs = {
  input: CreateCorporateEmissionInput;
};


export type MutationCreateEmissionAllocationArgs = {
  input: CreateEmissionAllocationInput;
};


export type MutationCreateTargetArgs = {
  input: CreateTargetInput;
};


export type MutationCreateUserArgs = {
  input: CreateUserInput;
};


export type MutationDataShareRequestArgs = {
  targetCompanyId: Scalars['UUID'];
};


export type MutationDeclineCompanyInviteArgs = {
  input: DeclineCompanyInviteInput;
};


export type MutationDeleteCorporateEmissionArgs = {
  input: DeleteCorporateEmissionInput;
};


export type MutationDeleteEmissionAllocationArgs = {
  input: DeleteEmissionAllocationInput;
};


export type MutationDeleteUserArgs = {
  input: DeleteUserInput;
};


export type MutationEditCompanyUserArgs = {
  input: EditCompanyUserInput;
};


export type MutationEditPreferencesArgs = {
  input: EditPreferencesInput;
};


export type MutationEditUserArgs = {
  input: EditUserInput;
};


export type MutationEnquiryEmailArgs = {
  input: EnquiryEmailInput;
};


export type MutationInviteAndConnectToCompanyArgs = {
  input: InviteAndConnectToCompanyInput;
};


export type MutationInviteCompanyEmailArgs = {
  input: InviteCompanyEmailInput;
};


export type MutationResendAkamaiInviteArgs = {
  input: ResentAkamaiInviteInput;
};


export type MutationResendUserInviteToJoinEmailArgs = {
  input: ResendUserInviteToJoinEmailInput;
};


export type MutationSaveTargetsArgs = {
  input: SaveTargetsInput;
};


export type MutationUpdateCompanyPrivacyArgs = {
  input: CompanyPrivacyInput;
};


export type MutationUpdateCompanyRelationshipArgs = {
  input: UpdateCompanyRelationshipInput;
};


export type MutationUpdateCompanyRelationshipRecommendationStatusArgs = {
  id: Scalars['UUID'];
  status: CompanyRelationshipRecommendationStatus;
};


export type MutationUpdateCompanySectorsArgs = {
  input: UpdateCompanySectorsInput;
};


export type MutationUpdateCompanyStatusArgs = {
  input: UpdateCompanyStatusInput;
};


export type MutationUpdateCorporateEmissionArgs = {
  input: UpdateCorporateEmissionInput;
};


export type MutationUpdateEmissionAllocationArgs = {
  input: UpdateEmissionAllocationInput;
};


export type MutationUpdateMeArgs = {
  input: UpdateMeInput;
};


export type MutationUpdateTargetArgs = {
  input: UpdateTargetInput;
};


export type MutationUpdateUserSolutionInterestsArgs = {
  input: UpdateUserSolutionInterestsInput;
};


export type MutationVetoCompanyArgs = {
  input: VetoCompanyInput;
};

export type NetworkSummary = {
  __typename?: 'NetworkSummary';
  companyId: Scalars['UUID'];
  numCustomers: Scalars['Int'];
  numPendingInvitations: Scalars['Int'];
  numSuppliers: Scalars['Int'];
  pendingInvitations: Array<Invitation>;
};

export enum OrderBy {
  /** Order results ascending */
  Asc = 'ASC',
  /** Order results descending */
  Desc = 'DESC'
}

export type Preferences = {
  __typename?: 'Preferences';
  id: Scalars['UUID'];
  suppressTaskListPrompt: Scalars['Boolean'];
};

export type Query = {
  __typename?: 'Query';
  baseline?: Maybe<CorporateEmission>;
  carbonIntensities: Array<CarbonIntensity>;
  carbonIntensityConfig: Array<CarbonIntensityConfig>;
  categories: Array<Category>;
  companies: Companies;
  companiesBenchmark: CompanyBenchmarkRes;
  companyByDuns?: Maybe<Company>;
  companyDataPrivacyCompleteness?: Maybe<ComanyDataPrivacyCompleteness>;
  companyPrivacy?: Maybe<CompanyPrivacy>;
  companyProfile: CompanyProfile;
  companyRelationshipRecommendations: Array<CompanyRelationshipRecommendation>;
  companyRelationships: Array<CompanyRelationship>;
  companySectors: Array<CompanySector>;
  companyUserRoles: Array<Role>;
  companyUsers: Array<User>;
  corporateCarbonIntensityComparisons?: Maybe<Array<CorporateCarbonIntensityComparison>>;
  corporateEmissionRank?: Maybe<CorporateEmissionRank>;
  corporateEmissionRanks: Array<CorporateEmissionRank>;
  corporateEmissions: Array<CorporateEmission>;
  dnbTypeaheadSearch: Array<DnBTypeaheadResult>;
  emissionAllocations: Array<EmissionAllocation>;
  emissionsAllocatedToMyCompany: Array<EmissionAllocation>;
  latestCorporateEmission?: Maybe<CorporateEmission>;
  me: Me;
  networkSummary: NetworkSummary;
  preferences?: Maybe<Preferences>;
  roles: Array<Role>;
  sectors: Array<Sector>;
  solutionInterests: Array<SolutionInterest>;
  target?: Maybe<AbsoluteTarget>;
  targets?: Maybe<Targets>;
  tribeJwt: TribeJwt;
  tribeUsageStats: TribeUsageStats;
  user?: Maybe<User>;
  userSolutionInterests: Array<UserSolutionInterest>;
  users: Users;
};


export type QueryBaselineArgs = {
  companyId: Scalars['UUID'];
};


export type QueryCarbonIntensitiesArgs = {
  companyId: Scalars['UUID'];
};


export type QueryCompaniesArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
};


export type QueryCompaniesBenchmarkArgs = {
  input?: InputMaybe<CompaniesBenchmarkInput>;
};


export type QueryCompanyByDunsArgs = {
  duns: Scalars['String'];
};


export type QueryCompanyDataPrivacyCompletenessArgs = {
  companyId: Scalars['UUID'];
};


export type QueryCompanyProfileArgs = {
  companyId: Scalars['UUID'];
};


export type QueryCompanyRelationshipRecommendationsArgs = {
  companyId: Scalars['UUID'];
  recommendationStatuses: Array<CompanyRelationshipRecommendationStatus>;
  relationshipTypes: Array<CompanyRelationshipType>;
};


export type QueryCompanyRelationshipsArgs = {
  companyId: Scalars['UUID'];
  relationshipType?: InputMaybe<CompanyRelationshipType>;
  status?: InputMaybe<InviteStatus>;
};


export type QueryCompanySectorsArgs = {
  companyId: Scalars['UUID'];
};


export type QueryCompanyUsersArgs = {
  roleNames?: InputMaybe<Array<InputMaybe<RoleName>>>;
};


export type QueryCorporateCarbonIntensityComparisonsArgs = {
  companyId: Scalars['UUID'];
  years: Array<Scalars['Int']>;
};


export type QueryCorporateEmissionRankArgs = {
  companyId: Scalars['UUID'];
  year: Scalars['Int'];
};


export type QueryCorporateEmissionRanksArgs = {
  companyId: Scalars['UUID'];
  year: Scalars['Int'];
};


export type QueryCorporateEmissionsArgs = {
  companyId: Scalars['UUID'];
  year?: InputMaybe<Scalars['Int']>;
};


export type QueryDnbTypeaheadSearchArgs = {
  searchTerm: Scalars['String'];
};


export type QueryEmissionAllocationsArgs = {
  companyId: Scalars['UUID'];
  emissionAllocation?: InputMaybe<EmissionAllocationDirection>;
  statuses?: InputMaybe<Array<EmissionAllocationStatus>>;
  year?: InputMaybe<Scalars['Int']>;
};


export type QueryEmissionsAllocatedToMyCompanyArgs = {
  supplierId: Scalars['UUID'];
};


export type QueryLatestCorporateEmissionArgs = {
  companyId: Scalars['UUID'];
};


export type QueryRolesArgs = {
  orderBy?: InputMaybe<OrderBy>;
};


export type QuerySectorsArgs = {
  pageNumber?: InputMaybe<Scalars['Int']>;
  pageSize?: InputMaybe<Scalars['PageSize']>;
  searchTerm?: InputMaybe<Scalars['SafeString']>;
};


export type QueryTargetArgs = {
  companyId: Scalars['UUID'];
};


export type QueryTargetsArgs = {
  companyId: Scalars['UUID'];
};


export type QueryUserArgs = {
  email: Scalars['String'];
};


export type QueryUsersArgs = {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<OrderBy>;
  sortBy?: InputMaybe<Scalars['String']>;
};

export enum ReductionRankType {
  /** Other company rank */
  Other = 'OTHER',
  /** Selected company rank */
  Selected = 'SELECTED'
}

export enum RegionName {
  /** Africa regions */
  Africa = 'AFRICA',
  /** Americas regions */
  Americas = 'AMERICAS',
  /** Asia regions */
  Asia = 'ASIA',
  /** Europe regions */
  Europe = 'EUROPE',
  /** Oceania regions */
  Oceania = 'OCEANIA'
}

export type ResendUserInviteToJoinEmailInput = {
  userId: Scalars['UUID'];
};

export type ResentAkamaiInviteInput = {
  userId: Scalars['UUID'];
};

export type Role = {
  __typename?: 'Role';
  id: Scalars['UUID'];
  name: RoleName;
};

export enum RoleName {
  /** Account manager */
  AccountManager = 'ACCOUNT_MANAGER',
  /** Internal user */
  Admin = 'ADMIN',
  /** External user with editor rights */
  SupplierEditor = 'SUPPLIER_EDITOR',
  /** External user with viewer rights */
  SupplierViewer = 'SUPPLIER_VIEWER'
}

export type SaveTargetsInput = {
  companyId: Scalars['UUID'];
  toSave: Array<SaveTargetsTargetInstance>;
};

export type SaveTargetsTargetInstance = {
  includeCarbonOffset: Scalars['Boolean'];
  intensityMetric?: InputMaybe<CarbonIntensityMetricType>;
  scope1And2PrivacyType: TargetPrivacyType;
  scope1And2Reduction: Scalars['Float'];
  scope1And2Year: Scalars['Int'];
  scope3PrivacyType?: InputMaybe<TargetPrivacyType>;
  scope3Reduction?: InputMaybe<Scalars['Float']>;
  scope3Year?: InputMaybe<Scalars['Int']>;
  strategy: TargetStrategyType;
  targetType: TargetType;
};

export enum SbtiSystemName {
  AirFreightTransport = 'AIR_FREIGHT_TRANSPORT',
  BanksInsurance = 'BANKS_INSURANCE',
  Chemicals = 'CHEMICALS',
  ConstructionEngineering = 'CONSTRUCTION_ENGINEERING',
  ConstructionMaterials = 'CONSTRUCTION_MATERIALS',
  ElectricalEquipmentMachinery = 'ELECTRICAL_EQUIPMENT_MACHINERY',
  ForestPaperProducts = 'FOREST_PAPER_PRODUCTS',
  GroundTruckTransport = 'GROUND_TRUCK_TRANSPORT',
  MaritimeTransport = 'MARITIME_TRANSPORT',
  OilGas = 'OIL_GAS',
  ProfessionalServices = 'PROFESSIONAL_SERVICES',
  Retailing = 'RETAILING',
  SoftwareAndService = 'SOFTWARE_AND_SERVICE',
  TechnologyHardwareEquipment = 'TECHNOLOGY_HARDWARE_EQUIPMENT',
  TradingCompanyCommercialService = 'TRADING_COMPANY_COMMERCIAL_SERVICE',
  WaterUtilities = 'WATER_UTILITIES'
}

export enum Scope2Type {
  /** Location-based scope 2 emissions */
  Location = 'LOCATION',
  /** Market-based scope 2 emissions */
  Market = 'MARKET'
}

export type Sector = {
  __typename?: 'Sector';
  createdAt: Scalars['Date'];
  division: Scalars['String'];
  id: Scalars['UUID'];
  industryCode: Scalars['String'];
  industryType: Scalars['String'];
  name: Scalars['String'];
  sourceName: Scalars['String'];
  updatedAt: Scalars['Date'];
};

export enum SectorSourceType {
  /** Industry/sector has been retrieved from Dun and Bradstreet API */
  Dnb = 'DNB'
}

export type SimpleSuccess = {
  __typename?: 'SimpleSuccess';
  success: Scalars['Boolean'];
};

export type SolutionInterest = {
  __typename?: 'SolutionInterest';
  createdAt: Scalars['Date'];
  id: Scalars['ID'];
  name: Scalars['String'];
  systemName: SolutionInterestsSystemName;
  updatedAt: Scalars['Date'];
};

export enum SolutionInterestsSystemName {
  /** Behaviour change */
  BehaviourChange = 'BEHAVIOUR_CHANGE',
  /** Carbon capture */
  CarbonCapture = 'CARBON_CAPTURE',
  /** Fuel switch */
  FuelSwitch = 'FUEL_SWITCH',
  /** Material and process efficiency */
  MaterialAndProcessEfficiency = 'MATERIAL_AND_PROCESS_EFFICIENCY',
  /** Nature based solutions */
  NatureBasedSolutions = 'NATURE_BASED_SOLUTIONS',
  /** Recycling */
  Recycling = 'RECYCLING',
  /** Renewable heat */
  RenewableHeat = 'RENEWABLE_HEAT',
  /** Renewable power */
  RenewablePower = 'RENEWABLE_POWER'
}

export enum TargetPrivacyType {
  Private = 'PRIVATE',
  Public = 'PUBLIC',
  ScienceBasedInitiative = 'SCIENCE_BASED_INITIATIVE'
}

export enum TargetScopeType {
  /** Ambition that includes scope 1 and 2 only */
  Scope_1_2 = 'SCOPE_1_2',
  /** Ambition that includes scope 3 only */
  Scope_3 = 'SCOPE_3'
}

export enum TargetStrategyType {
  /** Aggressive emissions reduction strategy */
  Aggressive = 'AGGRESSIVE',
  /** Moderate emissions reduction strategy */
  Moderate = 'MODERATE',
  /** Passive emissions reduction strategy */
  Passive = 'PASSIVE'
}

export enum TargetType {
  /** Absolute Ambition Target Type */
  Absolute = 'ABSOLUTE',
  /** Intensity Ambition Target Type */
  Intensity = 'INTENSITY'
}

export type Targets = {
  __typename?: 'Targets';
  absolute: Array<AbsoluteTarget>;
  intensity: Array<IntensityTarget>;
};

export type TribeJwt = {
  __typename?: 'TribeJwt';
  token: Scalars['String'];
};

export type TribeUsageStats = {
  __typename?: 'TribeUsageStats';
  members: Scalars['Int'];
  replies: Scalars['Int'];
  topics: Scalars['Int'];
};

export type UpdateCompanyRelationshipInput = {
  id: Scalars['UUID'];
  note?: InputMaybe<Scalars['SafeString']>;
  status?: InputMaybe<InviteStatus>;
};

export type UpdateCompanySectorsInput = {
  companyId: Scalars['UUID'];
  sectors: Array<CompanySectorInput>;
};

export type UpdateCompanyStatusInput = {
  id: Scalars['UUID'];
  status: CompanyStatus;
};

export type UpdateCorporateEmissionInput = {
  carbonIntensities?: InputMaybe<Array<CreateCarbonIntensityData>>;
  corporateEmissionAccess: CorporateEmissionAccessInput;
  headCount?: InputMaybe<Scalars['Int']>;
  id: Scalars['UUID'];
  offset?: InputMaybe<Scalars['Float']>;
  scope1: Scalars['Float'];
  scope2: Scalars['Float'];
  scope2Type: Scope2Type;
  scope3?: InputMaybe<Scalars['Float']>;
  examplePercentage?: InputMaybe<Scalars['Float']>;
  type: CorporateEmissionType;
  verificationFileId?: InputMaybe<Scalars['UUID']>;
  year: Scalars['Int'];
};

export type UpdateEmissionAllocationInput = {
  addedToCustomerScopeTotal?: InputMaybe<Scalars['Boolean']>;
  allocationMethod?: InputMaybe<EmissionAllocationMethod>;
  categoryId?: InputMaybe<Scalars['UUID']>;
  customerEmissionId?: InputMaybe<Scalars['UUID']>;
  emissions?: InputMaybe<Scalars['Float']>;
  id: Scalars['UUID'];
  note?: InputMaybe<Scalars['SafeString']>;
  status?: InputMaybe<EmissionAllocationStatus>;
  supplierEmissionId?: InputMaybe<Scalars['UUID']>;
};

export type UpdateMeInput = {
  expertiseDomain?: InputMaybe<ExpertiseDomain>;
  firstName?: InputMaybe<Scalars['UserName']>;
  lastName?: InputMaybe<Scalars['UserName']>;
};

export type UpdateTargetInput = {
  companyId: Scalars['UUID'];
  includeCarbonOffset: Scalars['Boolean'];
  intensityMetric?: InputMaybe<CarbonIntensityMetricType>;
  scope1And2Reduction: Scalars['Float'];
  scope1And2Year: Scalars['Int'];
  scope3Reduction?: InputMaybe<Scalars['Float']>;
  scope3Year?: InputMaybe<Scalars['Int']>;
  strategy: TargetStrategyType;
  targetType: TargetType;
};

export type UpdateUserSolutionInterestsInput = {
  solutionInterestIds: Array<Scalars['UUID']>;
};

export type User = {
  __typename?: 'User';
  authProvider: AuthProvider;
  company?: Maybe<Company>;
  email: Scalars['String'];
  expertiseDomain?: Maybe<ExpertiseDomain>;
  firstName: Scalars['String'];
  hubspotId?: Maybe<Scalars['String']>;
  id: Scalars['UUID'];
  lastName: Scalars['String'];
  preferences?: Maybe<Preferences>;
  roles?: Maybe<Array<Role>>;
  status: UserStatus;
};

export type UserSolutionInterest = {
  __typename?: 'UserSolutionInterest';
  createdAt: Scalars['Date'];
  id: Scalars['UUID'];
  solutionInterest: SolutionInterest;
  updatedAt: Scalars['Date'];
};

export enum UserStatus {
  /** Active user */
  Active = 'ACTIVE',
  /** Invited user whose company has not been approved. No access to the app */
  Pending = 'PENDING'
}

export type Users = {
  __typename?: 'Users';
  count: Scalars['Int'];
  data: Array<User>;
};

export type VetoCompanyInput = {
  companyId: Scalars['UUID'];
};



export type ResolverTypeWrapper<T> = Promise<T> | T;


export type ResolverWithResolve<TResult, TParent, TContext, TArgs> = {
  resolve: ResolverFn<TResult, TParent, TContext, TArgs>;
};
export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs> | ResolverWithResolve<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  AbsoluteTarget: ResolverTypeWrapper<AbsoluteTarget>;
  AcceptCompanyInviteInput: AcceptCompanyInviteInput;
  AmbitionPrivacyStatus: AmbitionPrivacyStatus;
  ApproveCompanyInput: ApproveCompanyInput;
  AuthProvider: AuthProvider;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CarbonIntensity: ResolverTypeWrapper<CarbonIntensity>;
  CarbonIntensityConfig: ResolverTypeWrapper<CarbonIntensityConfig>;
  CarbonIntensityGroupType: CarbonIntensityGroupType;
  CarbonIntensityMetricType: CarbonIntensityMetricType;
  CarbonIntensityType: CarbonIntensityType;
  CategoriesSystemName: CategoriesSystemName;
  Category: ResolverTypeWrapper<Category>;
  CategoryType: CategoryType;
  ComanyDataPrivacyCompleteness: ResolverTypeWrapper<ComanyDataPrivacyCompleteness>;
  Companies: ResolverTypeWrapper<Companies>;
  CompaniesBenchmarkInput: CompaniesBenchmarkInput;
  CompaniesBenchmarkOrderBy: CompaniesBenchmarkOrderBy;
  Company: ResolverTypeWrapper<Company>;
  CompanyBenchmark: ResolverTypeWrapper<CompanyBenchmark>;
  CompanyBenchmarkRes: ResolverTypeWrapper<CompanyBenchmarkRes>;
  CompanyDataPrivacyCompletenessInput: CompanyDataPrivacyCompletenessInput;
  CompanyPrivacy: ResolverTypeWrapper<CompanyPrivacy>;
  CompanyPrivacyInput: CompanyPrivacyInput;
  CompanyProfile: ResolverTypeWrapper<CompanyProfile>;
  CompanyRelationship: ResolverTypeWrapper<CompanyRelationship>;
  CompanyRelationshipRecommendation: ResolverTypeWrapper<CompanyRelationshipRecommendation>;
  CompanyRelationshipRecommendationStatus: CompanyRelationshipRecommendationStatus;
  CompanyRelationshipType: CompanyRelationshipType;
  CompanySector: ResolverTypeWrapper<CompanySector>;
  CompanySectorInput: CompanySectorInput;
  CompanySectorType: CompanySectorType;
  CompanyStatus: CompanyStatus;
  ContactEmailSource: ContactEmailSource;
  CorporateCarbonIntensityComparison: ResolverTypeWrapper<CorporateCarbonIntensityComparison>;
  CorporateCarbonIntensityInfo: ResolverTypeWrapper<CorporateCarbonIntensityInfo>;
  CorporateEmission: ResolverTypeWrapper<CorporateEmission>;
  CorporateEmissionAccess: ResolverTypeWrapper<CorporateEmissionAccess>;
  CorporateEmissionAccessInput: CorporateEmissionAccessInput;
  CorporateEmissionRank: ResolverTypeWrapper<CorporateEmissionRank>;
  CorporateEmissionType: CorporateEmissionType;
  CorporateEmissionWithCarbonIntensityInfo: ResolverTypeWrapper<CorporateEmissionWithCarbonIntensityInfo>;
  CreateCarbonIntensityData: CreateCarbonIntensityData;
  CreateCompanyRelationshipInput: CreateCompanyRelationshipInput;
  CreateCompanyUserInput: CreateCompanyUserInput;
  CreateCorporateEmissionInput: CreateCorporateEmissionInput;
  CreateEmissionAllocationInput: CreateEmissionAllocationInput;
  CreateTargetInput: CreateTargetInput;
  CreateUserInput: CreateUserInput;
  DataShareRequest: ResolverTypeWrapper<DataShareRequest>;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DeclineCompanyInviteInput: DeclineCompanyInviteInput;
  DeleteCorporateEmissionInput: DeleteCorporateEmissionInput;
  DeleteEmissionAllocationInput: DeleteEmissionAllocationInput;
  DeleteUserInput: DeleteUserInput;
  DnBAuthTokenResponse: ResolverTypeWrapper<DnBAuthTokenResponse>;
  DnBTypeaheadResult: ResolverTypeWrapper<DnBTypeaheadResult>;
  EditCompanyUserInput: EditCompanyUserInput;
  EditPreferencesInput: EditPreferencesInput;
  EditUserInput: EditUserInput;
  Email: ResolverTypeWrapper<Scalars['Email']>;
  EmailEnquiry: EmailEnquiry;
  EmissionAllocation: ResolverTypeWrapper<EmissionAllocation>;
  EmissionAllocationDirection: EmissionAllocationDirection;
  EmissionAllocationMethod: EmissionAllocationMethod;
  EmissionAllocationStatus: EmissionAllocationStatus;
  EmissionAllocationType: EmissionAllocationType;
  EmissionPrivacyStatus: EmissionPrivacyStatus;
  EnquiryEmailInput: EnquiryEmailInput;
  ExpertiseDomain: ExpertiseDomain;
  File: ResolverTypeWrapper<File>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  IntensityTarget: ResolverTypeWrapper<IntensityTarget>;
  Invitation: ResolverTypeWrapper<Invitation>;
  InviteAndConnectToCompanyInput: InviteAndConnectToCompanyInput;
  InviteCompanyEmailInput: InviteCompanyEmailInput;
  InviteStatus: InviteStatus;
  Invitee: Invitee;
  Inviter: Inviter;
  Me: ResolverTypeWrapper<Me>;
  Mutation: ResolverTypeWrapper<{}>;
  NetworkSummary: ResolverTypeWrapper<NetworkSummary>;
  OrderBy: OrderBy;
  PageSize: ResolverTypeWrapper<Scalars['PageSize']>;
  Preferences: ResolverTypeWrapper<Preferences>;
  Query: ResolverTypeWrapper<{}>;
  ReductionRankType: ReductionRankType;
  RegionName: RegionName;
  ResendUserInviteToJoinEmailInput: ResendUserInviteToJoinEmailInput;
  ResentAkamaiInviteInput: ResentAkamaiInviteInput;
  Role: ResolverTypeWrapper<Role>;
  RoleName: RoleName;
  SafeString: ResolverTypeWrapper<Scalars['SafeString']>;
  SaveTargetsInput: SaveTargetsInput;
  SaveTargetsTargetInstance: SaveTargetsTargetInstance;
  SbtiSystemName: SbtiSystemName;
  Scope2Type: Scope2Type;
  Sector: ResolverTypeWrapper<Sector>;
  SectorSourceType: SectorSourceType;
  SimpleSuccess: ResolverTypeWrapper<SimpleSuccess>;
  SolutionInterest: ResolverTypeWrapper<SolutionInterest>;
  SolutionInterestsSystemName: SolutionInterestsSystemName;
  String: ResolverTypeWrapper<Scalars['String']>;
  TargetPrivacyType: TargetPrivacyType;
  TargetScopeType: TargetScopeType;
  TargetStrategyType: TargetStrategyType;
  TargetType: TargetType;
  Targets: ResolverTypeWrapper<Targets>;
  TribeJwt: ResolverTypeWrapper<TribeJwt>;
  TribeUsageStats: ResolverTypeWrapper<TribeUsageStats>;
  UUID: ResolverTypeWrapper<Scalars['UUID']>;
  UpdateCompanyRelationshipInput: UpdateCompanyRelationshipInput;
  UpdateCompanySectorsInput: UpdateCompanySectorsInput;
  UpdateCompanyStatusInput: UpdateCompanyStatusInput;
  UpdateCorporateEmissionInput: UpdateCorporateEmissionInput;
  UpdateEmissionAllocationInput: UpdateEmissionAllocationInput;
  UpdateMeInput: UpdateMeInput;
  UpdateTargetInput: UpdateTargetInput;
  UpdateUserSolutionInterestsInput: UpdateUserSolutionInterestsInput;
  User: ResolverTypeWrapper<User>;
  UserName: ResolverTypeWrapper<Scalars['UserName']>;
  UserSolutionInterest: ResolverTypeWrapper<UserSolutionInterest>;
  UserStatus: UserStatus;
  Users: ResolverTypeWrapper<Users>;
  VetoCompanyInput: VetoCompanyInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AbsoluteTarget: AbsoluteTarget;
  AcceptCompanyInviteInput: AcceptCompanyInviteInput;
  ApproveCompanyInput: ApproveCompanyInput;
  Boolean: Scalars['Boolean'];
  CarbonIntensity: CarbonIntensity;
  CarbonIntensityConfig: CarbonIntensityConfig;
  Category: Category;
  ComanyDataPrivacyCompleteness: ComanyDataPrivacyCompleteness;
  Companies: Companies;
  CompaniesBenchmarkInput: CompaniesBenchmarkInput;
  Company: Company;
  CompanyBenchmark: CompanyBenchmark;
  CompanyBenchmarkRes: CompanyBenchmarkRes;
  CompanyDataPrivacyCompletenessInput: CompanyDataPrivacyCompletenessInput;
  CompanyPrivacy: CompanyPrivacy;
  CompanyPrivacyInput: CompanyPrivacyInput;
  CompanyProfile: CompanyProfile;
  CompanyRelationship: CompanyRelationship;
  CompanyRelationshipRecommendation: CompanyRelationshipRecommendation;
  CompanySector: CompanySector;
  CompanySectorInput: CompanySectorInput;
  CorporateCarbonIntensityComparison: CorporateCarbonIntensityComparison;
  CorporateCarbonIntensityInfo: CorporateCarbonIntensityInfo;
  CorporateEmission: CorporateEmission;
  CorporateEmissionAccess: CorporateEmissionAccess;
  CorporateEmissionAccessInput: CorporateEmissionAccessInput;
  CorporateEmissionRank: CorporateEmissionRank;
  CorporateEmissionWithCarbonIntensityInfo: CorporateEmissionWithCarbonIntensityInfo;
  CreateCarbonIntensityData: CreateCarbonIntensityData;
  CreateCompanyRelationshipInput: CreateCompanyRelationshipInput;
  CreateCompanyUserInput: CreateCompanyUserInput;
  CreateCorporateEmissionInput: CreateCorporateEmissionInput;
  CreateEmissionAllocationInput: CreateEmissionAllocationInput;
  CreateTargetInput: CreateTargetInput;
  CreateUserInput: CreateUserInput;
  DataShareRequest: DataShareRequest;
  Date: Scalars['Date'];
  DeclineCompanyInviteInput: DeclineCompanyInviteInput;
  DeleteCorporateEmissionInput: DeleteCorporateEmissionInput;
  DeleteEmissionAllocationInput: DeleteEmissionAllocationInput;
  DeleteUserInput: DeleteUserInput;
  DnBAuthTokenResponse: DnBAuthTokenResponse;
  DnBTypeaheadResult: DnBTypeaheadResult;
  EditCompanyUserInput: EditCompanyUserInput;
  EditPreferencesInput: EditPreferencesInput;
  EditUserInput: EditUserInput;
  Email: Scalars['Email'];
  EmissionAllocation: EmissionAllocation;
  EnquiryEmailInput: EnquiryEmailInput;
  File: File;
  Float: Scalars['Float'];
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  IntensityTarget: IntensityTarget;
  Invitation: Invitation;
  InviteAndConnectToCompanyInput: InviteAndConnectToCompanyInput;
  InviteCompanyEmailInput: InviteCompanyEmailInput;
  Invitee: Invitee;
  Inviter: Inviter;
  Me: Me;
  Mutation: {};
  NetworkSummary: NetworkSummary;
  PageSize: Scalars['PageSize'];
  Preferences: Preferences;
  Query: {};
  ResendUserInviteToJoinEmailInput: ResendUserInviteToJoinEmailInput;
  ResentAkamaiInviteInput: ResentAkamaiInviteInput;
  Role: Role;
  SafeString: Scalars['SafeString'];
  SaveTargetsInput: SaveTargetsInput;
  SaveTargetsTargetInstance: SaveTargetsTargetInstance;
  Sector: Sector;
  SimpleSuccess: SimpleSuccess;
  SolutionInterest: SolutionInterest;
  String: Scalars['String'];
  Targets: Targets;
  TribeJwt: TribeJwt;
  TribeUsageStats: TribeUsageStats;
  UUID: Scalars['UUID'];
  UpdateCompanyRelationshipInput: UpdateCompanyRelationshipInput;
  UpdateCompanySectorsInput: UpdateCompanySectorsInput;
  UpdateCompanyStatusInput: UpdateCompanyStatusInput;
  UpdateCorporateEmissionInput: UpdateCorporateEmissionInput;
  UpdateEmissionAllocationInput: UpdateEmissionAllocationInput;
  UpdateMeInput: UpdateMeInput;
  UpdateTargetInput: UpdateTargetInput;
  UpdateUserSolutionInterestsInput: UpdateUserSolutionInterestsInput;
  User: User;
  UserName: Scalars['UserName'];
  UserSolutionInterest: UserSolutionInterest;
  Users: Users;
  VetoCompanyInput: VetoCompanyInput;
};

export type BelongsToApprovedCompanyDirectiveArgs = { };

export type BelongsToApprovedCompanyDirectiveResolver<Result, Parent, ContextType = any, Args = BelongsToApprovedCompanyDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type HasRoleDirectiveArgs = {
  roles: Array<Scalars['String']>;
};

export type HasRoleDirectiveResolver<Result, Parent, ContextType = any, Args = HasRoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ValidateCompanyAccessDirectiveArgs = {
  inputFieldsToValidate: Array<Scalars['String']>;
  permitAdmins: Scalars['Boolean'];
};

export type ValidateCompanyAccessDirectiveResolver<Result, Parent, ContextType = any, Args = ValidateCompanyAccessDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AbsoluteTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['AbsoluteTarget'] = ResolversParentTypes['AbsoluteTarget']> = {
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  includeCarbonOffset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  scope1And2PrivacyType?: Resolver<Maybe<ResolversTypes['TargetPrivacyType']>, ParentType, ContextType>;
  scope1And2Reduction?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope1And2Year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scope3PrivacyType?: Resolver<Maybe<ResolversTypes['TargetPrivacyType']>, ParentType, ContextType>;
  scope3Reduction?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope3Year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  strategy?: Resolver<ResolversTypes['TargetStrategyType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CarbonIntensityResolvers<ContextType = any, ParentType extends ResolversParentTypes['CarbonIntensity'] = ResolversParentTypes['CarbonIntensity']> = {
  company?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdByUser?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  intensityMetric?: Resolver<ResolversTypes['CarbonIntensityMetricType'], ParentType, ContextType>;
  intensityValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CarbonIntensityType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  updatedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CarbonIntensityConfigResolvers<ContextType = any, ParentType extends ResolversParentTypes['CarbonIntensityConfig'] = ResolversParentTypes['CarbonIntensityConfig']> = {
  group?: Resolver<ResolversTypes['CarbonIntensityGroupType'], ParentType, ContextType>;
  maxValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  minValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  numberOfDecimals?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CarbonIntensityMetricType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Category'] = ResolversParentTypes['Category']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  order?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  systemName?: Resolver<ResolversTypes['CategoriesSystemName'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CategoryType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ComanyDataPrivacyCompletenessResolvers<ContextType = any, ParentType extends ResolversParentTypes['ComanyDataPrivacyCompleteness'] = ResolversParentTypes['ComanyDataPrivacyCompleteness']> = {
  companyId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  isComplete?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  numAbsoluteTargetPrivacyTypeMissing?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numCorporateEmissionAccessMissing?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numIntensityTargetPrivacyTypeMissing?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompaniesResolvers<ContextType = any, ParentType extends ResolversParentTypes['Companies'] = ResolversParentTypes['Companies']> = {
  data?: Resolver<Array<ResolversTypes['Company']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyResolvers<ContextType = any, ParentType extends ResolversParentTypes['Company'] = ResolversParentTypes['Company']> = {
  businessSection?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  companySectors?: Resolver<Maybe<Array<ResolversTypes['CompanySector']>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  createdByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  dnbAddressLineOne?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbAddressLineTwo?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbCountry?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbCountryIso?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbPostalCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbRegion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duns?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hubspotId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  reviewedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  reviewedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['CompanyStatus'], ParentType, ContextType>;
  subSector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  updatedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyBenchmarkResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyBenchmark'] = ResolversParentTypes['CompanyBenchmark']> = {
  annualEmissionVariance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  baselineYear?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  companyDuns?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  companyRelationshipStatus?: Resolver<Maybe<ResolversTypes['InviteStatus']>, ParentType, ContextType>;
  companyRelationshipType?: Resolver<Maybe<ResolversTypes['CompanyRelationshipType']>, ParentType, ContextType>;
  emissionToIntensityRatio?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  estimatedNumberOfEmployees?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalEmissionVariance?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyBenchmarkResResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyBenchmarkRes'] = ResolversParentTypes['CompanyBenchmarkRes']> = {
  data?: Resolver<Array<ResolversTypes['CompanyBenchmark']>, ParentType, ContextType>;
  total?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyPrivacyResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyPrivacy'] = ResolversParentTypes['CompanyPrivacy']> = {
  allPlatform?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  companyId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  customerNetwork?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  supplierNetwork?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyProfileResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyProfile'] = ResolversParentTypes['CompanyProfile']> = {
  absoluteTargetType?: Resolver<Maybe<ResolversTypes['TargetPrivacyType']>, ParentType, ContextType>;
  activeRelationship?: Resolver<Maybe<ResolversTypes['CompanyRelationshipType']>, ParentType, ContextType>;
  companyPrivacy?: Resolver<Maybe<ResolversTypes['CompanyPrivacy']>, ParentType, ContextType>;
  dataShareRequestSent?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  dnbCountryIso?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dnbRegion?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duns?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  estimatedNumberOfEmployees?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  estimatedUsdOfRevenue?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  invitationPending?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isActive?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sectors?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyRelationshipResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyRelationship'] = ResolversParentTypes['CompanyRelationship']> = {
  ambitionPrivacyStatus?: Resolver<Maybe<ResolversTypes['AmbitionPrivacyStatus']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  customer?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  customerApprover?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  emissionPrivacyStatus?: Resolver<Maybe<ResolversTypes['EmissionPrivacyStatus']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  inviteType?: Resolver<ResolversTypes['CompanyRelationshipType'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['InviteStatus'], ParentType, ContextType>;
  supplier?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  supplierApprover?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanyRelationshipRecommendationResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanyRelationshipRecommendation'] = ResolversParentTypes['CompanyRelationshipRecommendation']> = {
  companyId?: Resolver<Maybe<ResolversTypes['UUID']>, ParentType, ContextType>;
  country?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duns?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  recommendationStatus?: Resolver<ResolversTypes['CompanyRelationshipRecommendationStatus'], ParentType, ContextType>;
  region?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  relationshipType?: Resolver<ResolversTypes['CompanyRelationshipType'], ParentType, ContextType>;
  sector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CompanySectorResolvers<ContextType = any, ParentType extends ResolversParentTypes['CompanySector'] = ResolversParentTypes['CompanySector']> = {
  company?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  createdByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  hasBeenUpdated?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  sector?: Resolver<ResolversTypes['Sector'], ParentType, ContextType>;
  sectorType?: Resolver<ResolversTypes['CompanySectorType'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  updatedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateCarbonIntensityComparisonResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateCarbonIntensityComparison'] = ResolversParentTypes['CorporateCarbonIntensityComparison']> = {
  companyIntensity?: Resolver<ResolversTypes['CorporateCarbonIntensityInfo'], ParentType, ContextType>;
  sectorIntensity?: Resolver<ResolversTypes['CorporateCarbonIntensityInfo'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateCarbonIntensityInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateCarbonIntensityInfo'] = ResolversParentTypes['CorporateCarbonIntensityInfo']> = {
  scope1?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope2?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope3?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateEmissionResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateEmission'] = ResolversParentTypes['CorporateEmission']> = {
  carbonIntensities?: Resolver<Array<ResolversTypes['CarbonIntensity']>, ParentType, ContextType>;
  company?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  corporateEmissionAccess?: Resolver<Maybe<ResolversTypes['CorporateEmissionAccess']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdByUser?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  headCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  offset?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope1?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope2?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope2Type?: Resolver<ResolversTypes['Scope2Type'], ParentType, ContextType>;
  scope3?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  examplePercentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CorporateEmissionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updatedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  verificationFile?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateEmissionAccessResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateEmissionAccess'] = ResolversParentTypes['CorporateEmissionAccess']> = {
  carbonIntensity?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  carbonOffsets?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  publicLink?: Resolver<Maybe<ResolversTypes['SafeString']>, ParentType, ContextType>;
  scope1And2?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  scope3?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateEmissionRankResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateEmissionRank'] = ResolversParentTypes['CorporateEmissionRank']> = {
  businessSector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  currentYear?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  hasPreviousYearVerificationFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasVerificationFile?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  primarySector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  rank?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  rankType?: Resolver<ResolversTypes['ReductionRankType'], ParentType, ContextType>;
  reductionPercentage?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope1?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scope2?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scope3?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  secondarySector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  subSector?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CorporateEmissionWithCarbonIntensityInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['CorporateEmissionWithCarbonIntensityInfo'] = ResolversParentTypes['CorporateEmissionWithCarbonIntensityInfo']> = {
  carbonIntensities?: Resolver<Array<ResolversTypes['CarbonIntensity']>, ParentType, ContextType>;
  company?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdByUser?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  headCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  offset?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope1?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope2?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope2Type?: Resolver<ResolversTypes['Scope2Type'], ParentType, ContextType>;
  scope3?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  examplePercentage?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['CorporateEmissionType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updatedByUser?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  verificationFile?: Resolver<Maybe<ResolversTypes['File']>, ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DataShareRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['DataShareRequest'] = ResolversParentTypes['DataShareRequest']> = {
  companyId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  targetCompanyId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export type DnBAuthTokenResponseResolvers<ContextType = any, ParentType extends ResolversParentTypes['DnBAuthTokenResponse'] = ResolversParentTypes['DnBAuthTokenResponse']> = {
  access_token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expiresIn?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DnBTypeaheadResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['DnBTypeaheadResult'] = ResolversParentTypes['DnBTypeaheadResult']> = {
  addressCountryIsoAlpha2Code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  addressLine1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  addressRegionName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duns?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  globalUltimateDuns?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  globalUltimatePrimaryName?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isGlobalUltimate?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  primaryName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface EmailScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Email'], any> {
  name: 'Email';
}

export type EmissionAllocationResolvers<ContextType = any, ParentType extends ResolversParentTypes['EmissionAllocation'] = ResolversParentTypes['EmissionAllocation']> = {
  addedToCustomerScopeTotal?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  allocationMethod?: Resolver<Maybe<ResolversTypes['EmissionAllocationMethod']>, ParentType, ContextType>;
  category?: Resolver<Maybe<ResolversTypes['Category']>, ParentType, ContextType>;
  categoryId?: Resolver<Maybe<ResolversTypes['UUID']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  customer?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  customerApprover?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  customerEmissionId?: Resolver<Maybe<ResolversTypes['UUID']>, ParentType, ContextType>;
  customerId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  emissions?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['EmissionAllocationStatus'], ParentType, ContextType>;
  supplier?: Resolver<Maybe<ResolversTypes['Company']>, ParentType, ContextType>;
  supplierApprover?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  supplierId?: Resolver<Maybe<ResolversTypes['UUID']>, ParentType, ContextType>;
  type?: Resolver<ResolversTypes['EmissionAllocationType'], ParentType, ContextType>;
  year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FileResolvers<ContextType = any, ParentType extends ResolversParentTypes['File'] = ResolversParentTypes['File']> = {
  azureBlobFilename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  company?: Resolver<ResolversTypes['Company'], ParentType, ContextType>;
  createdByUser?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  mimetype?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  originalFilename?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sizeInBytes?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IntensityTargetResolvers<ContextType = any, ParentType extends ResolversParentTypes['IntensityTarget'] = ResolversParentTypes['IntensityTarget']> = {
  companyId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  includeCarbonOffset?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  intensityMetric?: Resolver<ResolversTypes['CarbonIntensityMetricType'], ParentType, ContextType>;
  intensityValue?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope1And2PrivacyType?: Resolver<Maybe<ResolversTypes['TargetPrivacyType']>, ParentType, ContextType>;
  scope1And2Reduction?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  scope1And2Year?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  scope3PrivacyType?: Resolver<Maybe<ResolversTypes['TargetPrivacyType']>, ParentType, ContextType>;
  scope3Reduction?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  scope3Year?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  strategy?: Resolver<ResolversTypes['TargetStrategyType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InvitationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Invitation'] = ResolversParentTypes['Invitation']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  customerName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  inviteType?: Resolver<ResolversTypes['CompanyRelationshipType'], ParentType, ContextType>;
  note?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['InviteStatus'], ParentType, ContextType>;
  supplierName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MeResolvers<ContextType = any, ParentType extends ResolversParentTypes['Me'] = ResolversParentTypes['Me']> = {
  authProvider?: Resolver<ResolversTypes['AuthProvider'], ParentType, ContextType>;
  canEditCompanyMembers?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canEditCompanyRelationships?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canEditCompanySectors?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canEditEmissionAllocations?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canEditSupplyDashboard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canInviteNewCompanyMembers?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canRemoveCompanyMembers?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canSubmitDataPrivacyInfo?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewCompaniesAdminDashboard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewCompanyRelationships?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewEmissionAllocations?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewSupplyDashboard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  canViewUsersAdminDashboard?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['Company']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expertiseDomain?: Resolver<Maybe<ResolversTypes['ExpertiseDomain']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  launchDarklyHash?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  preferences?: Resolver<Maybe<ResolversTypes['Preferences']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acceptCompanyInvite?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationAcceptCompanyInviteArgs, 'input'>>;
  activateUserAndCompany?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  approveCompany?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<MutationApproveCompanyArgs, 'input'>>;
  createCompanyPrivacy?: Resolver<Maybe<ResolversTypes['CompanyPrivacy']>, ParentType, ContextType, RequireFields<MutationCreateCompanyPrivacyArgs, 'input'>>;
  createCompanyRelationship?: Resolver<ResolversTypes['CompanyRelationship'], ParentType, ContextType, RequireFields<MutationCreateCompanyRelationshipArgs, 'input'>>;
  createCompanyUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateCompanyUserArgs, 'input'>>;
  createCorporateEmission?: Resolver<Maybe<ResolversTypes['CorporateEmission']>, ParentType, ContextType, RequireFields<MutationCreateCorporateEmissionArgs, 'input'>>;
  createEmissionAllocation?: Resolver<ResolversTypes['EmissionAllocation'], ParentType, ContextType, RequireFields<MutationCreateEmissionAllocationArgs, 'input'>>;
  createTarget?: Resolver<Maybe<ResolversTypes['AbsoluteTarget']>, ParentType, ContextType, RequireFields<MutationCreateTargetArgs, 'input'>>;
  createUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateUserArgs, 'input'>>;
  dataShareRequest?: Resolver<ResolversTypes['DataShareRequest'], ParentType, ContextType, RequireFields<MutationDataShareRequestArgs, 'targetCompanyId'>>;
  declineCompanyInvite?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationDeclineCompanyInviteArgs, 'input'>>;
  deleteCorporateEmission?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationDeleteCorporateEmissionArgs, 'input'>>;
  deleteEmissionAllocation?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationDeleteEmissionAllocationArgs, 'input'>>;
  deleteUser?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationDeleteUserArgs, 'input'>>;
  editCompanyUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationEditCompanyUserArgs, 'input'>>;
  editPreferences?: Resolver<Maybe<ResolversTypes['Preferences']>, ParentType, ContextType, RequireFields<MutationEditPreferencesArgs, 'input'>>;
  editUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationEditUserArgs, 'input'>>;
  enquiryEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationEnquiryEmailArgs, 'input'>>;
  inviteAndConnectToCompany?: Resolver<ResolversTypes['CompanyRelationship'], ParentType, ContextType, RequireFields<MutationInviteAndConnectToCompanyArgs, 'input'>>;
  inviteCompanyEmail?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<MutationInviteCompanyEmailArgs, 'input'>>;
  resendAkamaiInvite?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationResendAkamaiInviteArgs, 'input'>>;
  resendUserInviteToJoinEmail?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationResendUserInviteToJoinEmailArgs, 'input'>>;
  saveTargets?: Resolver<ResolversTypes['SimpleSuccess'], ParentType, ContextType, RequireFields<MutationSaveTargetsArgs, 'input'>>;
  updateCompanyPrivacy?: Resolver<Maybe<ResolversTypes['CompanyPrivacy']>, ParentType, ContextType, RequireFields<MutationUpdateCompanyPrivacyArgs, 'input'>>;
  updateCompanyRelationship?: Resolver<ResolversTypes['CompanyRelationship'], ParentType, ContextType, RequireFields<MutationUpdateCompanyRelationshipArgs, 'input'>>;
  updateCompanyRelationshipRecommendationStatus?: Resolver<ResolversTypes['String'], ParentType, ContextType, RequireFields<MutationUpdateCompanyRelationshipRecommendationStatusArgs, 'id' | 'status'>>;
  updateCompanySectors?: Resolver<Array<ResolversTypes['CompanySector']>, ParentType, ContextType, RequireFields<MutationUpdateCompanySectorsArgs, 'input'>>;
  updateCompanyStatus?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<MutationUpdateCompanyStatusArgs, 'input'>>;
  updateCorporateEmission?: Resolver<Maybe<ResolversTypes['CorporateEmission']>, ParentType, ContextType, RequireFields<MutationUpdateCorporateEmissionArgs, 'input'>>;
  updateEmissionAllocation?: Resolver<ResolversTypes['EmissionAllocation'], ParentType, ContextType, RequireFields<MutationUpdateEmissionAllocationArgs, 'input'>>;
  updateMe?: Resolver<ResolversTypes['Me'], ParentType, ContextType, RequireFields<MutationUpdateMeArgs, 'input'>>;
  updateTarget?: Resolver<Maybe<ResolversTypes['AbsoluteTarget']>, ParentType, ContextType, RequireFields<MutationUpdateTargetArgs, 'input'>>;
  updateUserSolutionInterests?: Resolver<Array<ResolversTypes['UserSolutionInterest']>, ParentType, ContextType, RequireFields<MutationUpdateUserSolutionInterestsArgs, 'input'>>;
  vetoCompany?: Resolver<ResolversTypes['Company'], ParentType, ContextType, RequireFields<MutationVetoCompanyArgs, 'input'>>;
};

export type NetworkSummaryResolvers<ContextType = any, ParentType extends ResolversParentTypes['NetworkSummary'] = ResolversParentTypes['NetworkSummary']> = {
  companyId?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  numCustomers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numPendingInvitations?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  numSuppliers?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  pendingInvitations?: Resolver<Array<ResolversTypes['Invitation']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PageSizeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PageSize'], any> {
  name: 'PageSize';
}

export type PreferencesResolvers<ContextType = any, ParentType extends ResolversParentTypes['Preferences'] = ResolversParentTypes['Preferences']> = {
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  suppressTaskListPrompt?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  baseline?: Resolver<Maybe<ResolversTypes['CorporateEmission']>, ParentType, ContextType, RequireFields<QueryBaselineArgs, 'companyId'>>;
  carbonIntensities?: Resolver<Array<ResolversTypes['CarbonIntensity']>, ParentType, ContextType, RequireFields<QueryCarbonIntensitiesArgs, 'companyId'>>;
  carbonIntensityConfig?: Resolver<Array<ResolversTypes['CarbonIntensityConfig']>, ParentType, ContextType>;
  categories?: Resolver<Array<ResolversTypes['Category']>, ParentType, ContextType>;
  companies?: Resolver<ResolversTypes['Companies'], ParentType, ContextType, Partial<QueryCompaniesArgs>>;
  companiesBenchmark?: Resolver<ResolversTypes['CompanyBenchmarkRes'], ParentType, ContextType, Partial<QueryCompaniesBenchmarkArgs>>;
  companyByDuns?: Resolver<Maybe<ResolversTypes['Company']>, ParentType, ContextType, RequireFields<QueryCompanyByDunsArgs, 'duns'>>;
  companyDataPrivacyCompleteness?: Resolver<Maybe<ResolversTypes['ComanyDataPrivacyCompleteness']>, ParentType, ContextType, RequireFields<QueryCompanyDataPrivacyCompletenessArgs, 'companyId'>>;
  companyPrivacy?: Resolver<Maybe<ResolversTypes['CompanyPrivacy']>, ParentType, ContextType>;
  companyProfile?: Resolver<ResolversTypes['CompanyProfile'], ParentType, ContextType, RequireFields<QueryCompanyProfileArgs, 'companyId'>>;
  companyRelationshipRecommendations?: Resolver<Array<ResolversTypes['CompanyRelationshipRecommendation']>, ParentType, ContextType, RequireFields<QueryCompanyRelationshipRecommendationsArgs, 'companyId' | 'recommendationStatuses' | 'relationshipTypes'>>;
  companyRelationships?: Resolver<Array<ResolversTypes['CompanyRelationship']>, ParentType, ContextType, RequireFields<QueryCompanyRelationshipsArgs, 'companyId'>>;
  companySectors?: Resolver<Array<ResolversTypes['CompanySector']>, ParentType, ContextType, RequireFields<QueryCompanySectorsArgs, 'companyId'>>;
  companyUserRoles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType>;
  companyUsers?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType, Partial<QueryCompanyUsersArgs>>;
  corporateCarbonIntensityComparisons?: Resolver<Maybe<Array<ResolversTypes['CorporateCarbonIntensityComparison']>>, ParentType, ContextType, RequireFields<QueryCorporateCarbonIntensityComparisonsArgs, 'companyId' | 'years'>>;
  corporateEmissionRank?: Resolver<Maybe<ResolversTypes['CorporateEmissionRank']>, ParentType, ContextType, RequireFields<QueryCorporateEmissionRankArgs, 'companyId' | 'year'>>;
  corporateEmissionRanks?: Resolver<Array<ResolversTypes['CorporateEmissionRank']>, ParentType, ContextType, RequireFields<QueryCorporateEmissionRanksArgs, 'companyId' | 'year'>>;
  corporateEmissions?: Resolver<Array<ResolversTypes['CorporateEmission']>, ParentType, ContextType, RequireFields<QueryCorporateEmissionsArgs, 'companyId'>>;
  dnbTypeaheadSearch?: Resolver<Array<ResolversTypes['DnBTypeaheadResult']>, ParentType, ContextType, RequireFields<QueryDnbTypeaheadSearchArgs, 'searchTerm'>>;
  emissionAllocations?: Resolver<Array<ResolversTypes['EmissionAllocation']>, ParentType, ContextType, RequireFields<QueryEmissionAllocationsArgs, 'companyId'>>;
  emissionsAllocatedToMyCompany?: Resolver<Array<ResolversTypes['EmissionAllocation']>, ParentType, ContextType, RequireFields<QueryEmissionsAllocatedToMyCompanyArgs, 'supplierId'>>;
  latestCorporateEmission?: Resolver<Maybe<ResolversTypes['CorporateEmission']>, ParentType, ContextType, RequireFields<QueryLatestCorporateEmissionArgs, 'companyId'>>;
  me?: Resolver<ResolversTypes['Me'], ParentType, ContextType>;
  networkSummary?: Resolver<ResolversTypes['NetworkSummary'], ParentType, ContextType>;
  preferences?: Resolver<Maybe<ResolversTypes['Preferences']>, ParentType, ContextType>;
  roles?: Resolver<Array<ResolversTypes['Role']>, ParentType, ContextType, Partial<QueryRolesArgs>>;
  sectors?: Resolver<Array<ResolversTypes['Sector']>, ParentType, ContextType, Partial<QuerySectorsArgs>>;
  solutionInterests?: Resolver<Array<ResolversTypes['SolutionInterest']>, ParentType, ContextType>;
  target?: Resolver<Maybe<ResolversTypes['AbsoluteTarget']>, ParentType, ContextType, RequireFields<QueryTargetArgs, 'companyId'>>;
  targets?: Resolver<Maybe<ResolversTypes['Targets']>, ParentType, ContextType, RequireFields<QueryTargetsArgs, 'companyId'>>;
  tribeJwt?: Resolver<ResolversTypes['TribeJwt'], ParentType, ContextType>;
  tribeUsageStats?: Resolver<ResolversTypes['TribeUsageStats'], ParentType, ContextType>;
  user?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<QueryUserArgs, 'email'>>;
  userSolutionInterests?: Resolver<Array<ResolversTypes['UserSolutionInterest']>, ParentType, ContextType>;
  users?: Resolver<ResolversTypes['Users'], ParentType, ContextType, Partial<QueryUsersArgs>>;
};

export type RoleResolvers<ContextType = any, ParentType extends ResolversParentTypes['Role'] = ResolversParentTypes['Role']> = {
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['RoleName'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface SafeStringScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['SafeString'], any> {
  name: 'SafeString';
}

export type SectorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Sector'] = ResolversParentTypes['Sector']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  division?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  industryCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  industryType?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sourceName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SimpleSuccessResolvers<ContextType = any, ParentType extends ResolversParentTypes['SimpleSuccess'] = ResolversParentTypes['SimpleSuccess']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type SolutionInterestResolvers<ContextType = any, ParentType extends ResolversParentTypes['SolutionInterest'] = ResolversParentTypes['SolutionInterest']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  systemName?: Resolver<ResolversTypes['SolutionInterestsSystemName'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TargetsResolvers<ContextType = any, ParentType extends ResolversParentTypes['Targets'] = ResolversParentTypes['Targets']> = {
  absolute?: Resolver<Array<ResolversTypes['AbsoluteTarget']>, ParentType, ContextType>;
  intensity?: Resolver<Array<ResolversTypes['IntensityTarget']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TribeJwtResolvers<ContextType = any, ParentType extends ResolversParentTypes['TribeJwt'] = ResolversParentTypes['TribeJwt']> = {
  token?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TribeUsageStatsResolvers<ContextType = any, ParentType extends ResolversParentTypes['TribeUsageStats'] = ResolversParentTypes['TribeUsageStats']> = {
  members?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  replies?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  topics?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UuidScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UUID'], any> {
  name: 'UUID';
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  authProvider?: Resolver<ResolversTypes['AuthProvider'], ParentType, ContextType>;
  company?: Resolver<Maybe<ResolversTypes['Company']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  expertiseDomain?: Resolver<Maybe<ResolversTypes['ExpertiseDomain']>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  hubspotId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  preferences?: Resolver<Maybe<ResolversTypes['Preferences']>, ParentType, ContextType>;
  roles?: Resolver<Maybe<Array<ResolversTypes['Role']>>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['UserStatus'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UserNameScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['UserName'], any> {
  name: 'UserName';
}

export type UserSolutionInterestResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserSolutionInterest'] = ResolversParentTypes['UserSolutionInterest']> = {
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  id?: Resolver<ResolversTypes['UUID'], ParentType, ContextType>;
  solutionInterest?: Resolver<ResolversTypes['SolutionInterest'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersResolvers<ContextType = any, ParentType extends ResolversParentTypes['Users'] = ResolversParentTypes['Users']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  data?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AbsoluteTarget?: AbsoluteTargetResolvers<ContextType>;
  CarbonIntensity?: CarbonIntensityResolvers<ContextType>;
  CarbonIntensityConfig?: CarbonIntensityConfigResolvers<ContextType>;
  Category?: CategoryResolvers<ContextType>;
  ComanyDataPrivacyCompleteness?: ComanyDataPrivacyCompletenessResolvers<ContextType>;
  Companies?: CompaniesResolvers<ContextType>;
  Company?: CompanyResolvers<ContextType>;
  CompanyBenchmark?: CompanyBenchmarkResolvers<ContextType>;
  CompanyBenchmarkRes?: CompanyBenchmarkResResolvers<ContextType>;
  CompanyPrivacy?: CompanyPrivacyResolvers<ContextType>;
  CompanyProfile?: CompanyProfileResolvers<ContextType>;
  CompanyRelationship?: CompanyRelationshipResolvers<ContextType>;
  CompanyRelationshipRecommendation?: CompanyRelationshipRecommendationResolvers<ContextType>;
  CompanySector?: CompanySectorResolvers<ContextType>;
  CorporateCarbonIntensityComparison?: CorporateCarbonIntensityComparisonResolvers<ContextType>;
  CorporateCarbonIntensityInfo?: CorporateCarbonIntensityInfoResolvers<ContextType>;
  CorporateEmission?: CorporateEmissionResolvers<ContextType>;
  CorporateEmissionAccess?: CorporateEmissionAccessResolvers<ContextType>;
  CorporateEmissionRank?: CorporateEmissionRankResolvers<ContextType>;
  CorporateEmissionWithCarbonIntensityInfo?: CorporateEmissionWithCarbonIntensityInfoResolvers<ContextType>;
  DataShareRequest?: DataShareRequestResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DnBAuthTokenResponse?: DnBAuthTokenResponseResolvers<ContextType>;
  DnBTypeaheadResult?: DnBTypeaheadResultResolvers<ContextType>;
  Email?: GraphQLScalarType;
  EmissionAllocation?: EmissionAllocationResolvers<ContextType>;
  File?: FileResolvers<ContextType>;
  IntensityTarget?: IntensityTargetResolvers<ContextType>;
  Invitation?: InvitationResolvers<ContextType>;
  Me?: MeResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  NetworkSummary?: NetworkSummaryResolvers<ContextType>;
  PageSize?: GraphQLScalarType;
  Preferences?: PreferencesResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Role?: RoleResolvers<ContextType>;
  SafeString?: GraphQLScalarType;
  Sector?: SectorResolvers<ContextType>;
  SimpleSuccess?: SimpleSuccessResolvers<ContextType>;
  SolutionInterest?: SolutionInterestResolvers<ContextType>;
  Targets?: TargetsResolvers<ContextType>;
  TribeJwt?: TribeJwtResolvers<ContextType>;
  TribeUsageStats?: TribeUsageStatsResolvers<ContextType>;
  UUID?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserName?: GraphQLScalarType;
  UserSolutionInterest?: UserSolutionInterestResolvers<ContextType>;
  Users?: UsersResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  belongsToApprovedCompany?: BelongsToApprovedCompanyDirectiveResolver<any, any, ContextType>;
  hasRole?: HasRoleDirectiveResolver<any, any, ContextType>;
  validateCompanyAccess?: ValidateCompanyAccessDirectiveResolver<any, any, ContextType>;
};
