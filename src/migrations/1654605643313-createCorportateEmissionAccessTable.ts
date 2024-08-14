import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

export class createCorportateEmissionAccessTable1654605643313
  implements MigrationInterface {
  TABLE_NAME = 'CORPORATE_EMISSION_ACCESS';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: this.TABLE_NAME,
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
            name: 'emission_id',
            type: 'uniqueidentifier',
          },
          {
            name: 'scope_1_2',
            type: 'bit',
          },
          {
            name: 'scope_3',
            type: 'bit',
          },
          {
            name: 'carbon_offsets',
            type: 'bit',
          },
          {
            name: 'carbon_intensity',
            type: 'bit',
          },
          {
            name: 'public_link',
            type: 'varchar(255)',
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
      'CORPORATE_EMISSION_ACCESS',
      new TableForeignKey({
        columnNames: ['emission_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'CORPORATE_EMISSION',
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(this.TABLE_NAME);
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('emission_id') !== -1
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey(this.TABLE_NAME, foreignKey);
    }

    await queryRunner.dropTable(this.TABLE_NAME);
  }
}
