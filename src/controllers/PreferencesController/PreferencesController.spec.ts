import { Repository } from 'typeorm';

import { IContext } from '../../apolloContext';
import { PreferencesEntity } from '../../entities/Preferences';
import { supplierEditorUserMock } from '../../mocks/user';
import { preferencesMock } from '../../mocks/preferences';
import { NOTHING_TO_UPDATE_ERROR, PreferencesController } from '.';

describe('PreferencesController', () => {
  const findOne = jest.fn();
  const save = jest.fn();
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('findByUserId()', () => {
    it('should return preferences entry for a user', async () => {
      const repositoryMock = ({
        findOne,
      } as unknown) as Repository<PreferencesEntity>;
      findOne.mockImplementation(() => preferencesMock);
      const mockContext = ({
        user: supplierEditorUserMock,
      } as unknown) as IContext;

      const controller = new PreferencesController(repositoryMock);

      const result = await controller.findByUserId(undefined, mockContext);

      expect(findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: supplierEditorUserMock.id,
          },
        })
      );
      expect(result).toEqual(preferencesMock);
    });
  });

  describe('editPreferences()', () => {
    describe('when preferences with matching userId do not already exist', () => {
      it('should create a new Preferences entity and insert with updated values', async () => {
        findOne.mockImplementation(() => undefined);
        const updatedProperties = {
          suppressTaskListPrompt: true,
        };
        const repositoryMock = ({
          findOne,
          save,
        } as unknown) as Repository<PreferencesEntity>;
        const mockContext = ({
          user: supplierEditorUserMock,
        } as unknown) as IContext;
        const controller = new PreferencesController(repositoryMock);

        await controller.editPreferences(updatedProperties, mockContext);

        const expectedPreferencesEntity = new PreferencesEntity(
          supplierEditorUserMock.id
        );
        expectedPreferencesEntity.suppressTaskListPrompt = true;

        expect(save).toHaveBeenCalledWith(expectedPreferencesEntity);
      });
    });

    describe('when preferences with matching userId is returned', () => {
      describe('and no prooperties are being mutated', () => {
        it('should throw NOTHING_TO_UPDATE_ERROR', async () => {
          findOne.mockImplementation(() => preferencesMock);
          const updatedProperties = {
            suppressTaskListPrompt: preferencesMock.suppressTaskListPrompt,
          };
          const repositoryMock = ({
            findOne,
            save,
          } as unknown) as Repository<PreferencesEntity>;
          const mockContext = ({
            user: supplierEditorUserMock,
          } as unknown) as IContext;
          const controller = new PreferencesController(repositoryMock);

          try {
            await controller.editPreferences(updatedProperties, mockContext);
          } catch (err) {
            expect(err.message).toBe(NOTHING_TO_UPDATE_ERROR);
          }
        });
      });

      describe('and prooperties are being mutated', () => {
        it('should update the preferences entry', async () => {
          findOne.mockImplementation(() => preferencesMock);
          const updatedProperties = {
            suppressTaskListPrompt: !preferencesMock.suppressTaskListPrompt,
          };
          const repositoryMock = ({
            findOne,
            save,
          } as unknown) as Repository<PreferencesEntity>;
          const mockContext = ({
            user: supplierEditorUserMock,
          } as unknown) as IContext;
          const controller = new PreferencesController(repositoryMock);

          await controller.editPreferences(updatedProperties, mockContext);

          expect(save).toHaveBeenCalledWith({
            ...preferencesMock,
            ...updatedProperties,
          });
        });
      });
    });
  });
});
