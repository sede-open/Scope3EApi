import { Repository, Like } from 'typeorm';

import { SectorController, SECTOR_EXISTS_ERROR } from '.';
import { sectorMock } from '../../mocks/sector';
import { IContext } from '../../apolloContext';
import { SectorEntity } from '../../entities/Sector';
import { OrderBy } from '../../types';
import { getDnBCompanyProfile } from '../../mocks/dnbCompanyProfile';
import { supplierEditorUserMock } from '../../mocks/user';
import { SECTOR_CREATED_ACTION } from '../../constants/audit';

describe('SectorController', () => {
  describe('findAll()', () => {
    const sectors = [sectorMock];
    const find = jest.fn();
    const sectorRepositoryMock = ({
      find,
    } as unknown) as Repository<SectorEntity>;

    beforeEach(() => {
      find.mockReset();
      find.mockImplementation(() => sectors);
    });

    it('should return a list of sectors', async () => {
      const controller = new SectorController(sectorRepositoryMock);

      const result = await controller.findAll(
        undefined,
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        order: { name: OrderBy.Asc },
        where: {},
      });
      expect(result).toEqual(sectors);
    });

    it('should create a LIKE WHERE condition when a searchTerm is provided', async () => {
      const controller = new SectorController(sectorRepositoryMock);

      const result = await controller.findAll(
        { searchTerm: 'my search string' },
        (jest.fn() as unknown) as IContext
      );

      expect(find).toHaveBeenCalledWith({
        where: { name: Like('%my search string%') },
        order: { name: OrderBy.Asc },
      });
      expect(result).toEqual(sectors);
    });

    describe('when paginating', () => {
      it('should not paginate given pageSize but no pageNumber', async () => {
        const controller = new SectorController(sectorRepositoryMock);

        const result = await controller.findAll(
          { pageSize: 20 },
          (jest.fn() as unknown) as IContext
        );

        expect(find).toHaveBeenCalledWith({
          where: {},
          order: { name: OrderBy.Asc },
        });
        expect(result).toEqual(sectors);
      });

      it('should not paginate given pageNumber but no pageSize', async () => {
        const controller = new SectorController(sectorRepositoryMock);

        const result = await controller.findAll(
          { pageNumber: 3 },
          (jest.fn() as unknown) as IContext
        );

        expect(find).toHaveBeenCalledWith({
          where: {},
          order: { name: OrderBy.Asc },
        });
        expect(result).toEqual(sectors);
      });

      it('should not paginate given pageNumber 0', async () => {
        const controller = new SectorController(sectorRepositoryMock);

        const result = await controller.findAll(
          { pageNumber: 0, pageSize: 50 },
          (jest.fn() as unknown) as IContext
        );

        expect(find).toHaveBeenCalledWith({
          where: {},
          order: { name: OrderBy.Asc },
        });
        expect(result).toEqual(sectors);
      });

      it('should make a paginated query given a valid pageNumber and pageSize', async () => {
        const controller = new SectorController(sectorRepositoryMock);

        const result = await controller.findAll(
          { pageNumber: 3, pageSize: 50 },
          (jest.fn() as unknown) as IContext
        );

        expect(find).toHaveBeenCalledWith({
          where: {},
          order: { name: OrderBy.Asc },
          skip: 100,
          take: 50,
        });
        expect(result).toEqual(sectors);
      });
    });
  });

  describe('findOrCreateFromDnBProfile()', () => {
    const sectorMock = getDnBCompanyProfile().primarySector!;

    const setupFindOrCreate = ({
      saveMock,
      findOneMock,
      findOneResult,
      saveAuditTrailMock,
    }: {
      saveMock?: jest.Mock;
      findOneMock?: jest.Mock;
      saveAuditTrailMock?: jest.Mock;
      findOneResult?: null;
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

      const findOne = findOneMock ?? jest.fn();
      findOne.mockImplementation(() =>
        typeof findOneResult !== 'undefined' ? findOneResult : sectorMock
      );

      const save = saveMock ?? jest.fn();
      save.mockImplementation(() => sectorMock);

      const sectorRepositoryMock = ({
        findOne,
        save,
      } as unknown) as Repository<SectorEntity>;

      const controller = new SectorController(sectorRepositoryMock);

      return controller.findOrCreateFromDnBProfile(
        { sector: sectorMock },
        (mockContext as unknown) as IContext
      );
    };

    describe('when the sector already exists', () => {
      it('should return the sector', async () => {
        const findOne = jest.fn();

        const result = await setupFindOrCreate({
          findOneMock: findOne,
        });

        expect(findOne).toHaveBeenCalledTimes(1);
        expect(result).toEqual(sectorMock);
      });
    });

    describe('when the sector does not exist', () => {
      it('should return created result', async () => {
        const findOneMock = jest.fn();
        const saveMock = jest.fn();
        const result = await setupFindOrCreate({
          saveMock,
          findOneMock,
          findOneResult: null,
        });

        expect(findOneMock).toHaveBeenCalledTimes(2);
        expect(saveMock).toHaveBeenCalledTimes(1);
        expect(result).toEqual(sectorMock);
      });
    });

    describe('when one of the input values is not a valid string', () => {
      describe('when industry code does not exists', () => {
        it('should return undefined', async () => {
          const sectorRepositoryMock = (jest.fn() as unknown) as Repository<SectorEntity>;

          const controller = new SectorController(sectorRepositoryMock);

          const result = await controller.findOrCreateFromDnBProfile(
            {
              sector: {
                industryCode: undefined,
                industryDescription: sectorMock.industryDescription,
                typeDescription: sectorMock.typeDescription,
              },
            },
            (jest.fn() as unknown) as IContext
          );

          expect(result).toBeUndefined();
        });
      });

      describe('when industry description does not exists', () => {
        it('should return undefined', async () => {
          const sectorRepositoryMock = (jest.fn() as unknown) as Repository<SectorEntity>;

          const controller = new SectorController(sectorRepositoryMock);

          const result = await controller.findOrCreateFromDnBProfile(
            {
              sector: {
                industryCode: sectorMock.industryCode,
                industryDescription: undefined,
                typeDescription: sectorMock.typeDescription,
              },
            },
            (jest.fn() as unknown) as IContext
          );

          expect(result).toBeUndefined();
        });
      });

      describe('when industry type description does not exists', () => {
        it('should return undefined', async () => {
          const sectorRepositoryMock = (jest.fn() as unknown) as Repository<SectorEntity>;

          const controller = new SectorController(sectorRepositoryMock);

          const result = await controller.findOrCreateFromDnBProfile(
            {
              sector: {
                industryCode: sectorMock.industryCode,
                industryDescription: sectorMock.industryDescription,
                typeDescription: undefined,
              },
            },
            (jest.fn() as unknown) as IContext
          );

          expect(result).toBeUndefined();
        });
      });
    });
  });

  describe('create()', () => {
    const setupCreate = ({
      saveMock,
      findOneMock,
      findOneResult,
      saveAuditTrailMock,
    }: {
      saveMock?: jest.Mock;
      findOneMock?: jest.Mock;
      saveAuditTrailMock?: jest.Mock;
      findOneResult?: null | unknown;
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

      const findOne = findOneMock ?? jest.fn();
      findOne.mockImplementation(() => findOneResult ?? undefined);

      const save = saveMock ?? jest.fn();
      save.mockImplementation(() => sectorMock);

      const sectorRepositoryMock = ({
        findOne,
        save,
      } as unknown) as Repository<SectorEntity>;

      const controller = new SectorController(sectorRepositoryMock);

      return controller.create(
        {
          industryCode: sectorMock.industryCode,
          industryDescription: sectorMock.name,
          typeDescription: sectorMock.industryType,
        },
        (mockContext as unknown) as IContext
      );
    };

    describe('when the sector does not exist', () => {
      it('should create and return the sector', async () => {
        const findOneMock = jest.fn();
        const saveMock = jest.fn();

        const result = await setupCreate({
          saveMock,
          findOneMock,
        });

        expect(result).toEqual(sectorMock);
      });

      it('should log an audit trail', async () => {
        const saveAuditTrail = jest.fn();

        await setupCreate({
          saveAuditTrailMock: saveAuditTrail,
        });

        const [[saveAuditTrailCall]] = saveAuditTrail.mock.calls;
        expect(saveAuditTrailCall).toEqual({
          userId: supplierEditorUserMock.id,
          action: SECTOR_CREATED_ACTION,
          currentPayload: JSON.stringify(sectorMock),
        });
      });
    });

    describe('when the sector already exists', () => {
      it('should throw an error', async () => {
        const findOneResult = sectorMock;

        expect.assertions(1);

        try {
          await setupCreate({
            findOneResult,
          });
        } catch (err) {
          expect(err.message).toBe(SECTOR_EXISTS_ERROR);
        }
      });
    });
  });
});
