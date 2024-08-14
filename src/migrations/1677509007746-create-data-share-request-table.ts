import { MigrationInterface, QueryRunner, Table } from 'typeorm';

const DATA_SHARE_REQUEST_TABLE = 'DATA_SHARE_REQUEST';
const FK_COMPANY_ID = `FK_${DATA_SHARE_REQUEST_TABLE}_company_id`;
const FK_TARGET_COMPANY_ID = `FK_${DATA_SHARE_REQUEST_TABLE}_target_company_id`;
const FK_CREATED_BY = `FK_${DATA_SHARE_REQUEST_TABLE}_created_by`;
const UNIQUE_COMPANY_ID_TARGET_COMPANY_ID = `UNIQUE_${DATA_SHARE_REQUEST_TABLE}_company_id_target_company_id`;

export class createDataShareRequestTable1677509007746
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: DATA_SHARE_REQUEST_TABLE,
        columns: [
          {
            name: 'id',
            type: 'uniqueidentifier',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'uuid',
            default: 'newid()',
          },
          {
            name: 'company_id',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'target_company_id',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'created_by',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} ADD CONSTRAINT ${FK_COMPANY_ID} FOREIGN KEY (company_id) REFERENCES COMPANY(id);`
    );

    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} ADD CONSTRAINT ${FK_TARGET_COMPANY_ID} FOREIGN KEY (target_company_id) REFERENCES COMPANY(id);`
    );

    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} ADD CONSTRAINT ${FK_CREATED_BY} FOREIGN KEY (created_by) REFERENCES [USER](id);`
    );

    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} ADD CONSTRAINT ${UNIQUE_COMPANY_ID_TARGET_COMPANY_ID} UNIQUE (company_id, target_company_id);`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} DROP CONSTRAINT ${FK_COMPANY_ID};`
    );
    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} DROP CONSTRAINT ${FK_TARGET_COMPANY_ID};`
    );
    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} DROP CONSTRAINT ${FK_CREATED_BY};`
    );
    await queryRunner.query(
      `ALTER TABLE ${DATA_SHARE_REQUEST_TABLE} DROP CONSTRAINT ${UNIQUE_COMPANY_ID_TARGET_COMPANY_ID};`
    );
    await queryRunner.dropTable(DATA_SHARE_REQUEST_TABLE, true);
  }
}
