import { getConectionRejectedTemplate, message } from './connectionRejected';

describe('getConectionRejectedTemplate()', () => {
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
        const result = getConectionRejectedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(connectionName);
      });

      it('should render correct cta link', () => {
        const result = getConectionRejectedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(ctaLink);
      });

      it('should render correct connection type', () => {
        const result = getConectionRejectedTemplate({
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

        const result = getConectionRejectedTemplate({
          connectionName,
          ctaLink,
          connectionType,
        });

        expect(result.template).toContain(message[connectionType]);
      });
    }
  );
});
