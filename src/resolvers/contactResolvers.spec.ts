import fetch from 'node-fetch';

import { getApolloServer } from '../apollo';
import { authenticateUser } from '../auth';
import { getCurrentUser } from '../mocks/user';
import { EmailEnquiry, RoleName } from '../types';
import { getOrCreateConnection } from '../dbConnection';
import { RoleRepository } from '../repositories/RoleRepository';

jest.mock('node-fetch');
jest.mock('../auth');

describe('contactResolvers', () => {
  const validPayload = {
    name: 'Test McTest',
    email: 'test@test.com',
    company: 'Testing Ltd',
    enquiries: [EmailEnquiry.GeneralEnquiry],
    message: 'I need help',
    consent: true,
  };

  const textWithDangarousCharacters = '<svg/ onload="https://test.com"';
  const sanitisedText =
    '&lt;svg&#x2F; onload=&quot;https:&#x2F;&#x2F;test.com&quot;';

  const mulesoftSuccessMessage = 'Email successfully sent to recipient.';

  const enquiryEmailMutation = `
    mutation($input: EnquiryEmailInput!) {
      enquiryEmail(input: $input)
    }
  `;

  describe('enquiryEmail', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    describe.each`
      role
      ${RoleName.Admin}
      ${RoleName.SupplierEditor}
      ${RoleName.SupplierViewer}
    `('when user is a $role', ({ role }: { role: RoleName }) => {
      describe('when payload is valid', () => {
        beforeEach(async () => {
          const connection = await getOrCreateConnection();
          const roleRepository = connection.getCustomRepository(RoleRepository);
          const roles = await roleRepository.findAssumedRolesForRoleName(role);

          ((authenticateUser as unknown) as jest.Mock).mockImplementation(
            () => ({
              user: getCurrentUser({
                roles,
              }),
            })
          );

          ((fetch as unknown) as jest.Mock).mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue(mulesoftSuccessMessage),
          });
        });

        it('should send an enquiry email', async () => {
          const server = getApolloServer();

          const result = await server.executeOperation({
            query: enquiryEmailMutation,
            variables: { input: validPayload },
          });

          expect(result.data?.enquiryEmail).toBe(mulesoftSuccessMessage);
          expect(result.errors).toBeUndefined();
        });
      });

      describe('when an invalid email address is given', () => {
        it('should respond with error', async () => {
          const server = getApolloServer();

          const invalidEmail = 'test@test';
          const result = await server.executeOperation({
            query: enquiryEmailMutation,
            variables: { input: { ...validPayload, email: invalidEmail } },
          });

          expect(result.data?.enquiryEmail).toBeUndefined();
          expect(result.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: `Variable "$input" got invalid value "${invalidEmail}" at "input.email"; Expected type "Email". Value is not a valid email address: ${invalidEmail}`,
              }),
            ])
          );
        });
      });

      describe('when an invalid name is given', () => {
        it('should respond with error', async () => {
          const server = getApolloServer();

          const invalidName = 'Testing!';
          const result = await server.executeOperation({
            query: enquiryEmailMutation,
            variables: { input: { ...validPayload, name: invalidName } },
          });

          expect(result.data?.enquiryEmail).toBeUndefined();
          expect(result.errors).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                message: `Variable "$input" got invalid value "${invalidName}" at "input.name"; Expected type "UserName". Value contains forbidden characters: ${invalidName}`,
              }),
            ])
          );
        });
      });

      describe.each`
        override
        ${'company'}
        ${'message'}
      `(
        'when text input contains forbidden characters',
        ({ override }: { override: string }) => {
          it('should be sanitised', async () => {
            const server = getApolloServer();

            const result = await server.executeOperation({
              query: enquiryEmailMutation,
              variables: {
                input: {
                  ...validPayload,
                  [override]: textWithDangarousCharacters,
                },
              },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data?.enquiryEmail).toBe(mulesoftSuccessMessage);

            const [
              [, fetchCallBody],
            ] = ((fetch as unknown) as jest.Mock).mock.calls;
            expect(fetchCallBody.body).toContain(sanitisedText);
            expect(fetchCallBody.body).not.toContain(
              textWithDangarousCharacters
            );
          });
        }
      );
    });
  });
});
