import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'COMPANY_SBTI_SECTOR';
const COMPANY_TABLE_NAME = 'COMPANY';
const COMPANY_COLUMN = 'company_id';
const SBTI_TABLE_NAME = 'SBTI_SECTOR';
const SBTI_SECTOR_COLUMN = 'sbti_sector_id';
const CREATED_BY_COLUMN = 'created_by';
const UPDATED_BY_COLUMN = 'updated_by';
const USER_TABLE_NAME = 'USER';

export class createSCOMPANYBTISectorTable1618806619039
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
            name: COMPANY_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: SBTI_SECTOR_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'type',
            type: 'varchar',
          },
          {
            name: CREATED_BY_COLUMN,
            type: 'uniqueidentifier',
            isNullable: true,
          },
          {
            name: UPDATED_BY_COLUMN,
            type: 'uniqueidentifier',
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
        columnNames: [COMPANY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: COMPANY_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [SBTI_SECTOR_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: SBTI_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CREATED_BY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [UPDATED_BY_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const companyFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(COMPANY_COLUMN) !== -1
    );
    if (companyFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, companyFK);
    }
    const sectorFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(SBTI_SECTOR_COLUMN) !== -1
    );
    if (sectorFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, sectorFK);
    }
    await queryRunner.dropTable(TABLE_NAME);
  }
}
