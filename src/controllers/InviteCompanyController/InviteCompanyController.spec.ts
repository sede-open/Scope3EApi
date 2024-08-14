import { IInviteCompany, InviteCompanyController } from '.';
import { IContext } from '../../apolloContext';
import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { supplierEditorUserMock } from '../../mocks/user';
import { FORBIDDEN_INPUT, INVALID_EMAIL } from '../../utils/errorStrings';

jest.mock('../../jobs/tasks/email/queue');

const basePayload: IInviteCompany = {
  inviter: {
    name: 'Mr Inviter',
    email: 'inviter@ok.yes',
    company: 'Example',
  },
  invitee: {
    name: 'Ms Invitee',
    email: 'invitee@hmm.maybe',
    company: 'Mobil',
  },
};

describe('inviteCompanyEmail()', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  const controller = new InviteCompanyController();
  const mockContext = ({
    user: supplierEditorUserMock,
  } as unknown) as IContext;

  it('should send a correctly-formatted email to the email send queue', async () => {
    await controller.inviteCompanyEmail(basePayload, mockContext);

    expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'New company invite request',
      })
    );
  });

  // There doesn't seem to be a clean way to type
  // a tagged template while using done(), so an array
  // of arguments is used here instead
  it.each([
    [
      FORBIDDEN_INPUT,
      {
        inviter: {
          ...basePayload.inviter,
          company: 'Hello <strong>there</strong>',
        },
      },
    ],
    [
      FORBIDDEN_INPUT,
      {
        inviter: {
          ...basePayload.inviter,
          name: 'Hello <strong>there</strong>',
        },
      },
    ],
    [
      FORBIDDEN_INPUT,
      {
        invitee: {
          ...basePayload.invitee,
          company: 'Hello <strong>there</strong>',
        },
      },
    ],
    [
      FORBIDDEN_INPUT,
      {
        invitee: {
          ...basePayload.invitee,
          name: 'Hello <strong>there</strong>',
        },
      },
    ],
    [
      INVALID_EMAIL,
      {
        inviter: {
          ...basePayload.inviter,
          email: 'adff@',
        },
      },
    ],
    [
      INVALID_EMAIL,
      {
        invitee: {
          ...basePayload.invitee,
          email: '@lksjdfdkls.com',
        },
      },
    ],
  ])(
    'should throw an error if $expectedError',
    async (expectedError: string, invalidInput: Partial<IInviteCompany>) => {
      const controller = new InviteCompanyController();

      try {
        await controller.inviteCompanyEmail(
          {
            ...basePayload,
            ...invalidInput,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(expectedError);
        expect(addJobSendEmailToQueue).not.toHaveBeenCalled();
      }
      expect.assertions(2);
    }
  );
});
