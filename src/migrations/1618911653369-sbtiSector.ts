import { MigrationInterface, QueryRunner } from 'typeorm';

import { SbtiSystemName } from '../types';

export class sector1618911653369 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "SBTI_SECTOR" ("name", "system_name") VALUES
      ('Air Freight Transportation and Logistics', '${SbtiSystemName.AirFreightTransport}'),
      ('Banks, Diverse Financials, Insurance', '${SbtiSystemName.BanksInsurance}'),
      ('Chemicals', '${SbtiSystemName.Chemicals}'),
      ('Construction and Engineering', '${SbtiSystemName.ConstructionEngineering}'),
      ('Construction Materials', '${SbtiSystemName.ConstructionMaterials}'),
      ('Electrical Equipment and Machinery', '${SbtiSystemName.ElectricalEquipmentMachinery}'),
      ('Forest and Paper Products - Forestry, Timber, Pulp and Paper, Rubber', '${SbtiSystemName.ForestPaperProducts}'),
      ('Ground Transportation - Trucking Transportation', '${SbtiSystemName.GroundTruckTransport}'),
      ('Maritime Transport', '${SbtiSystemName.MaritimeTransport}'),
      ('Oil and Gas', '${SbtiSystemName.OilGas}'),
      ('Professional Services', '${SbtiSystemName.ProfessionalServices}'),
      ('Retailing', '${SbtiSystemName.Retailing}'),
      ('Software and Service', '${SbtiSystemName.SoftwareAndService}'),
      ('Technology Hardware and Equipment', '${SbtiSystemName.TechnologyHardwareEquipment}'),
      ('Trading Companies and Distributors, and Commercial Services and Supplies', '${SbtiSystemName.TradingCompanyCommercialService}'),
      ('Water Utilities', '${SbtiSystemName.WaterUtilities}');
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM SBTI_SECTOR
      WHERE name in ('Software and Service', 'Construction and Engineering', 'Chemicals', 'Air Freight Transportation and Logistics','Ground Transportation - Trucking Transportation',
      'Banks, Diverse Financials, Insurance', 'Professional Services', 'Technology Hardware and Equipment', 'Electrical Equipment and Machinery', 'Oil and Gas',
      'Construction Materials', 'Retailing', 'Water Utilities', 'Trading Companies and Distributors, and Commercial Services and Supplies', 'Maritime Transport', 'Forest and Paper Products - Forestry, Timber, Pulp and Paper, Rubber');
    `);
  }
}
