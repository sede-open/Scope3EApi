import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'COMPANY_RELATIONSHIP';
const COMPANY_TABLE_NAME = 'COMPANY';
const USER_TABLE_NAME = 'USER';
const SUPPLIER_ID_COLUMN = 'supplier_id';
const CUSTOMER_ID_COLUMN = 'customer_id';
const SUPPLIER_APPROVER_ID_COLUMN = 'supplier_approver_id';
const CUSTOMER_APPROVER_ID_COLUMN = 'customer_approver_id';

export class createCompanyRelationshipTable1610036136562
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
            name: SUPPLIER_ID_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: CUSTOMER_ID_COLUMN,
            type: 'uniqueidentifier',
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
            name: 'invite_type',
            type: 'varchar(10)',
          },
          {
            name: 'status',
            type: 'varchar(50)',
          },
          {
            name: 'note',
            type: 'varchar(max)',
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
      (fk) => fk.columnNames.indexOf(SUPPLIER_APPROVER_ID_COLUMN) !== -1
    );
    if (customerApproverFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, customerApproverFK);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
