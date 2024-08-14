import { Repository } from 'typeorm';
import { SOLUTION_INTERESTS_UPDATED_ACTION } from '../../constants/audit';
import { UserSolutionInterestsEntity } from '../../entities/UserSolutionInterests';
import { UpdateUserSolutionInterestsInput } from '../../types';
import { ControllerFunctionAsync } from '../types';

export const SOLUTION_INTERESTS_DO_NOT_EXIST_ERROR =
  'Solution interests do not exist';

const getSolutionInterestId = ({
  solutionInterestId,
}: {
  solutionInterestId: string;
}) => solutionInterestId;

export class UserSolutionInterestsController {
  constructor(
    private userSolutionInterestsRepository: Repository<UserSolutionInterestsEntity>
  ) {}

  findByUserId: ControllerFunctionAsync<
    undefined,
    UserSolutionInterestsEntity[]
  > = async (_, { user: { id: userId } }) =>
    this.userSolutionInterestsRepository.find({
      where: { userId },
    });

  updateUserSolutionInterests: ControllerFunctionAsync<
    UpdateUserSolutionInterestsInput,
    UserSolutionInterestsEntity[]
  > = async (args, context) => {
    const { solutionInterestIds } = args;
    const {
      user: { id: userId },
    } = context;

    const previousUserSolutionInterests = await this.userSolutionInterestsRepository.find(
      {
        where: { userId },
      }
    );

    // To be deleted
    const obsoleteUserSolutionInterestIds = previousUserSolutionInterests
      .filter(
        ({ solutionInterestId }) =>
          !solutionInterestIds.includes(solutionInterestId)
      )
      .map(({ id }) => id);

    // To be added
    const newUserSolutionInterestIds = solutionInterestIds.filter(
      (newSolutionInterestId) =>
        !previousUserSolutionInterests
          .map(getSolutionInterestId)
          .includes(newSolutionInterestId)
    );

    await this.userSolutionInterestsRepository.manager.transaction(
      async (entityManager) => {
        // Delete obsolete user solution interests
        await Promise.all(
          obsoleteUserSolutionInterestIds.map(async (id) =>
            entityManager.delete(UserSolutionInterestsEntity, id)
          )
        );

        // Save new user solution interests
        return Promise.all(
          newUserSolutionInterestIds.map(async (newUserSolutionInterestId) => {
            const newUserSolutionInterest = new UserSolutionInterestsEntity(
              userId,
              newUserSolutionInterestId
            );

            return entityManager.save(newUserSolutionInterest);
          })
        );
      }
    );

    const updatedUserSolutionInterests = await this.userSolutionInterestsRepository.find(
      {
        where: { userId },
      }
    );

    await context.controllers.audit.saveAuditTrail(
      {
        userId: context.user.id,
        action: SOLUTION_INTERESTS_UPDATED_ACTION,
        currentPayload: JSON.stringify(updatedUserSolutionInterests),
        previousPayload: JSON.stringify(previousUserSolutionInterests),
      },
      context
    );

    return updatedUserSolutionInterests;
  };
}
