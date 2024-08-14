import { Category } from '../types';
import { ResolverFunction } from './types';

type CategoryResolverType = {
  Query: {
    categories: ResolverFunction<undefined, Category[] | undefined>;
  };
};

export const categoryResolvers: CategoryResolverType = {
  Query: {
    async categories(_, args, context) {
      return context.controllers.category.findAll(args, context);
    },
  },
};
