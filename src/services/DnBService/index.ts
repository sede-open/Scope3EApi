import { DnBClient } from '../../clients/DnBClient';
import { AppMetaRepository } from '../../repositories/AppMetaRepository';
import { DnBAuthTokenResponse } from '../../types';
import { checkTokenExpiry } from '../../utils/dnb';
import { DatabaseService } from '../DatabaseService/DatabaseService';
import { IDnBService } from './types';

export class DnBService implements IDnBService {
  constructor(
    private databaseService: DatabaseService,
    private dnbClient: DnBClient
  ) {}

  private async getAuthToken() {
    const appMetaRepository = await this.databaseService.getRepository(
      AppMetaRepository
    );
    const dnbToken = await appMetaRepository.findDnBToken();

    if (dnbToken) {
      const token: DnBAuthTokenResponse = JSON.parse(dnbToken.value);
      const isValid = checkTokenExpiry(dnbToken.createdAt, token.expiresIn);
      if (isValid) {
        return token.access_token;
      }
    }

    const tokenRes = await this.dnbClient.generateAuthToken();
    await appMetaRepository.upsertDnBToken(JSON.stringify(tokenRes));

    return tokenRes.access_token;
  }

  public async companyByDuns(duns: string) {
    const authToken = await this.getAuthToken();

    return this.dnbClient.companyByDunsRequest(duns, authToken);
  }

  public async typeahead(searchTerm: string) {
    const authToken = await this.getAuthToken();

    return this.dnbClient.typeaheadRequest(searchTerm, authToken);
  }
}
