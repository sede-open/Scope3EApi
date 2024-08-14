import { uniqBy } from 'lodash';
import { EntityRepository, In, Repository } from 'typeorm';
import userRoleConfig from '../access/userRoleConfig';
import { RoleEntity } from '../entities/Role';
import { UserEntity } from '../entities/User';
import { RoleName } from '../types';

@EntityRepository(RoleEntity)
export class RoleRepository extends Repository<RoleEntity> {
  async getRelation<T>(user: UserEntity, relationKey: string): Promise<T[]> {
    return this.createQueryBuilder()
      .relation(UserEntity, relationKey)
      .of(user)
      .loadMany();
  }

  private async findRoleEntitiesToCreateForUser(
    roleName: RoleName,
    user: UserEntity
  ) {
    if (!user.roles) {
      user.roles = await this.getRelation<RoleEntity>(user, 'roles');
    }
    const rolesToGrant = userRoleConfig[roleName].assumesAccessTo;

    const userRoles = user.roles.map((role) => role.name);

    const missingRoles = rolesToGrant.filter(
      (roleName) => !userRoles.includes(roleName)
    );

    return missingRoles;
  }

  private async findRoleEntitiesToDeleteForUser(
    roleName: RoleName,
    user: UserEntity
  ) {
    if (!user.roles) {
      user.roles = await this.getRelation<RoleEntity>(user, 'roles');
    }
    const rolesToRevoke = userRoleConfig[roleName].restrictsAccessTo;

    const userRoles = user.roles.map((role) => role.name);

    const excessRoles = rolesToRevoke.filter((roleName) =>
      userRoles.includes(roleName)
    );

    return excessRoles;
  }

  async findNewRoleSet(
    roleName: RoleName,
    user: UserEntity
  ): Promise<RoleEntity[]> {
    if (!user.roles) {
      user.roles = await this.getRelation<RoleEntity>(user, 'roles');
    }

    const [roleTypesToCreate, roleTypesToRevoke] = await Promise.all([
      this.findRoleEntitiesToCreateForUser(roleName, user),
      this.findRoleEntitiesToDeleteForUser(roleName, user),
    ]);

    const rolesToCreate =
      roleTypesToCreate.length > 0
        ? await this.find({
            where: { name: In(roleTypesToCreate) },
          })
        : [];

    return uniqBy([...user.roles, ...rolesToCreate], 'name').filter(
      (role) => !roleTypesToRevoke.includes(role.name)
    );
  }

  async findRolesByName(roleNames: RoleName[]) {
    return this.find({
      where: {
        name: In(roleNames),
      },
    });
  }

  async findAssumedRolesForRoleName(roleName: RoleName): Promise<RoleEntity[]> {
    const roleNames = userRoleConfig[roleName].assumesAccessTo;

    if (!roleNames.length) {
      return [];
    }

    return this.findRolesByName(roleNames);
  }
}
