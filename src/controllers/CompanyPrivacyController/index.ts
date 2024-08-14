import { ApolloError } from 'apollo-server-express';
import { assertSessionUserBelongsToCompany } from '../../access/utils';
import { IContext } from '../../apolloContext';
import { CompanyPrivacy } from '../../repositories/CompanyPrivacyRepository/types';
import { CompanyPrivacyService } from '../../services/CompanyPrivacyService';
import {
  ComanyDataPrivacyCompleteness,
  CompanyPrivacyInput,
  DataShareRequest,
} from '../../types';
import { ControllerFunction } from '../types';
import { ICompanyPrivacyCompleteness } from './types';

export const CANNOT_REQUEST_YOUR_COMPANY =
  'You cannot request your own company to share data';

export class CompanyPrivacyController {
  constructor(private companyPrivacyService: CompanyPrivacyService) {}

  async create(args: CompanyPrivacyInput, { user: { companyId } }: IContext) {
    const companyPrivacy: CompanyPrivacy = {
      ...args,
      companyId,
    };
    return this.companyPrivacyService.create(companyPrivacy);
  }

  async update(args: CompanyPrivacyInput, { user: { companyId } }: IContext) {
    const companyPrivacy: CompanyPrivacy = {
      ...args,
      companyId,
    };
    return this.companyPrivacyService.update(companyPrivacy);
  }

  async findOne({ user: { companyId } }: IContext) {
    return this.companyPrivacyService.findOne({ where: { companyId } });
  }

  async companyDataPrivacyCompleteness(
    { companyId }: ICompanyPrivacyCompleteness,
    context: IContext
  ): Promise<ComanyDataPrivacyCompleteness> {
    assertSessionUserBelongsToCompany(companyId, context);

    const {
      isComplete,
      numCorporateEmissionAccessMissing,
      numIntensityTargetPrivacyTypeMissing,
      numAbsoluteTargetPrivacyTypeMissing,
    } = await this.companyPrivacyService.hasUserPopulatedAllDataPrivacyInfo(
      companyId
    );

    return {
      isComplete,
      numCorporateEmissionAccessMissing,
      numIntensityTargetPrivacyTypeMissing,
      numAbsoluteTargetPrivacyTypeMissing,
      companyId,
    };
  }

  dataShareRequest: ControllerFunction<
    { targetCompanyId: string },
    Promise<DataShareRequest>
  > = async (args, context) => {
    if (args.targetCompanyId === context.user.companyId) {
      throw new ApolloError(CANNOT_REQUEST_YOUR_COMPANY);
    }

    try {
      const dataShareRequest = await this.companyPrivacyService.sendDataShareRequest(
        args.targetCompanyId,
        context.user
      );
      return dataShareRequest;
    } catch (error) {
      throw new ApolloError(error.message);
    }
  };
}
