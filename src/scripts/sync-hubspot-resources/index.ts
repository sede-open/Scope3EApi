import { getOrCreateDBConnection } from '../../dbConnection';
import { CompanyEntity } from '../../entities/Company';
import { TargetRepository } from '../../repositories/TargetRepository';
import { CorporateEmissionEntity } from '../../entities/CorporateEmission';
import { UserRepository } from '../../repositories/UserRepository';
import { HubspotResources } from './HubspotResources';
import { CompanyRelationshipEntity } from '../../entities/CompanyRelationship';
import { EmissionAllocationEntity } from '../../entities/EmissionAllocation';

async function main() {
  const connection = await getOrCreateDBConnection();

  const hubspotResources = new HubspotResources(
    connection,
    connection.getRepository(CompanyEntity),
    connection.getCustomRepository(UserRepository),
    connection.getCustomRepository(TargetRepository),
    connection.getRepository(CorporateEmissionEntity),
    connection.getRepository(CompanyRelationshipEntity),
    connection.getRepository(EmissionAllocationEntity)
  );

  await hubspotResources.run();
}

main();
