import { In, Repository } from 'typeorm';

import { RoleController } from './';
import { adminRoleMock } from '../../mocks/role';
import { IContext } from '../../apolloContext';
import { RoleEntity } from '../../entities/Role';
import { OrderBy, RoleName } from '../../types';
import {
  supplierEditorUser2Mock,
  supplierEditorUserMock,
} from '../../mocks/user';

describe('RoleController', () => {
  describe('findById()', () => {
    it('should return an admin role', async () => {
      const find = jest.fn();
      const roleRepositoryMock = ({
        find,
      } as unknown) as Repository<RoleEntity>;
      find.mockImplementation(() => [adminRoleMock]);
      const controller = new RoleController(roleRepositoryMock);

      const result = await controller.findById(
        { id: adminRoleMock.id },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        where: { id: adminRoleMock.id },
      });
      expect(result).toEqual(adminRoleMock);
    });
  });

  describe('findAll()', () => {
    it('should return a list of roles', async () => {
      const orderBy = OrderBy.Asc;
      const roles = [adminRoleMock];
      const find = jest.fn();
      const roleRepositoryMock = ({
        find,
      } as unknown) as Repository<RoleEntity>;
      find.mockImplementation(() => roles);

      const controller = new RoleController(roleRepositoryMock);

      const result = await controller.findAll(
        { orderBy },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        order: {
          name: orderBy,
        },
        where: {},
      });
      expect(result).toEqual(roles);
    });

    it('should list roles when roleNames are specified', async () => {
      const orderBy = OrderBy.Asc;
      const roles = [supplierEditorUserMock, supplierEditorUser2Mock];
      const find = jest.fn();
      const roleRepositoryMock = ({
        find,
      } as unknown) as Repository<RoleEntity>;
      find.mockImplementation(() => roles);

      const controller = new RoleController(roleRepositoryMock);

      const result = await controller.findAll(
        {
          orderBy,
          roleNames: [RoleName.SupplierEditor, RoleName.SupplierViewer],
        },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        order: {
          name: orderBy,
        },
        where: {
          name: In([RoleName.SupplierEditor, RoleName.SupplierViewer]),
        },
      });
      expect(result).toEqual(roles);
    });
  });
});
