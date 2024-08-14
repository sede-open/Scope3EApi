import { Repository } from 'typeorm';
import {
  CompanySectorController,
  COMPANY_SECTOR_EXISTS_ERROR,
  INCORRECT_SECTOR_PAYLOAD,
} from '.';
import { IContext } from '../../apolloContext';
import {
  COMPANY_SECTOR_CREATED_ACTION,
  COMPANY_SECTOR_UPDATED_ACTION,
} from '../../constants/audit';
import { CompanySectorEntity } from '../../entities/CompanySector';
import { USER_COMPANY_ERROR } from '../../errors/commonErrorMessages';
import {
  companySector2Mock,
  CompanySectorMock,
  companySectorMock,
} from '../../mocks/companySector';
import { supplierEditorUserMock } from '../../mocks/user';
import { CompanySectorType } from '../../types';

describe('CompanySectorController', () => {
  describe('findByCompanyId()', () => {
    it.each`
      createdBy                      | expectedHasBeenUpdated
      ${companySectorMock.createdBy} | ${true}
      ${null}                        | ${false}
    `(
      'should return sectors for a company with $expectedHasBeenUpdated hasBeenUpdated property when createdBy is $createdBy',
      async ({
        createdBy,
        expectedHasBeenUpdated,
      }: {
        createdBy: string;
        expectedHasBeenUpdated: boolean;
      }) => {
        const find = jest.fn();
        const repositoryMock = ({
          find,
        } as unknown) as Repository<CompanySectorEntity>;
        find.mockImplementation(() => [
          {
            ...companySectorMock,
            createdBy,
          },
        ]);
        const mockContext = ({
          user: supplierEditorUserMock,
        } as unknown) as IContext;

        const controller = new CompanySectorController(repositoryMock);

        const result = await controller.findByCompanyId(
          {
            companyId: companySectorMock.companyId,
          },
          mockContext
        );

        expect(find).toHaveBeenCalledWith(
          expect.objectContaining({
            where: {
              companyId: companySectorMock.companyId,
            },
          })
        );

        const expected = [
          {
            ...companySectorMock,
            createdBy,
            hasBeenUpdated: expectedHasBeenUpdated,
          },
        ];

        expect(result).toEqual(expected);
      }
    );
  });

  describe('updateCompanySectors()', () => {
    describe('when there are existing sector sectors', () => {
      const existingCompanySectors = [companySectorMock, companySector2Mock];

      const updatedCompanySectors = [
        {
          ...companySectorMock,
          sectorId: 'some-new-sector-id',
        },
        {
          ...companySector2Mock,
          sectorType: 'tertiary' as CompanySectorType,
        },
      ];

      it('should delete any obsolete company sector sectors, update existing company sector sectors and save any new company sector sectors', async () => {
        const save = jest.fn();
        const mockDelete = jest.fn();
        const update = jest.fn();
        const transaction = jest.fn().mockImplementation((cb) =>
          cb({
            delete: mockDelete,
            update,
            save,
          })
        );

        const repositoryMock = ({
          manager: {
            transaction,
          },
          find: jest
            .fn()
            .mockImplementationOnce(() => existingCompanySectors)
            .mockImplementationOnce(() => updatedCompanySectors),
        } as unknown) as Repository<CompanySectorEntity>;

        const saveAuditTrail = jest.fn();

        const mockContext = ({
          controllers: {
            audit: {
              saveAuditTrail,
            },
          },
          user: supplierEditorUserMock,
        } as unknown) as IContext;
        const controller = new CompanySectorController(repositoryMock);

        const result = await controller.updateCompanySectors(
          {
            companyId: companySectorMock.companyId,
            sectors: updatedCompanySectors.map(
              ({ sectorId: id, sectorType }) => ({
                id,
                sectorType,
              })
            ),
          },
          mockContext
        );

        // Obsolete companySectors are deleted
        expect(mockDelete).toBeCalledWith(
          CompanySectorEntity,
          companySector2Mock.id
        );

        // When the sectorType is the same, but the sectorId has changed, update() is called
        expect(update.mock.calls).toEqual([
          [
            CompanySectorEntity,
            {
              sectorType: updatedCompanySectors[0].sectorType,
              companyId: updatedCompanySectors[0].companyId,
            },
            {
              sectorId: updatedCompanySectors[0].sectorId,
              updatedBy: supplierEditorUserMock.id,
            },
          ],
        ]);

        // When the sectorType is new, save() is called
        const newCompanySector = new CompanySectorEntity(
          companySectorMock.companyId,
          updatedCompanySectors[1].sectorId,
          updatedCompanySectors[1].sectorType
        );
        newCompanySector.createdBy = supplierEditorUserMock.id;
        newCompanySector.updatedBy = supplierEditorUserMock.id;

        expect(save.mock.calls).toEqual([[newCompanySector]]);

        expect(result).toEqual(updatedCompanySectors);

        expect(saveAuditTrail.mock.calls).toEqual([
          [
            {
              userId: mockContext.user.id,
              action: COMPANY_SECTOR_UPDATED_ACTION,
              previousPayload: JSON.stringify(existingCompanySectors),
              currentPayload: JSON.stringify(updatedCompanySectors),
            },
            mockContext,
          ],
        ]);
      });

      describe('when the user does not belong to the requested company', () => {
        it('should throw an USER_COMPANY_ERROR error', async () => {
          const save = jest.fn();
          const mockDelete = jest.fn();
          const update = jest.fn();
          const transaction = jest.fn().mockImplementation((cb) =>
            cb({
              delete: mockDelete,
              update,
              save,
            })
          );

          const repositoryMock = ({
            manager: {
              transaction,
            },
            find: jest.fn().mockImplementationOnce(() => []),
          } as unknown) as Repository<CompanySectorEntity>;
          const mockContext = ({
            user: {
              ...supplierEditorUserMock,
              companyId: 'some-other-company-id',
            },
          } as unknown) as IContext;
          const controller = new CompanySectorController(repositoryMock);

          try {
            await controller.updateCompanySectors(
              {
                companyId: companySectorMock.companyId,
                sectors: updatedCompanySectors.map(
                  ({ sectorId: id, sectorType }) => ({
                    id,
                    sectorType,
                  })
                ),
              },
              mockContext
            );
          } catch (err) {
            expect(err.message).toBe(USER_COMPANY_ERROR);
          }

          [save, mockDelete, update].forEach((method) => {
            expect(method).not.toHaveBeenCalled();
          });
        });
      });

      describe('when the sectors payload is incorrectly formed', () => {
        it.each`
          payload
          ${[{
    ...companySectorMock,
    sectorId: 'some-new-sector-id',
  }, {
    ...companySector2Mock,
    sectorType: CompanySectorType.Primary,
  }]}
          ${[{
    ...companySectorMock,
    sectorId: 'some-new-sector-id',
  }, {
    ...companySector2Mock,
    sectorId: 'some-new-sector-id-2',
    sectorType: CompanySectorType.Secondary,
  }, {
    ...companySector2Mock,
    sectorId: 'some-new-sector-id-3',
    sectorType: CompanySectorType.Secondary,
  }]}
        `(
          'should throw an INCORRECT_SECTOR_PAYLOAD error',
          async ({ payload }: { payload: CompanySectorMock[] }) => {
            const save = jest.fn();
            const mockDelete = jest.fn();
            const update = jest.fn();
            const transaction = jest.fn().mockImplementation((cb) =>
              cb({
                delete: mockDelete,
                update,
                save,
              })
            );

            const repositoryMock = ({
              manager: {
                transaction,
              },
              find: jest.fn().mockImplementationOnce(() => []),
            } as unknown) as Repository<CompanySectorEntity>;
            const mockContext = ({
              user: supplierEditorUserMock,
            } as unknown) as IContext;
            const controller = new CompanySectorController(repositoryMock);

            try {
              await controller.updateCompanySectors(
                {
                  companyId: companySectorMock.companyId,
                  sectors: payload.map(({ sectorId: id, sectorType }) => ({
                    id,
                    sectorType,
                  })),
                },
                mockContext
              );
            } catch (err) {
              expect(err.message).toBe(INCORRECT_SECTOR_PAYLOAD);
            }

            [save, mockDelete, update].forEach((method) => {
              expect(method).not.toHaveBeenCalled();
            });
          }
        );
      });
    });
  });

  describe('create()', () => {
    const setupCreate = async ({
      saveMock,
      saveAuditTrailMock,
      findCompanySectorOverride,
    }: {
      saveMock?: jest.Mock;
      saveAuditTrailMock?: jest.Mock;
      findCompanySectorOverride?: unknown;
    }) => {
      const saveAuditTrail = saveAuditTrailMock ?? jest.fn();

      const mockContext = {
        controllers: {
          audit: {
            saveAuditTrail,
          },
        },
        user: supplierEditorUserMock,
      };

      const findOne = jest.fn();
      findOne.mockImplementation(() =>
        typeof findCompanySectorOverride !== 'undefined'
          ? findCompanySectorOverride
          : undefined
      );

      const save = saveMock ?? jest.fn();
      save.mockImplementation(() => companySectorMock);

      const companySectorRepositoryMock = ({
        findOne,
        save,
      } as unknown) as Repository<CompanySectorEntity>;

      const controller = new CompanySectorController(
        companySectorRepositoryMock
      );

      return controller.create(
        {
          companyId: companySectorMock.companyId,
          sectorType: companySectorMock.sectorType,
          sectorId: companySectorMock.sectorId,
        },
        (mockContext as unknown) as IContext
      );
    };

    describe('when company sector is successfully created', () => {
      it('should return the company sector', async () => {
        const saveMock = jest.fn();
        const result = await setupCreate({ saveMock });
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual(companySectorMock);
      });

      it('should record an audit trail', async () => {
        const saveAuditTrail = jest.fn();

        await setupCreate({
          saveAuditTrailMock: saveAuditTrail,
        });

        const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
        expect(saveAuditTrailCall).toEqual({
          userId: supplierEditorUserMock.id,
          action: COMPANY_SECTOR_CREATED_ACTION,
          currentPayload: JSON.stringify(companySectorMock),
        });
      });
    });

    describe('when sector has already been assigned to the company', () => {
      it('should throw an error', async () => {
        const findCompanySectorOverride = companySectorMock;

        expect.assertions(1);

        try {
          await setupCreate({
            findCompanySectorOverride,
          });
        } catch (err) {
          expect(err.message).toBe(COMPANY_SECTOR_EXISTS_ERROR);
        }
      });
    });
  });
});
