import { CompanySectorService } from '.';
import {
  companySector2Mock,
  companySectorMock,
} from '../../mocks/companySector';
import { DatabaseService } from '../DatabaseService/DatabaseService';

describe('CompanySectorService', () => {
  describe('findCompanyIdsInTheDivision', () => {
    const myCompanyId = 'myCompanyId';
    describe('when the company sectors have the same division', () => {
      it('returns the company ids having sectors in the same division', async () => {
        const primaryCompanySector = {
          ...companySectorMock,
          sector: { division: 'CONSTRUCTION' },
        };
        const secondaryCompanySector = {
          ...companySector2Mock,
          sector: { division: 'CONSTRUCTION' },
        };
        const find = jest
          .fn()
          .mockResolvedValueOnce([
            primaryCompanySector,
            secondaryCompanySector,
          ]);
        const findCompanyIdsByDivisions = jest.fn();
        const databaseService = ({
          getRepository: jest
            .fn()
            .mockResolvedValueOnce({ find, findCompanyIdsByDivisions }),
        } as unknown) as DatabaseService;

        const companySectorService = new CompanySectorService(databaseService);
        await companySectorService.findCompanyIdsInTheDivision(myCompanyId);

        expect(find).toHaveBeenCalledWith({
          where: { companyId: myCompanyId },
          relations: ['sector'],
        });
        expect(findCompanyIdsByDivisions).toHaveBeenCalledWith(
          [primaryCompanySector.sector.division],
          myCompanyId
        );
      });
    });
    describe('when the company sectors have different divisions', () => {
      it('returns the company ids having sectors in the same divisions', async () => {
        const primaryCompanySector = {
          ...companySectorMock,
          sector: { division: 'CONSTRUCTION' },
        };
        const secondaryCompanySector = {
          ...companySector2Mock,
          sector: { division: 'FINANCE_INSURANCE_REAL_ESTATE' },
        };
        const find = jest
          .fn()
          .mockResolvedValueOnce([
            primaryCompanySector,
            secondaryCompanySector,
          ]);
        const findCompanyIdsByDivisions = jest.fn();
        const databaseService = ({
          getRepository: jest
            .fn()
            .mockResolvedValueOnce({ find, findCompanyIdsByDivisions }),
        } as unknown) as DatabaseService;

        const companySectorService = new CompanySectorService(databaseService);
        await companySectorService.findCompanyIdsInTheDivision(myCompanyId);

        expect(find).toHaveBeenCalledWith({
          where: { companyId: myCompanyId },
          relations: ['sector'],
        });
        expect(findCompanyIdsByDivisions).toHaveBeenCalledWith(
          [
            primaryCompanySector.sector.division,
            secondaryCompanySector.sector.division,
          ],
          myCompanyId
        );
      });
    });
  });
});
