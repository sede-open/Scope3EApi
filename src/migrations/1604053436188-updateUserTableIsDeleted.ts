import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

const TABLE_NAME = 'USER';
const DELETED_COLUMN_NAME = 'is_deleted';

export class updateUserTableIsDeleted1604053436188
  implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      TABLE_NAME,
      new TableColumn({
        name: DELETED_COLUMN_NAME,
        type: 'bit',
        isNullable: false,
        default: 0,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn(TABLE_NAME, DELETED_COLUMN_NAME);
  }
}
