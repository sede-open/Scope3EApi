import { MigrationInterface, QueryRunner } from 'typeorm';
import { TargetPrivacyType } from '../types';

export class updateTarget1653382630102 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
            ALTER TABLE dbo.TARGET
            ADD privacy_type varchar(50) null
            CONSTRAINT check_privacy_type 
            CHECK (privacy_type IN('${TargetPrivacyType.Public}', '${TargetPrivacyType.ScienceBasedInitiative}', '${TargetPrivacyType.Private}'))
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    queryRunner.query(`
            ALTER TABLE dbo.TARGET 
            DROP CONSTRAINT check_privacy_type
        
        `);
    queryRunner.query(`
        ALTER TABLE dbo.TARGET
        DROP COLUMN privacy_type
        `);
  }
}
