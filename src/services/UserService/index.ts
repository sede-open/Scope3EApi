import { UserEntity } from '../../entities/User';
import { UserRepository } from '../../repositories/UserRepository';
import { RoleName } from '../../types';
import { BaseService } from '../BaseService';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { IUser } from './types';

export class UserService extends BaseService<UserEntity, IUser> {
  constructor(databaseService: DatabaseService) {
    super(databaseService, UserRepository);
  }

  async findCompanyEditors(companyId: string) {
    const userRepository = await this.databaseService.getRepository(
      UserRepository
    );

    return userRepository.companyUsers([companyId], [RoleName.SupplierEditor]);
  }
}
