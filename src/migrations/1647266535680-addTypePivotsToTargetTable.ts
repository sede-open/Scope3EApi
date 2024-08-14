import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TARGET_TABLE_NAME = 'TARGET';

export class addTypePivotsToTargetTable1647266535680
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(TARGET_TABLE_NAME, 'type', 'scope_type');

    await queryRunner.addColumn(
      TARGET_TABLE_NAME,
      new TableColumn({
        name: 'target_type',
        type: 'varchar(64)',
        isNullable: true,
      })
    );

    await queryRunner.query(
      "UPDATE TARGET SET target_type='ABSOLUTE' WHERE target_type is NULL"
    );

    await queryRunner.changeColumn(
      TARGET_TABLE_NAME,
      new TableColumn({
        name: 'target_type',
        type: 'varchar(64)',
      }),
      new TableColumn({
        name: 'target_type',
        type: 'varchar(64)',
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.renameColumn(TARGET_TABLE_NAME, 'scope_type', 'type');

    await queryRunner.dropColumn(TARGET_TABLE_NAME, 'target_type');
  }
}
