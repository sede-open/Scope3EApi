import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const CARBON_INTENSITY_TARGET_TABLE_NAME = 'CARBON_INTENSITY_TARGET';
const CARBON_INTENSITY_TABLE_NAME = 'CARBON_INTENSITY';
const TARGET_TABLE_NAME = 'TARGET';
const CARBON_INTENSITY_ID_COLUMN = 'carbon_intensity_id';
const TARGET_ID_COLUMN = 'target_id';

export class addCarbonIntensityTargetsTable1647269382887
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: CARBON_INTENSITY_TARGET_TABLE_NAME,
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
            name: 'carbon_intensity_id',
            type: 'uniqueidentifier',
            isNullable: false,
          },
          {
            name: 'target_id',
            type: 'uniqueidentifier',
            isNullable: false,
          },
        ],
      }),
      true
    );

    await queryRunner.createForeignKey(
      CARBON_INTENSITY_TARGET_TABLE_NAME,
      new TableForeignKey({
        columnNames: [CARBON_INTENSITY_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: CARBON_INTENSITY_TABLE_NAME,
      })
    );

    await queryRunner.createForeignKey(
      CARBON_INTENSITY_TARGET_TABLE_NAME,
      new TableForeignKey({
        columnNames: [TARGET_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: TARGET_TABLE_NAME,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(
      CARBON_INTENSITY_TARGET_TABLE_NAME
    );

    const targetIdFk = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(TARGET_ID_COLUMN) !== -1
    );

    if (targetIdFk) {
      await queryRunner.dropForeignKey(
        CARBON_INTENSITY_TARGET_TABLE_NAME,
        targetIdFk
      );
    }

    const carbonIntensityIdFk = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(CARBON_INTENSITY_ID_COLUMN) !== -1
    );

    if (carbonIntensityIdFk) {
      await queryRunner.dropForeignKey(
        CARBON_INTENSITY_TARGET_TABLE_NAME,
        carbonIntensityIdFk
      );
    }

    await queryRunner.dropTable(CARBON_INTENSITY_TARGET_TABLE_NAME);
  }
}
