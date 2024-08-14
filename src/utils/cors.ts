import { isEnvironmentLocal, getConfig } from '../config';

export const getCorsOptions = () => {
  const { environment } = getConfig();
  // Allows Apollo Studio GraphQL client to call the API in the local environment
  if (isEnvironmentLocal(environment)) {
    return {
      origin: ['https://studio.apollographql.com'],
    };
  }
  return false;
};
