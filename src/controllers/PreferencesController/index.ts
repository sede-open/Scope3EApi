import { Repository } from 'typeorm';
import { ControllerFunctionAsync } from '../types';
import { EditPreferencesInput } from '../../types';
import { PreferencesEntity } from '../../entities/Preferences';
import { ApolloError } from 'apollo-server-express';

export const PREFERENCES_DO_NOT_EXIST_ERROR = 'Preferences do not exist';
export const NOTHING_TO_UPDATE_ERROR =
  'Updated fields already match db fields ';

export class PreferencesController {
  constructor(private preferencesRepository: Repository<PreferencesEntity>) {}

  findByUserId: ControllerFunctionAsync<
    undefined,
    PreferencesEntity | undefined
  > = async (_, context) => {
    const {
      user: { id: userId },
    } = context;

    return this.preferencesRepository.findOne({
      where: { userId },
    });
  };

  editPreferences: ControllerFunctionAsync<
    EditPreferencesInput,
    PreferencesEntity | undefined
  > = async (args, context) => {
    const {
      user: { id: userId },
    } = context;

    const existingPreferences = await this.preferencesRepository.findOne({
      where: { userId },
    });

    const preferencesToUpdate = existingPreferences
      ? existingPreferences
      : new PreferencesEntity(userId);

    let lastUpdatedFields = false;
    if (
      args.suppressTaskListPrompt != null &&
      preferencesToUpdate.suppressTaskListPrompt !== args.suppressTaskListPrompt
    ) {
      preferencesToUpdate.suppressTaskListPrompt = args.suppressTaskListPrompt;
      lastUpdatedFields = true;
    }

    if (!lastUpdatedFields) {
      throw new ApolloError(NOTHING_TO_UPDATE_ERROR);
    }

    return this.preferencesRepository.save(preferencesToUpdate);
  };
}
