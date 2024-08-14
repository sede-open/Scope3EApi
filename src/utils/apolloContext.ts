import { Connection } from 'typeorm';
import { AzureBlobClient } from '../clients/AzureBlobClient';
import { DnBClient } from '../clients/DnBClient';
import { hubspotEmail } from '../clients/HubspotEmailClient';
import { SAndPClient } from '../clients/SAndPClient';
import { getConfig } from '../config';
import { CompanyPrivacyController } from '../controllers/CompanyPrivacyController';
import { CompanyRelationshipController } from '../controllers/CompanyRelationshipController';
import { CompanyRelationshipRecommendationController } from '../controllers/CompanyRelationshipRecommendations';
import { CorporateEmissionController } from '../controllers/CorporateEmissionController';
import { TargetController } from '../controllers/TargetController';
import { CompanyEntity } from '../entities/Company';
import { CorporateEmissionEntity } from '../entities/CorporateEmission';
import { CompanyRelationshipRecommendationRepository } from '../repositories/CompanyRelationshipRecommendationRepository';
import { CompanyRelationshipRepository } from '../repositories/CompanyRelationshipRepository';
import { CorporateEmissionAccessRepository } from '../repositories/CorporateEmissionAccessRepository';
import { TargetRepository } from '../repositories/TargetRepository';
import { AuditService } from '../services/AuditService';
import { CarbonIntensityService } from '../services/CarbonIntensityService';
import { CompanyPrivacyService } from '../services/CompanyPrivacyService';
import { CompanyQuickConnectService } from '../services/CompanyQuickConnectService';
import { CompanyRelationshipService } from '../services/CompanyRelationshipService';
import { CompanySectorService } from '../services/CompanySectorService';
import { CompanyService } from '../services/CompanyService';
import { CorporateEmissionAccessService } from '../services/CorporateEmissionAccessService';
import { CorporateEmissionService } from '../services/CorporateEmissionService';
import { DatabaseService } from '../services/DatabaseService/DatabaseService';
import { DnBService } from '../services/DnBService';
import { FileService } from '../services/FileService';
import { TargetService } from '../services/TargetService';
import { UserService } from '../services/UserService';

export const getCompanyPrivacyService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CompanyPrivacyService(
    databaseService,
    getCompanyRelationshipService(databaseService),
    getUserService(databaseService),
    getAuditService(databaseService),
    hubspotEmail
  );
};

export const getTargetService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new TargetService(
    databaseService,
    getCompanyPrivacyService(databaseService),
    getCorporateEmissionAccessService(databaseService)
  );
};

export const getCompanyRelationshipService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CompanyRelationshipService(
    databaseService,
    CompanyRelationshipRepository
  );
};

export const getUserService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new UserService(databaseService);
};

export const getDnBService = (
  dnbClient: DnBClient,
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new DnBService(databaseService, dnbClient);
};

export const getQuickConnectService = (
  connection: Connection,
  sAndPToken: string,
  databaseService: DatabaseService = new DatabaseService()
): CompanyQuickConnectService => {
  const sAndPClient = new SAndPClient(sAndPToken);
  const companyRelationshipRecommendationRepository = connection.getCustomRepository(
    CompanyRelationshipRecommendationRepository
  );
  return new CompanyQuickConnectService(
    databaseService,
    sAndPClient,
    companyRelationshipRecommendationRepository
  );
};

export const getCompanySectorService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CompanySectorService(databaseService);
};

export const getCompanyService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CompanyService(
    databaseService,
    getCompanySectorService(databaseService),
    getCarbonIntensityService(databaseService),
    getTargetService(databaseService),
    getCompanyRelationshipService(databaseService),
    getCompanyPrivacyService(databaseService)
  );
};

export const getCompanyPrivacyController = () => {
  const service = getCompanyPrivacyService();
  return new CompanyPrivacyController(service);
};

export const getCompanyRelationshipController = (
  connection: Connection,
  sAndPToken: string
) => {
  const databaseService = new DatabaseService();

  return new CompanyRelationshipController(
    databaseService,
    connection.getCustomRepository(CompanyRelationshipRepository),
    connection.getRepository(CompanyEntity),
    getCompanyRelationshipService(databaseService),
    getQuickConnectService(connection, sAndPToken, databaseService)
  );
};

export const getTargetController = (connection: Connection) => {
  const databaseService = new DatabaseService();

  return new TargetController(
    connection.getCustomRepository(TargetRepository),
    getCompanyPrivacyService(databaseService),
    getTargetService(databaseService)
  );
};

export const getCorporateEmissionController = (connection: Connection) => {
  const databaseService = new DatabaseService();
  return new CorporateEmissionController(
    connection.getRepository(CorporateEmissionEntity),
    connection.getCustomRepository(CorporateEmissionAccessRepository),
    getCorporateEmissionService(databaseService),
    getCorporateEmissionAccessService(databaseService),
    getCarbonIntensityService(databaseService),
    databaseService
  );
};

export const getCorporateEmissionService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CorporateEmissionService(
    databaseService,
    getAuditService(databaseService),
    getCarbonIntensityService(databaseService),
    getFileService(databaseService),
    getCompanyPrivacyService(databaseService)
  );
};

export const getAuditService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new AuditService(databaseService);
};

export const getCorporateEmissionAccessService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CorporateEmissionAccessService(databaseService, getAuditService());
};

export const getDnbClient = () => {
  const { dnb } = getConfig();
  return new DnBClient(dnb.key, dnb.secret);
};

export const getCarbonIntensityService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CarbonIntensityService(
    databaseService,
    getDnBService(getDnbClient(), databaseService)
  );
};

export const getAzureBlobClient = () => {
  return new AzureBlobClient(getConfig().azure.storageConnectionString);
};

export const getFileService = (
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new FileService(databaseService, getAzureBlobClient());
};

export const getCompanyRelationshipRecommendationService = (
  connection: Connection,
  sAndPToken: string,
  databaseService: DatabaseService = new DatabaseService()
) => {
  return new CompanyRelationshipRecommendationController(
    getQuickConnectService(connection, sAndPToken, databaseService)
  );
};
