import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableColumn,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'COMPANY';
const USER_TABLE_NAME = 'USER';

export class createCompaniesAndSeed1599126928767 implements MigrationInterface {
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
            name: 'name',
            type: 'varchar',
          },
          {
            name: 'location',
            type: 'varchar',
          },
          {
            name: 'business_sector',
            type: 'varchar',
          },
          {
            name: 'sub_sector',
            type: 'varchar',
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
    await queryRunner.addColumn(
      'USER',
      new TableColumn({
        name: 'company_id',
        type: 'uniqueidentifier',
        isNullable: true,
      })
    );

    await queryRunner.createForeignKey(
      'USER',
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'COMPANY',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(USER_TABLE_NAME);

    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('company_id') !== -1
    );

    if (foreignKey) {
      await queryRunner.dropForeignKey(USER_TABLE_NAME, foreignKey);
    }

    await queryRunner.dropColumn(USER_TABLE_NAME, 'company_id');
    await queryRunner.dropTable(TABLE_NAME);
  }
}
