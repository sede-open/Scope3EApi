import { AkamaiClient } from './clients/AkamaiClient';
import { AzureBlobClient } from './clients/AzureBlobClient';
import { DnBClient } from './clients/DnBClient';
import { HubspotClient } from './clients/HubspotClient';
import { HubspotEmailClient } from './clients/HubspotEmailClient';
import { mulesoft, MulesoftEmailClient } from './clients/MulesoftEmailClient';
import { NotificationClient } from './clients/NotificationClient';
import { getConfig } from './config';
import { AuditController } from './controllers/AuditController';
import { CarbonIntensityController } from './controllers/CarbonIntensityController';
import { CategoryController } from './controllers/CategoryController';
import { CompanyController } from './controllers/CompanyController';
import { CompanyPrivacyController } from './controllers/CompanyPrivacyController';
import { CompanyRelationshipController } from './controllers/CompanyRelationshipController';
import { CompanyRelationshipRecommendationController } from './controllers/CompanyRelationshipRecommendations';
import { CompanySectorController } from './controllers/CompanySectorController';
import { ContactController } from './controllers/ContactController';
import { CorporateEmissionController } from './controllers/CorporateEmissionController';
import { EmissionAllocationController } from './controllers/EmissionAllocationController';
import { FileController } from './controllers/FileController';
import { InviteCompanyController } from './controllers/InviteCompanyController';
import { PreferencesController } from './controllers/PreferencesController';
import { RoleController } from './controllers/RoleController';
import { SectorController } from './controllers/SectorController';
import { SolutionInterestsController } from './controllers/SolutionInterestsController';
import { TargetController } from './controllers/TargetController';
import { TribeController } from './controllers/TribeController';
import { UserController } from './controllers/UserController';
import { UserSolutionInterestsController } from './controllers/UserSolutionInterestsController';
import { getOrCreateDBConnection } from './dbConnection';
import { AuditEntity } from './entities/Audit';
import { CategoryEntity } from './entities/Category';
import { CompanyEntity } from './entities/Company';
import { CompanyRelationshipEntity } from './entities/CompanyRelationship';
import { CompanySectorEntity } from './entities/CompanySector';
import { CorporateEmissionEntity } from './entities/CorporateEmission';
import { EmissionAllocationEntity } from './entities/EmissionAllocation';
import { FileEntity } from './entities/File';
import { PreferencesEntity } from './entities/Preferences';
import { SectorEntity } from './entities/Sector';
import { SolutionInterestsEntity } from './entities/SolutionInterests';
import { UserSolutionInterestsEntity } from './entities/UserSolutionInterests';
import { carbonIntensitiesLoader } from './loaders/carbonIntensityLoader';
import { categoryLoader } from './loaders/categoryLoader';
import { companyLoader } from './loaders/companyLoader';
import { companySectorsLoader } from './loaders/companySectorsLoader';
import { companyUsersLoader } from './loaders/companyUsersLoader';
import { emissionPrivacyStatusLoader } from './loaders/CorporateEmissionLoader/emissionPrivacyStatusLoader';
import { fileLoader } from './loaders/fileLoader';
import { roleLoader } from './loaders/roleLoader';
import { sectorLoader } from './loaders/sectorLoader';
import { solutionInterestsLoader } from './loaders/solutionInterestsLoader';
import { ambitionPrivacyStatusLoader } from './loaders/TargetLoader/ambitionPrivacyStatusLoader';
import { userLoader } from './loaders/userLoader';
import { userRoleLoader } from './loaders/userRoleLoader';
import { CarbonIntensityRepository } from './repositories/CarbonIntensityRepository';
import { RoleRepository } from './repositories/RoleRepository';
import { UserRepository } from './repositories/UserRepository';
import { DnBService } from './services/DnBService';
import { JWTService } from './services/JWTService';
import {
  getAzureBlobClient,
  getCompanyPrivacyController,
  getCompanyRelationshipController,
  getCompanyRelationshipRecommendationService,
  getCompanyService,
  getCorporateEmissionController,
  getDnBService,
  getTargetController,
  getUserService,
} from './utils/apolloContext';

export interface IStatelessContext {
  controllers: {
    user: UserController;
    role: RoleController;
    audit: AuditController;
    company: CompanyController;
    corporateEmission: CorporateEmissionController;
    target: TargetController;
    contact: ContactController;
    inviteCompany: InviteCompanyController;
    preferences: PreferencesController;
    companyRelationship: CompanyRelationshipController;
    emissionAllocation: EmissionAllocationController;
    category: CategoryController;
    file: FileController;
    sector: SectorController;
    companySector: CompanySectorController;
    userSolutionInterests: UserSolutionInterestsController;
    solutionInterests: SolutionInterestsController;
    carbonIntensity: CarbonIntensityController;
    tribe: TribeController;
    companyPrivacy: CompanyPrivacyController;
    companyRelationshipRecommendations: CompanyRelationshipRecommendationController;
  };
  clients: {
    akamai: AkamaiClient;
    mulesoft: MulesoftEmailClient;
    azureBlob: AzureBlobClient;
    dnb: DnBClient;
    notification: NotificationClient;
    hubspotEmail: HubspotEmailClient;
  };
  services: {
    jwt: JWTService;
    dnb: DnBService;
  };
  loaders: {
    company: ReturnType<typeof companyLoader>;
    sector: ReturnType<typeof sectorLoader>;
    solutionInterests: ReturnType<typeof solutionInterestsLoader>;
    user: ReturnType<typeof userLoader>;
    role: ReturnType<typeof roleLoader>;
    userRoles: ReturnType<typeof userRoleLoader>;
    category: ReturnType<typeof categoryLoader>;
    file: ReturnType<typeof fileLoader>;
    companyUsers: ReturnType<typeof companyUsersLoader>;
    companySectors: ReturnType<typeof companySectorsLoader>;
    carbonIntensities: ReturnType<typeof carbonIntensitiesLoader>;
    emissionPrivacyStatus: ReturnType<typeof emissionPrivacyStatusLoader>;
    ambitionPrivacyStatus: ReturnType<typeof ambitionPrivacyStatusLoader>;
  };
}

export const createStatelessContext = async () => {
  const {
    hubspotEmailToken,
    dnb: { key: dnbKey, secret: dnbSecret },
    sAndP: { token: sAndPToken },
  } = getConfig();
  const connection = await getOrCreateDBConnection();
  const akamai = new AkamaiClient(
    process.env.AKAMAI_BASE_URL ?? '',
    process.env.AKAMAI_CLIENT_ID ?? '',
    process.env.AKAMAI_SECRET ?? ''
  );
  const dnb = new DnBClient(dnbKey, dnbSecret);

  const notification = new NotificationClient();
  const jwt = new JWTService();

  const hubspotClient = new HubspotClient(hubspotEmailToken);
  const hubspotEmail = new HubspotEmailClient(hubspotClient);

  return {
    controllers: {
      companyPrivacy: getCompanyPrivacyController(),
      user: new UserController(
        connection.getCustomRepository(UserRepository),
        connection.getCustomRepository(RoleRepository),
        connection.getRepository(CompanyEntity),
        connection.getRepository(PreferencesEntity),
        getUserService()
      ),
      role: new RoleController(connection.getCustomRepository(RoleRepository)),
      audit: new AuditController(connection.getRepository(AuditEntity)),
      company: new CompanyController(
        connection.getRepository(CompanyEntity),
        connection.getCustomRepository(UserRepository),
        getCompanyService()
      ),
      corporateEmission: getCorporateEmissionController(connection),
      target: getTargetController(connection),
      contact: new ContactController(),
      inviteCompany: new InviteCompanyController(),
      preferences: new PreferencesController(
        connection.getRepository(PreferencesEntity)
      ),
      companyRelationship: getCompanyRelationshipController(
        connection,
        sAndPToken
      ),
      emissionAllocation: new EmissionAllocationController(
        connection.getRepository(EmissionAllocationEntity),
        connection.getRepository(CompanyRelationshipEntity),
        connection.getRepository(CorporateEmissionEntity)
      ),
      category: new CategoryController(
        connection.getRepository(CategoryEntity)
      ),
      file: new FileController(connection.getRepository(FileEntity)),
      sector: new SectorController(connection.getRepository(SectorEntity)),
      companySector: new CompanySectorController(
        connection.getRepository(CompanySectorEntity)
      ),
      userSolutionInterests: new UserSolutionInterestsController(
        connection.getRepository(UserSolutionInterestsEntity)
      ),
      solutionInterests: new SolutionInterestsController(
        connection.getRepository(SolutionInterestsEntity)
      ),
      carbonIntensity: new CarbonIntensityController(
        connection.getCustomRepository(CarbonIntensityRepository)
      ),
      tribe: new TribeController(),
      companyRelationshipRecommendations: getCompanyRelationshipRecommendationService(
        connection,
        sAndPToken
      ),
    },
    clients: {
      akamai,
      mulesoft,
      azureBlob: getAzureBlobClient(),
      dnb,
      notification,
      hubspotEmail,
    },
    services: {
      jwt,
      dnb: getDnBService(dnb),
    },
    loaders: {
      company: companyLoader(),
      sector: sectorLoader(),
      solutionInterests: solutionInterestsLoader(),
      user: userLoader(),
      role: roleLoader(),
      userRoles: userRoleLoader(),
      category: categoryLoader(),
      file: fileLoader(),
      companyUsers: companyUsersLoader(),
      companySectors: companySectorsLoader(),
      carbonIntensities: carbonIntensitiesLoader(),
      emissionPrivacyStatus: emissionPrivacyStatusLoader(),
      ambitionPrivacyStatus: ambitionPrivacyStatusLoader(),
    },
  };
};
