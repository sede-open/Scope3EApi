import {
  getConectionApprovedTemplate,
  message,
  ctaText,
  ctaRoute,
} from './connectionApproved';

describe('getConectionApprovedTemplate()', () => {
  const connectionName = 'Some company name';
  const ctaLink = 'clickity.com';

  describe.each`
    connectionType
    ${'supplier'}
    ${'customer'}
  `(
    'when email receiver represents a $connectionType',
    ({ connectionType }: { connectionType: 'supplier' | 'customer' }) => {
      it('should render correct connection name', () => {
        const result = getConectionApprovedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(connectionName);
      });

      it('should render correct cta link', () => {
        const result = getConectionApprovedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(ctaLink + ctaRoute[connectionType]);
      });

      it('should render correct cta text', () => {
        const result = getConectionApprovedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(ctaText[connectionType]);
      });

      it('should render correct connection type', () => {
        const result = getConectionApprovedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(connectionType);
      });

      it('should render correct message', () => {
        const connectionType = 'customer';
        const connectionName = 'Some company name';
        const ctaLink = 'clickity.com';

        const result = getConectionApprovedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(message[connectionType]);
      });
    }
  );
});
