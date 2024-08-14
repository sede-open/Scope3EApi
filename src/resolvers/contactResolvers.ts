import { EnquiryEmailInput } from '../types';
import { ResolverFunction } from './types';

type ContactResolverType = {
  Mutation: {
    enquiryEmail: ResolverFunction<{ input: EnquiryEmailInput }, string>;
  };
};

export const contactResolvers: ContactResolverType = {
  Mutation: {
    async enquiryEmail(_, args, context) {
      return context.controllers.contact.enquiryEmail(args.input, context);
    },
  },
};
