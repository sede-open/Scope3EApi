import { Request, Response } from 'express';
import { RoleName } from '../types';
import { UnauthorisedError } from '../utils/errors';
import { hasRole } from './hasRole';

describe('hasRole', () => {
  it('should allow user with the role to pass through', () => {
    const user = {
      roles: [
        { name: RoleName.SupplierEditor },
        { name: RoleName.SupplierViewer },
      ],
    };
    const req = ({ user } as unknown) as Request;
    const res = (jest.fn() as unknown) as Response;
    const next = jest.fn();

    hasRole([RoleName.SupplierEditor])(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    const [[nextParams]] = next.mock.calls;
    expect(nextParams).toBeUndefined();
  });

  it('should call next() with an error if the user does not have a permitted role', () => {
    const user = {
      roles: [{ name: RoleName.SupplierViewer }],
    };
    const req = ({ user } as unknown) as Request;
    const res = (jest.fn() as unknown) as Response;
    const next = jest.fn();

    hasRole([RoleName.SupplierEditor])(req, res, next);

    expect(next).toHaveBeenCalledWith(new UnauthorisedError());
  });
});
