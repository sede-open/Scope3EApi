import { Repository, EntityRepository } from 'typeorm';
import { AppMetaName } from '../../constants/appMeta';
import { AppMetaEntity } from '../../entities/AppMeta';

@EntityRepository(AppMetaEntity)
export class AppMetaRepository extends Repository<AppMetaEntity> {
  public findDnBToken() {
    return this.findOne({
      where: { name: AppMetaName.DNB_TOKEN },
    });
  }

  public async upsertDnBToken(tokenData: string) {
    const token = await this.findDnBToken();
    if (token) {
      token.value = tokenData;
      return this.save(token);
    }

    return this.save({ name: AppMetaName.DNB_TOKEN, value: tokenData });
  }

  public findEndIndexVal() {
    return this.findOne({
      where: { name: AppMetaName.BUILD_COMPANY_CONNECTION_END_INDEX },
    });
  }

  public async upsertBuildCronJobIndex(endIndexVal: number) {
    const lastIndex = await this.findEndIndexVal();
    if (lastIndex) {
      lastIndex.value = endIndexVal.toString();
      return this.save(lastIndex);
    }

    return this.save({
      name: AppMetaName.BUILD_COMPANY_CONNECTION_END_INDEX,
      value: lastIndex ? lastIndex : '24',
    });
  }
}
