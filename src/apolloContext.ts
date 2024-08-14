import { ExpressContext } from 'apollo-server-express/dist/ApolloServer';

import { ContextUser } from './entities/User';
import { authenticateUser } from './auth';
import { AccessDeniedError } from './utils/errors';
import { createStatelessContext, IStatelessContext } from './statelessContext';

export interface IContext extends IStatelessContext {
  user: ContextUser;
  token: string;
  accessToken?: string;
}

type ConstructedContext = Promise<IContext>;

type ContextFn = () => (expressContext: ExpressContext) => ConstructedContext;

export const createContext: ContextFn = () => async ({
  req,
}: ExpressContext): Promise<IContext> => {
  const { user, token, accessToken } = await authenticateUser(req);

  if (!user) {
    throw new AccessDeniedError();
  }

  return {
    user,
    token,
    accessToken,
    ...(await createStatelessContext()),
  };
};
