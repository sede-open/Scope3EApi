import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';

const TABLE_NAME = 'USER_SOLUTION_INTERESTS';
const USER_ID_COLUMN = 'user_id';
const SOLUTION_INTEREST_ID_COLUMN = 'solution_interest_id';
const USER_TABLE_NAME = 'USER';
const SOLUTION_INTEREST_NAME = 'SOLUTION_INTERESTS';

export class createUserSolutionInterestsTable1619614680090
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
            name: USER_ID_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: SOLUTION_INTEREST_ID_COLUMN,
            type: 'uniqueidentifier',
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
        columnNames: [USER_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      TABLE_NAME,
      new TableForeignKey({
        columnNames: [SOLUTION_INTEREST_ID_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: SOLUTION_INTEREST_NAME,
        onDelete: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const userIdFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(USER_ID_COLUMN) !== -1
    );
    if (userIdFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, userIdFK);
    }
    const solutionInterestIdFK = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(SOLUTION_INTEREST_ID_COLUMN) !== -1
    );
    if (solutionInterestIdFK) {
      await queryRunner.dropForeignKey(TABLE_NAME, solutionInterestIdFK);
    }
    await queryRunner.dropTable(TABLE_NAME);
  }
}
