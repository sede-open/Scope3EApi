import { Request, Response } from 'express';
import { HttpException } from '../utils/errors';
import { handleErrors } from './handleErrors';

describe('handleErrors', () => {
  it('should send correct error status and message', () => {
    const status = 401;
    const message = 'Some message';
    const error = new HttpException(status, message);
    const req = ({} as unknown) as Request;
    const resStatus = jest.fn();
    const resSend = jest.fn();
    const res = ({
      status: resStatus,
      send: resSend,
    } as unknown) as Response;
    resStatus.mockImplementation(() => res);
    const next = jest.fn();

    handleErrors(error, req, res, next);

    expect(resStatus).toHaveBeenCalledWith(status);
    expect(resSend).toHaveBeenCalledWith({ status, message });
  });
});
