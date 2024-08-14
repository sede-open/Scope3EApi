import { ApolloError } from 'apollo-server-express';

export const AKAMAI_USER_EXISTS_ERROR_NAME = 'AkamaiUserAlreadyExistsError';

/*
 * GraphQL Errors
 */

export class AccessDeniedError extends ApolloError {
  constructor() {
    super('You do not have access', 'ACCESS_DENIED');
    Object.defineProperty(this, 'name', { value: 'AccessDeniedError' });
  }
}

export class AkamaiRegistrationError extends ApolloError {
  constructor(message: string, requestId?: string) {
    super(
      `Unable to register user (Akamai request ID: ${requestId}): ${message}`
    );
    Object.defineProperty(this, 'name', {
      value: 'AkamaiRegistrationError',
    });
  }
}

export class AkamaiUserAlreadyExistsError extends ApolloError {
  constructor(requestId: string) {
    super(
      `Unable to register user (Akamai request ID: ${requestId}): User already exists in Akamai`
    );
    Object.defineProperty(this, 'name', {
      value: AKAMAI_USER_EXISTS_ERROR_NAME,
    });
  }
}

/*
 * REST Errors
 */

export class HttpException extends Error {
  status: number;
  message: string;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.message = message;
  }
}

export class UnauthenticatedError extends HttpException {
  constructor() {
    super(401, 'You are not authenticated');
  }
}

export class UnauthorisedError extends HttpException {
  constructor() {
    super(403, 'You are not authorised to perform this action');
  }
}

export class UnsupportedMediaTypeError extends HttpException {
  constructor() {
    super(415, 'Cannot accept provided media type');
  }
}

export class InvalidArgumentError extends HttpException {
  constructor() {
    super(422, 'Provided payload is not valid');
  }
}

export class BadRequestError extends HttpException {
  constructor() {
    super(400, 'Provided payload is not valid');
  }
}

export class EnvVariableMissingError extends HttpException {
  constructor(envVar: string) {
    super(500, `${envVar} is not defined`);
  }
}

export class InviteTokenInvalidError extends HttpException {
  constructor() {
    super(401, 'Invite token is not valid');
  }
}
