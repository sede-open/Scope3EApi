import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'EMISSION_ALLOCATION';
const COMPANY_TABLE_NAME = 'COMPANY';
const USER_TABLE_NAME = 'USER';
const CATEGORY_TABLE_NAME = 'GHG_PROTOCOL_CATEGORY';
const CORPORATE_EMISSION_TABLE_NAME = 'CORPORATE_EMISSION';

const SUPPLIER_ID_COLUMN = 'supplier_id';
const CUSTOMER_ID_COLUMN = 'customer_id';
const SUPPLIER_APPROVER_ID_COLUMN = 'supplier_approver_id';
const CUSTOMER_APPROVER_ID_COLUMN = 'customer_approver_id';
const CUSTOMER_EMISSION_ID_COLUMN = 'customer_emission_id';
const SUPPLIER_EMISSION_ID_COLUMN = 'supplier_emission_id';
const CATEGORY_ID_COLUMN = 'category_id';

export class createEmissionAttributionTable1611575812181
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: TABLE_NAME,
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
            name: 'year',
            type: 'integer',
          },
          {
            name: 'type',
            type: 'varchar(7)',
          },
          {
            name: 'status',
            type: 'varchar(20)',
          },
          {
            name: CUSTOMER_ID_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: SUPPLIER_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: SUPPLIER_APPROVER_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: CUSTOMER_APPROVER_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: SUPPLIER_EMISSION_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: CUSTOMER_EMISSION_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: CATEGORY_ID_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: 'emissions',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'allocation_method',
            type: 'varchar(20)',
            isNullable: true,
          },
          {
            name: 'added_to_customer_scope_total',
            type: 'bit',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [SUPPLIER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CUSTOMER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [SUPPLIER_APPROVER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CUSTOMER_APPROVER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [SUPPLIER_EMISSION_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: CORPORATE_EMISSION_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CUSTOMER_EMISSION_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: CORPORATE_EMISSION_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CATEGORY_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: CATEGORY_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const supplierFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(SUPPLIER_ID_COLUMN) !== -1
    );
    if (supplierFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, supplierFK);
    }

    const customerFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CUSTOMER_ID_COLUMN) !== -1
    );
    if (customerFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, customerFK);
    }

    const supplierApproverFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(SUPPLIER_APPROVER_ID_COLUMN) !== -1
    );
    if (supplierApproverFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, supplierApproverFK);
    }

    const customerApproverFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CUSTOMER_APPROVER_ID_COLUMN) !== -1
    );
    if (customerApproverFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, customerApproverFK);
    }

    const supplierEmissionFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(SUPPLIER_EMISSION_ID_COLUMN) !== -1
    );
    if (supplierEmissionFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, supplierEmissionFK);
    }

    const customerEmissionFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CUSTOMER_EMISSION_ID_COLUMN) !== -1
    );
    if (customerEmissionFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, customerEmissionFK);
    }

    const categoryFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CATEGORY_ID_COLUMN) !== -1
    );
    if (categoryFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, categoryFK);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
