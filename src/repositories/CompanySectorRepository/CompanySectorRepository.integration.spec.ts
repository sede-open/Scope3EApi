import { Connection, In } from 'typeorm';
import { CompanySectorRepository } from '.';
import { getOrCreateConnection } from '../../dbConnection';
import { createCompanyMock } from '../../mocks/company';
import { createCompanySectorMockUsingAdminUser } from '../../mocks/companySector';
import {
  sameDivisionAsSector2Mock,
  sameDivisionAsSectorMock,
  sector2Mock,
  sector3Mock,
  sectorMock,
} from '../../mocks/sector';
import { CompanyRepository } from '../CompanyRepository';
import { SectorRepository } from '../SectorRepository';
import { CompanySectorType } from '../../types';

const myPrimarySector = sectorMock;
const mySecondarySector = sector2Mock;
const sectorInTheSameDivisionAsPrimary = sameDivisionAsSectorMock;
const sectorInTheSameDivisionAsSecondary = sameDivisionAsSector2Mock;
const anotherSector = sector3Mock;

const myCompanyId = '';
const companyIdHavingTheSameDivisionSectors = '';
const companyIdHavingThePrimaryDivision = '';
const companyIdHavingTheSecondaryDivision = '';
const companyIdHavingNoCommonDivision = '';

describe('CompanySectorRepository', () => {
  let connection: Connection;
  let companyRepository: CompanyRepository;
  let companySectorRepository: CompanySectorRepository;
  let sectorRepository: SectorRepository;

  const setup = async () => {
    await companyRepository.save(
      [
        myCompanyId,
        companyIdHavingTheSameDivisionSectors,
        companyIdHavingThePrimaryDivision,
        companyIdHavingTheSecondaryDivision,
        companyIdHavingNoCommonDivision,
      ].map((id) => {
        return createCompanyMock({ id });
      })
    );

    await sectorRepository.save([
      myPrimarySector,
      mySecondarySector,
      anotherSector,
      sectorInTheSameDivisionAsPrimary,
      sectorInTheSameDivisionAsSecondary,
    ]);

    await companySectorRepository.save([
      createCompanySectorMockUsingAdminUser({
        companyId: myCompanyId,
        sectorId: myPrimarySector.id,
        sectorType: CompanySectorType.Primary,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: myCompanyId,
        sectorId: mySecondarySector.id,
        sectorType: CompanySectorType.Secondary,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: companyIdHavingTheSameDivisionSectors,
        sectorType: CompanySectorType.Secondary,
        sectorId: myPrimarySector.id,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: companyIdHavingTheSameDivisionSectors,
        sectorType: CompanySectorType.Primary,
        sectorId: mySecondarySector.id,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: companyIdHavingThePrimaryDivision,
        sectorId: sectorInTheSameDivisionAsPrimary.id,
        sectorType: CompanySectorType.Primary,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: companyIdHavingTheSecondaryDivision,
        sectorId: sectorInTheSameDivisionAsSecondary.id,
        sectorType: CompanySectorType.Secondary,
      }),
      createCompanySectorMockUsingAdminUser({
        companyId: companyIdHavingNoCommonDivision,
        sectorId: anotherSector.id,
        sectorType: CompanySectorType.Primary,
      }),
    ]);
  };
  const teardown = async () => {
    await companySectorRepository.delete({
      companyId: In([
        myCompanyId,
        companyIdHavingNoCommonDivision,
        companyIdHavingThePrimaryDivision,
        companyIdHavingTheSecondaryDivision,
        companyIdHavingTheSameDivisionSectors,
      ]),
    });
    await companyRepository.delete([
      myCompanyId,
      companyIdHavingTheSameDivisionSectors,
      companyIdHavingThePrimaryDivision,
      companyIdHavingTheSecondaryDivision,
      companyIdHavingNoCommonDivision,
    ]);
    await sectorRepository.delete([
      myPrimarySector.id,
      mySecondarySector.id,
      anotherSector.id,
      sectorInTheSameDivisionAsPrimary.id,
      sectorInTheSameDivisionAsSecondary.id,
    ]);
  };
  beforeAll(async () => {
    connection = await getOrCreateConnection();
    companyRepository = connection.getCustomRepository(CompanyRepository);
    companySectorRepository = connection.getCustomRepository(
      CompanySectorRepository
    );
    sectorRepository = connection.getCustomRepository(SectorRepository);
  });
  beforeEach(async () => {
    await teardown();
    await setup();
  });
  afterAll(async () => {
    await teardown();
  });
  describe('findCompanyIdsByDivisions', () => {
    it('returns an empty array if no divisions are provided', async () => {
      const companyIds = await companySectorRepository.findCompanyIdsByDivisions(
        [],
        myCompanyId
      );
      expect(companyIds).toEqual([]);
    });

    it('returns only the company ids that have the same division my company sectors', async () => {
      const companyIds = await companySectorRepository.findCompanyIdsByDivisions(
        [myPrimarySector.division, mySecondarySector.division],
        myCompanyId
      );
      expect(companyIds).toEqual([
        companyIdHavingTheSameDivisionSectors,
        companyIdHavingThePrimaryDivision,
        companyIdHavingTheSecondaryDivision,
      ]);
      expect(companyIds.length).toEqual(3);
      expect(companyIds).not.toContain(companyIdHavingNoCommonDivision);
    });
  });
});
