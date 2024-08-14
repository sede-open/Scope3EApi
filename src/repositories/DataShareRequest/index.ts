import { EntityRepository } from 'typeorm';
import {
  DataShareRequestEntity,
  IDataShareRequest,
} from '../../entities/DataShareRequest';
import { CustomRepository } from '../Repository';

@EntityRepository(DataShareRequestEntity)
export class DataShareRequestRepository extends CustomRepository<
  DataShareRequestEntity,
  IDataShareRequest
> {}
