import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'COMPANY';
const USER_TABLE_NAME = 'USER';
const COUNTRY_ISO_COLUMN_NAME = 'dnb_country_iso_code';
const REVIEWER_COLUMN_NAME = 'reviewed_by';
const REVIEWED_DATE_COLUMN_NAME = 'reviewed_at';
const UPDATER_COLUMN_NAME = 'updated_by';
const CREATOR_COLUMN_NAME = 'created_by';
const COUNTRY_COLUMN_NAME = 'dnb_country_name';
const OLD_COUNTRY_COLUMN_NAME = 'dnb_country';
const REGION_COLUMN_NAME = 'dnb_region';
const HEADCOUNT_COLUMN_NAME = 'dnb_headcount';

export class updateCompanyTable1628688665884 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: UPDATER_COLUMN_NAME,
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: CREATOR_COLUMN_NAME,
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: REVIEWER_COLUMN_NAME,
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: REVIEWED_DATE_COLUMN_NAME,
        type: 'datetime',
        isNullable: true,
      })
    );
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: COUNTRY_ISO_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      OLD_COUNTRY_COLUMN_NAME,
      new TableColumn({
        name: COUNTRY_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );
    await queryRunner.changeColumn(
      TABLE_NAME,
      REGION_COLUMN_NAME,
      new TableColumn({
        name: REGION_COLUMN_NAME,
        type: 'nvarchar(max)',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [REVIEWER_COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [UPDATER_COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [CREATOR_COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
      })
    );

    await queryRunner.dropColumn(TABLE_NAME, HEADCOUNT_COLUMN_NAME);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);

    const createdByFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CREATOR_COLUMN_NAME) !== -1
    );
    if (createdByFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, createdByFK);
    }

    const updatedByFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(UPDATER_COLUMN_NAME) !== -1
    );
    if (updatedByFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, updatedByFK);
    }

    const reviewedByFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(REVIEWER_COLUMN_NAME) !== -1
    );
    if (reviewedByFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, reviewedByFK);
    }

    await queryRunner.dropColumn(TABLE_NAME, CREATOR_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, COUNTRY_ISO_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, UPDATER_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, REVIEWER_COLUMN_NAME);

    await queryRunner.dropColumn(TABLE_NAME, REVIEWED_DATE_COLUMN_NAME);

    await queryRunner.changeColumn(
      TABLE_NAME,
      COUNTRY_COLUMN_NAME,
      new TableColumn({
        name: OLD_COUNTRY_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );

    await queryRunner.changeColumn(
      TABLE_NAME,
      REGION_COLUMN_NAME,
      new TableColumn({
        name: REGION_COLUMN_NAME,
        type: 'varchar(255)',
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: HEADCOUNT_COLUMN_NAME,
        type: 'integer',
        isNullable: true,
      })
    );
  }
}
