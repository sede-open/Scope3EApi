import { EntityManager, FindConditions, In, Repository } from 'typeorm';
import { OrderBy, Role, RoleName } from '../../types';
import { ControllerFunctionAsync } from '../types';
import { RoleEntity } from '../../entities/Role';
import { getRepository } from '../utils';

export class RoleController {
  constructor(private roleRepository: Repository<RoleEntity>) {}

  private getRoleRepository = (entityManager?: EntityManager) => {
    return getRepository(RoleEntity, this.roleRepository, entityManager);
  };

  findAll: ControllerFunctionAsync<
    {
      orderBy?: OrderBy;
      roleNames?: RoleName[];
    },
    Role[]
  > = async ({ roleNames, orderBy }, _, entityManager) => {
    const roleRepository = this.getRoleRepository(entityManager);

    const whereOptions: FindConditions<RoleEntity> = {};

    if (roleNames && roleNames.length > 0) {
      whereOptions.name = In(roleNames);
    }

    const result = await roleRepository.find({
      order: {
        name: orderBy ?? 'DESC',
      },
      where: whereOptions,
    });

    return result;
  };

  findById: ControllerFunctionAsync<
    {
      id: string;
    },
    RoleEntity | undefined
  > = async (args, _, entityManager) => {
    const roleRepository = this.getRoleRepository(entityManager);
    const [role] = await roleRepository.find({ where: { id: args.id } });
    return role;
  };

  findByName: ControllerFunctionAsync<
    {
      name: RoleName;
    },
    RoleEntity | undefined
  > = async (args, _, entityManager) => {
    const roleRepository = this.getRoleRepository(entityManager);

    const [role] = await roleRepository.find({
      where: { name: args.name },
    });

    return role;
  };

  findByNames: ControllerFunctionAsync<
    {
      names: RoleName[];
    },
    RoleEntity[]
  > = async (args, _, entityManager) => {
    const roleRepository = this.getRoleRepository(entityManager);

    const roles = await roleRepository.find({
      where: {
        name: In(args.names),
      },
    });

    return roles;
  };
}
