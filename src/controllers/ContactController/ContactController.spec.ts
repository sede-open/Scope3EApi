import { ContactController, IContactRequest } from '.';
import { IContext } from '../../apolloContext';
import { EmailEnquiry, EnquiryEmailInput, RegionName } from '../../types';
import { ENQUIRY_NOT_SENT, FORBIDDEN_INPUT } from '../../utils/errorStrings';

const baseRequest: EnquiryEmailInput = {
  consent: true,
  email: 'test@place.ok',
  company: 'test company',
  enquiries: [EmailEnquiry.Co2CaptureTechnology, EmailEnquiry.Hydrogen],
  message: 'Valid message input',
  name: 'Dr Person',
  regions: [RegionName.Africa, RegionName.Americas],
};

describe('ContactController', () => {
  it('should call mulesoft sendEmail with valid payload', async () => {
    const sendEmail = jest.fn().mockReturnValue({
      message: 'ok',
    });

    const mockContext = ({
      clients: {
        mulesoft: {
          sendEmail,
        },
      },
    } as unknown) as IContext;

    const controller = new ContactController();
    await controller.enquiryEmail(baseRequest, mockContext);

    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'MULTIPLE SOLUTIONS ENQUIRY',
      })
    );
  });

  describe('when mulesoft fails to send an email', () => {
    it('should throw a generic error', async () => {
      const sendEmail = jest.fn().mockRejectedValue('Mulesoft fail');

      const mockContext = ({
        clients: {
          mulesoft: {
            sendEmail,
          },
        },
      } as unknown) as IContext;

      const controller = new ContactController();

      expect.assertions(1);

      try {
        await controller.enquiryEmail(baseRequest, mockContext);
      } catch (err) {
        expect(err.message).toBe(ENQUIRY_NOT_SENT);
      }
    });
  });

  it.each`
    expectedError      | invalidInput
    ${FORBIDDEN_INPUT} | ${{ message: 'Hello <strong>there</strong>' }}
    ${FORBIDDEN_INPUT} | ${{ name: 'Hello <a href="url">there</a>' }}
  `(
    'should throw an error if $expectedError',
    async ({
      expectedError,
      invalidInput,
    }: {
      expectedError: string;
      invalidInput: Pick<IContactRequest, 'message' | 'name'>;
    }) => {
      const sendEmail = jest.fn();

      const mockContext = ({
        clients: {
          mulesoft: {
            sendEmail,
          },
        },
      } as unknown) as IContext;

      const controller = new ContactController();

      try {
        await controller.enquiryEmail(
          {
            ...baseRequest,
            ...invalidInput,
          },
          mockContext
        );
      } catch (err) {
        expect(err.message).toBe(expectedError);
        expect(sendEmail).not.toHaveBeenCalled();
      }
    }
  );
});
