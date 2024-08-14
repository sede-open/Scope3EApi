import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
} from 'typeorm';
import { PreferencesEntity } from '../entities/Preferences';
import { UserEntity } from '../entities/User';

const TABLE_NAME = 'PREFERENCES';
const USER_TABLE_NAME = 'USER';
const USER_COLUMN = 'user_id';

export class createPreferencesTableAndSeed1607446555231
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
            name: USER_COLUMN,
            type: 'uniqueidentifier',
          },
          {
            name: 'hideEmissionsTrendline',
            type: 'bit',
            default: 0,
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
        columnNames: [USER_COLUMN],
        referencedColumnNames: ['id'],
        referencedTableName: USER_TABLE_NAME,
        onDelete: 'CASCADE',
      })
    );

    const preferencesRepo = await queryRunner.manager.getRepository(
      PreferencesEntity
    );

    const users: UserEntity[] = await queryRunner.query('SELECT * FROM [USER]');
    const newPreferencesInserts = users.map(async ({ id }) => {
      const existingUserPreferences = await queryRunner.query(
        `
        SELECT * FROM PREFERENCES
        WHERE user_id = @0
      `,
        [id]
      );

      if (existingUserPreferences.length === 0) {
        const newUserPreferences = new PreferencesEntity();
        newUserPreferences.userId = id;

        await queryRunner.query(
          `
          INSERT INTO PREFERENCES (user_id, hideEmissionsTrendline)
          VALUES (@0, 0);
        `,
          [id]
        );

        return preferencesRepo.insert(newUserPreferences);
      }
      return null;
    });
    await Promise.all(newPreferencesInserts);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable(TABLE_NAME);
    const userFk = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf(USER_COLUMN) !== -1
    );
    if (userFk) {
      await queryRunner.dropForeignKey(TABLE_NAME, userFk);
    }

    await queryRunner.dropTable(TABLE_NAME);
  }
}
