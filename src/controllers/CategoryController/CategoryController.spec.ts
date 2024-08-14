import { Repository } from 'typeorm';
import { CategoryController } from '.';
import { IContext } from '../../apolloContext';
import { CategoryEntity } from '../../entities/Category';
import { supplierEditorUserMock } from '../../mocks/user';

describe('CategoryController', () => {
  describe('findAll', () => {
    const expected: [] = [];
    const find = jest.fn();
    const allocationRepository = ({
      find,
    } as unknown) as Repository<CategoryEntity>;
    find.mockImplementation(() => expected);
    const mockContext = ({
      user: supplierEditorUserMock,
    } as unknown) as IContext;

    const controller = new CategoryController(allocationRepository);

    it('should return all categories in order', async () => {
      const result = await controller.findAll(undefined, mockContext);

      expect(find).toHaveBeenCalledWith({
        order: { order: 'ASC' },
      });
      expect(result).toEqual(expected);
    });
  });
});
