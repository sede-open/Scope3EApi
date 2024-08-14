import { userResolvers } from './userResolvers';
import { roleResolvers } from './roleResolvers';
import { companyResolvers } from './companyResolvers';
import { meResolvers } from './meResolvers';
import { emissionResolvers } from './emissionResolvers';
import { targetResolvers } from './targetResolvers';
import { contactResolvers } from './contactResolvers';
import { inviteCompanyResolvers } from './inviteCompanyResolvers';
import { preferencesResolvers } from './preferencesResolvers';
import { companyRelationshipResolvers } from './companyRelationshipResolvers';
import { emissionAllocationResolvers } from './emissionAllocationResolvers';
import { categoryResolvers } from './categoryResolvers';
import { companySectorResolvers } from './companySectorResolvers';
import { sectorResolvers } from './sectorResolvers';
import { solutionInterestsResolvers } from './solutionInterestsResolvers';
import { userSolutionInterestsResolvers } from './userSolutionInterestsResolvers';
import { safeStringResolvers } from './safeStringResolvers';
import { emailResolvers } from './emailResolvers';
import { userNameResolvers } from './userNameResolvers';
import { pageSizeResolvers } from './pageSizeResolvers';
import { carbonIntensityResolvers } from './carbonIntensityResolvers';
import { graphqlScalarsResolvers } from './graphqlScalarResolvers';
import { tribeResolvers } from './tribeResolvers';
import { companyPrivacyResolvers } from './CompanyPrivacyResolver/companyPrivacyResolver';
import { companyRelationshipRecommendationResolvers } from './companyRelationshipRecommendationResolvers';

const resolvers = [
  userResolvers,
  roleResolvers,
  companyResolvers,
  meResolvers,
  emissionResolvers,
  targetResolvers,
  contactResolvers,
  inviteCompanyResolvers,
  preferencesResolvers,
  companyRelationshipResolvers,
  emissionAllocationResolvers,
  categoryResolvers,
  companySectorResolvers,
  sectorResolvers,
  solutionInterestsResolvers,
  userSolutionInterestsResolvers,
  safeStringResolvers,
  emailResolvers,
  userNameResolvers,
  pageSizeResolvers,
  carbonIntensityResolvers,
  graphqlScalarsResolvers,
  tribeResolvers,
  companyPrivacyResolvers,
  companyRelationshipRecommendationResolvers,
];

export default resolvers;
