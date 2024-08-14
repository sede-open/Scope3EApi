import { CorporateEmissionAccessEntity } from '../entities/CorporateEmissionAccess';
import { CorporateEmissionAccess } from '../services/CorporateEmissionAccessService/types';
import { CorporateEmissionAccessInput } from '../types';

export const getCorporateEmissionAccessMock = (
  attributes?: Partial<CorporateEmissionAccessInput> & {
    id?: string;
    emissionId?: string;
  }
) => ({
  scope1And2: false,
  scope3: false,
  carbonIntensity: false,
  carbonOffsets: false,
  publicLink: null,
  ...attributes,
});

export const createCorporateEmissionAccessMock = (
  attributes?: Partial<CorporateEmissionAccessEntity>
): Partial<CorporateEmissionAccess> => ({
  emissionId: 'testEmissionId',
  scope1And2: false,
  scope3: false,
  carbonIntensity: false,
  carbonOffsets: false,
  publicLink: null,
  ...attributes,
});
