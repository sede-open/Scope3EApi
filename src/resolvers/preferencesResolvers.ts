import { EditPreferencesInput, Preferences } from '../types';
import { ResolverFunction } from './types';

type PreferencesResolverType = {
  Query: {
    preferences: ResolverFunction<{ userId: string }, Preferences | undefined>;
  };
  Mutation: {
    editPreferences: ResolverFunction<
      { input: EditPreferencesInput },
      Preferences | undefined
    >;
  };
};

export const preferencesResolvers: PreferencesResolverType = {
  Query: {
    async preferences(_, __, context) {
      return context.controllers.preferences.findByUserId(undefined, context);
    },
  },
  Mutation: {
    async editPreferences(_, args, context) {
      return context.controllers.preferences.editPreferences(
        { ...args.input },
        context
      );
    },
  },
};
