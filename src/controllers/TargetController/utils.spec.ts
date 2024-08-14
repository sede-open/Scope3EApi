import { TargetEntity } from '../../entities/Target';
import { createCarbonIntensityMock } from '../../mocks/carbonIntensities';
import { createTargetMock } from '../../mocks/target';
import {
  CarbonIntensityMetricType,
  TargetPrivacyType,
  TargetScopeType,
  TargetType,
} from '../../types';
import {
  isScope3Valid,
  pairTargets,
  targetPairsToIntensityTargetData,
} from './utils';

describe('TargetController utils', () => {
  const companyId = 'some-company-id';

  describe('isScope3Valid', () => {
    describe('when scope 3 year and reduction are valid numbers', () => {
      describe('when both are positive numbers', () => {
        it('should return true', () => {
          const result = isScope3Valid({
            scope3Reduction: 100,
            scope3Year: 2040,
          });

          expect(result).toBe(true);
        });
      });

      describe('when year is a number and reduction is 0', () => {
        it('should return true', () => {
          const result = isScope3Valid({
            scope3Reduction: 0,
            scope3Year: 2040,
          });

          expect(result).toBe(true);
        });
      });
    });

    describe('when scope 3 year and reduction are both undefined', () => {
      it('should return true', () => {
        const result = isScope3Valid({
          scope3Reduction: undefined,
          scope3Year: undefined,
        });

        expect(result).toBe(true);
      });
    });

    describe('when scope 3 year and reduction are both null', () => {
      it('should return true', () => {
        const result = isScope3Valid({
          scope3Reduction: null,
          scope3Year: null,
        });

        expect(result).toBe(true);
      });
    });

    describe('when scope 3 year is a number and reduction is null', () => {
      it('should return false', () => {
        const result = isScope3Valid({
          scope3Reduction: null,
          scope3Year: 2040,
        });

        expect(result).toBe(false);
      });
    });

    describe('when scope 3 year is a number and reduction is undefined', () => {
      it('should return false', () => {
        const result = isScope3Valid({
          scope3Reduction: undefined,
          scope3Year: 2040,
        });

        expect(result).toBe(false);
      });
    });

    describe('when scope 3 year is a undefined and reduction is a number', () => {
      it('should return false', () => {
        const result = isScope3Valid({
          scope3Reduction: 100,
          scope3Year: undefined,
        });

        expect(result).toBe(false);
      });
    });

    describe('when scope 3 year is a null and reduction is a number', () => {
      it('should return false', () => {
        const result = isScope3Valid({
          scope3Reduction: 100,
          scope3Year: null,
        });

        expect(result).toBe(false);
      });
    });
  });

  describe(pairTargets.name, () => {
    it('should match target entities into a target pair object', () => {
      const absoluteScope12Mock = (createTargetMock({
        id: '123',
        scopeType: TargetScopeType.Scope_1_2,
        companyId,
        targetType: TargetType.Absolute,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      const absoluteScope3Mock = (createTargetMock({
        id: '456',
        scopeType: TargetScopeType.Scope_3,
        companyId,
        targetType: TargetType.Absolute,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      const intensityScope12Mock = (createTargetMock({
        id: '789',
        scopeType: TargetScopeType.Scope_1_2,
        companyId,
        targetType: TargetType.Intensity,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      expect(
        pairTargets([
          absoluteScope12Mock,
          absoluteScope3Mock,
          intensityScope12Mock,
        ])
      ).toEqual([
        {
          scope1And2Target: absoluteScope12Mock,
          scope3Target: absoluteScope3Mock,
        },
        {
          scope1And2Target: intensityScope12Mock,
          scope3Target: undefined,
        },
      ]);
    });

    it('should not pair targets from mismatched companies', () => {
      const absoluteScope12Mock = (createTargetMock({
        id: '123',
        scopeType: TargetScopeType.Scope_1_2,
        companyId,
        targetType: TargetType.Absolute,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      const absoluteScope3Mock = (createTargetMock({
        id: '456',
        scopeType: TargetScopeType.Scope_3,
        companyId: `${companyId}-different`,
        targetType: TargetType.Absolute,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      expect(pairTargets([absoluteScope12Mock, absoluteScope3Mock])).toEqual([
        {
          scope1And2Target: absoluteScope12Mock,
          scope3Target: undefined,
        },
      ]);
    });

    it('should omit any scope3 targets without a corresponding scope_1_2', () => {
      const absoluteScope3Mock = (createTargetMock({
        id: '456',
        scopeType: TargetScopeType.Scope_3,
        companyId,
        targetType: TargetType.Absolute,
        createdBy: 'me',
        updatedBy: 'me',
      }) as unknown) as TargetEntity;

      expect(pairTargets([absoluteScope3Mock])).toEqual([]);
    });
  });

  describe('targetPairsToIntensityTargetData', () => {
    it('should add one new record for each carbon intensity attached to a scope_1_2 target', () => {
      const absoluteScope12Mock = (createTargetMock({
        id: '123',
        scopeType: TargetScopeType.Scope_1_2,
        companyId,
        targetType: TargetType.Intensity,
        createdBy: 'me',
        updatedBy: 'me',
        carbonIntensities: [
          createCarbonIntensityMock({
            id: 'carb-id-1',
            intensityMetric: CarbonIntensityMetricType.LitrePacked,
            intensityValue: 8000,
            companyId,
            createdBy: 'me',
            updatedBy: 'me',
            emissionId: 'xxx',
          }),
          createCarbonIntensityMock({
            id: 'carb-id-2',
            intensityMetric: CarbonIntensityMetricType.Km,
            intensityValue: 200,
            companyId,
            createdBy: 'me',
            updatedBy: 'me',
            emissionId: 'xxx',
          }),
        ],
      }) as unknown) as TargetEntity;

      expect(
        targetPairsToIntensityTargetData([], {
          scope1And2Target: absoluteScope12Mock,
        })
      ).toEqual([
        {
          includeCarbonOffset: false,
          intensityMetric: 'LITRE_PACKED',
          intensityValue: 8000,
          scope1And2Reduction: 80,
          scope1And2Year: 2035,
          scope1And2PrivacyType: TargetPrivacyType.Public,
          scope3Reduction: undefined,
          scope3Year: undefined,
          scope3PrivacyType: undefined,
          strategy: 'PASSIVE',
          companyId,
        },
        {
          includeCarbonOffset: false,
          intensityMetric: 'KM',
          intensityValue: 200,
          scope1And2Reduction: 80,
          scope1And2Year: 2035,
          scope1And2PrivacyType: TargetPrivacyType.Public,
          scope3Reduction: undefined,
          scope3Year: undefined,
          scope3PrivacyType: undefined,
          strategy: 'PASSIVE',
          companyId,
        },
      ]);
    });
  });
});
