import { MigrationInterface, QueryRunner } from 'typeorm';
import { CategoriesSystemName } from '../types';

export class createCategoriesSystemName1623144719042
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.PurchasedGoodsAndServices}'
    WHERE name = 'Cat. 1 - Purchased goods and services';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.CapitalGoods}'
    WHERE name = 'Cat. 2 - Capital goods';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET name = 'Cat. 3 - Fuel and energy related activities', system_name = '${CategoriesSystemName.FuelAndEnergyRelatedActivities}'
    WHERE name = 'Cat. 3 - Fuel- and energy-related activities';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET name = 'Cat. 4 - Upstream transportation and distribution', system_name = '${CategoriesSystemName.UpstreamTransportationAndDistribution}'
    WHERE name = 'Cat. 4 - Upstream transportation and distribution';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.WasteGeneratedInOperations}'
    WHERE name = 'Cat. 5 - Waste generated in operations';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.BusinessTravel}'
    WHERE name = 'Cat. 6 - Business travel';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.EmployeeCommuting}'
    WHERE name = 'Cat. 7 - Employee commuting';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.UpstreamLeasedAssets}'
    WHERE name = 'Cat. 8 - Upstream leased assets';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.DownstreamTransportationAndDistribution}'
    WHERE name = 'Cat. 9 - Downstream transportation and distribution';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.ProcessingOfSoldProducts}'
    WHERE name = 'Cat. 10 - Processing of sold products';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.UseOfSoldProducts}'
    WHERE name = 'Cat. 11 - Use of sold products';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET name = 'Cat. 12 - End of life treatment of sold products', system_name = '${CategoriesSystemName.EndOfLifeTreatmentOfSoldProducts}'
    WHERE name = 'Cat. 12 - End-of-life treatment of sold products';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.DownstreamLeasedAssets}'
    WHERE name = 'Cat. 13 - Downstream leased assets';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.Franchises}'
    WHERE name = 'Cat. 14 - Franchises';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET system_name = '${CategoriesSystemName.Investments}'
    WHERE name = 'Cat. 15 - Investments';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET name = 'Cat. 3 - Fuel- and energy-related activities'
    WHERE name = 'Fuel and energy related activities';
    `);

    await queryRunner.query(`
    UPDATE GHG_PROTOCOL_CATEGORY
    SET name = 'Cat. 12 - End-of-life treatment of sold products'
    WHERE name = 'Cat. 12 - End of life treatment of sold products';
    `);
  }
}
