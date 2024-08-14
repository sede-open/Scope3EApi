import {
  MigrationInterface,
  QueryRunner,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'CORPORATE_EMISSION';
const FILE_TABLE_NAME = 'FILE';
const FILE_COLUMN_NAME = 'verification_file_id';

export class updateCorporateEmissionsTable1613736310693
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: FILE_COLUMN_NAME,
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [FILE_COLUMN_NAME],
        referencedColumnNames: ['id'],
        referencedTableName: FILE_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);

    const verificationFileFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(FILE_COLUMN_NAME) !== -1
    );
    if (verificationFileFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, verificationFileFK);
    }

    await queryRunner.dropColumn(TABLE_NAME, FILE_COLUMN_NAME);
  }
}
