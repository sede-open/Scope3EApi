import { Repository } from 'typeorm';

import { IContext } from '../../apolloContext';
import { UserSolutionInterestsEntity } from '../../entities/UserSolutionInterests';
import { supplierEditorUserMock } from '../../mocks/user';
import {
  solutionInterestsMock,
  solutionInterestsMock2,
  solutionInterestsMock3,
  solutionInterestsMock4,
} from '../../mocks/solutionInterests';
import { UserSolutionInterestsController } from '.';
import { SOLUTION_INTERESTS_UPDATED_ACTION } from '../../constants/audit';

const getUserSolutionInterestMock = ({
  id,
  solutionInterestId,
}: {
  id: string;
  solutionInterestId: string;
}) => ({
  id,
  userId: supplierEditorUserMock.id,
  solutionInterestId,
});

describe('SolutionInterestsController', () => {
  describe('findByUserId()', () => {
    it('should return solution interests for a user', async () => {
      const mockUserSolutionInterest = getUserSolutionInterestMock({
        id: '3328a6a2-a9c9-11eb-bcbc-0242ac130002',
        solutionInterestId: solutionInterestsMock.id,
      });

      const find = jest.fn();

      const repositoryMock = ({
        find,
      } as unknown) as Repository<UserSolutionInterestsEntity>;
      find.mockImplementation(() => mockUserSolutionInterest);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = new UserSolutionInterestsController(repositoryMock);

      const result = await controller.findByUserId(undefined, mockContext);

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: supplierEditorUserMock.id,
          },
        })
      );
      expect(result).toEqual(mockUserSolutionInterest);
    });
  });

  describe('updateUserSolutionInterests()', () => {
    describe('when the user has no existing solution interests', () => {
      it('should add all solution interest IDs', async () => {
        const updatedUserSolutionInterests = [
          solutionInterestsMock3,
          solutionInterestsMock4,
        ];

        const save = jest.fn();
        const mockDelete = jest.fn();
        const transaction = jest.fn().mockImplementation((cb) =>
          cb({
            delete: mockDelete,
            save,
          })
        );

        const repositoryMock = ({
          manager: {
            transaction,
          },
          find: jest
            .fn()
            .mockImplementationOnce(() => [])
            .mockImplementationOnce(() => updatedUserSolutionInterests),
        } as unknown) as Repository<UserSolutionInterestsEntity>;

        const saveAuditTrail = jest.fn();

        const mockContext = ({
          controllers: {
            audit: {
              saveAuditTrail,
            },
          },
          user: supplierEditorUserMock,
        } as unknown) as IContext;
        const controller = new UserSolutionInterestsController(repositoryMock);

        const result = await controller.updateUserSolutionInterests(
          {
            solutionInterestIds: updatedUserSolutionInterests.map(
              ({ id }) => id
            ),
          },
          mockContext
        );

        expect(save.mock.calls).toEqual(
          updatedUserSolutionInterests.map(({ id }) => [
            new UserSolutionInterestsEntity(supplierEditorUserMock.id, id),
          ])
        );
        expect(result).toEqual(updatedUserSolutionInterests);

        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall.userId).toBe(mockContext.user.id);
        expect(auditCall.action).toBe(SOLUTION_INTERESTS_UPDATED_ACTION);
        expect(JSON.parse(auditCall.previousPayload)).toEqual([]);
        expect(JSON.parse(auditCall.currentPayload)).toEqual(
          updatedUserSolutionInterests
        );
      });
    });

    describe('when the user already has existing solution interests', () => {
      it('should delete any obsolete interest IDs and add all new solution interest IDs', async () => {
        const userSolutionInterestMock1 = getUserSolutionInterestMock({
          id: '392f456a-a9c9-11eb-bcbc-0242ac130002',
          solutionInterestId: solutionInterestsMock.id,
        });

        const userSolutionInterestMock2 = getUserSolutionInterestMock({
          id: '3f7e59c4-a9c9-11eb-bcbc-0242ac130002',
          solutionInterestId: solutionInterestsMock2.id,
        });

        const userSolutionInterestMock3 = getUserSolutionInterestMock({
          id: '440acfae-a9c9-11eb-bcbc-0242ac130002',
          solutionInterestId: solutionInterestsMock3.id,
        });

        const userSolutionInterestMock4 = getUserSolutionInterestMock({
          id: '48d16ade-a9c9-11eb-bcbc-0242ac130002',
          solutionInterestId: solutionInterestsMock4.id,
        });

        const updatedUserSolutionInterests = [
          userSolutionInterestMock2,
          userSolutionInterestMock3,
          userSolutionInterestMock4,
        ];

        const expectedSaveResult = [
          userSolutionInterestMock3,
          userSolutionInterestMock4,
        ];

        const existingUserSolutionInterests = [
          userSolutionInterestMock1,
          userSolutionInterestMock2,
        ];

        const save = jest.fn();
        const mockDelete = jest.fn();
        const transaction = jest.fn().mockImplementation((cb) =>
          cb({
            delete: mockDelete,
            save,
          })
        );

        const repositoryMock = ({
          manager: {
            transaction,
          },
          find: jest
            .fn()
            .mockImplementationOnce(() => existingUserSolutionInterests)
            .mockImplementationOnce(() => updatedUserSolutionInterests),
        } as unknown) as Repository<UserSolutionInterestsEntity>;

        const saveAuditTrail = jest.fn();

        const mockContext = ({
          controllers: {
            audit: {
              saveAuditTrail,
            },
          },
          user: supplierEditorUserMock,
        } as unknown) as IContext;
        const controller = new UserSolutionInterestsController(repositoryMock);

        const result = await controller.updateUserSolutionInterests(
          {
            solutionInterestIds: updatedUserSolutionInterests.map(
              ({ solutionInterestId }) => solutionInterestId
            ),
          },
          mockContext
        );

        expect(mockDelete).toBeCalledWith(
          UserSolutionInterestsEntity,
          userSolutionInterestMock1.id
        );

        expect(save.mock.calls).toEqual(
          expectedSaveResult.map(({ solutionInterestId }) => [
            new UserSolutionInterestsEntity(
              supplierEditorUserMock.id,
              solutionInterestId
            ),
          ])
        );

        expect(result).toEqual(updatedUserSolutionInterests);

        const [[auditCall]] = saveAuditTrail.mock.calls;
        expect(auditCall.userId).toBe(mockContext.user.id);
        expect(auditCall.action).toBe(SOLUTION_INTERESTS_UPDATED_ACTION);
        expect(JSON.parse(auditCall.previousPayload)).toEqual(
          existingUserSolutionInterests
        );
        expect(JSON.parse(auditCall.currentPayload)).toEqual(
          updatedUserSolutionInterests
        );
      });
    });
  });
});
