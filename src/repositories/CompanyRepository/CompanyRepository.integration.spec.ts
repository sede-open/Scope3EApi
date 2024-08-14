import { Connection } from 'typeorm';
import { getOrCreateConnection } from '../../dbConnection';
import { createCompanyMock } from '../../mocks/company';
import { createUserMock } from '../../mocks/user';
import { RoleName } from '../../types';
import { UserRepository } from '../UserRepository';
import { CompanyRepository } from '.';
import { teardownPreviousDbState } from '../../../jest.integration.setup';

describe('CompanyRepository', () => {
  let connection: Connection;
  let companyRepository: CompanyRepository;
  let userRepository: UserRepository;

  const meId = '';

  const companyWithDunsId = '';

  const companyWithoutDunsId = '';

  const duns = '123456789';

  const setup = async () => {
    await userRepository.save([
      await createUserMock({ id: meId, companyId: undefined }, RoleName.Admin),
    ]);

    await companyRepository.save([
      createCompanyMock({
        id: companyWithDunsId,
        duns,
        dnbCountry: 'UK',
        dnbCountryIso: undefined,
      }),
      createCompanyMock({
        id: companyWithoutDunsId,
        duns: undefined,
        dnbCountry: undefined,
        dnbCountryIso: undefined,
      }),
    ]);
  };

  const teardown = async () => {
    await teardownPreviousDbState(connection);
    await companyRepository.delete([companyWithDunsId, companyWithoutDunsId]);
    await userRepository.deleteUsers([meId]);
  };

  describe('companiesWithDuns', () => {
    beforeAll(async () => {
      connection = await getOrCreateConnection();
      companyRepository = connection.getCustomRepository(CompanyRepository);
      userRepository = connection.getCustomRepository(UserRepository);
    });

    afterAll(async () => {
      await teardown();
    });

    beforeEach(async () => {
      await teardown();
      await setup();
    });

    it('should only return companies which have a duns number defined', async () => {
      const data = await companyRepository.companiesWithDuns();

      expect(data).toHaveLength(1);
      expect(data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            duns,
            id: companyWithDunsId,
          }),
        ])
      );
    });
  });
});
