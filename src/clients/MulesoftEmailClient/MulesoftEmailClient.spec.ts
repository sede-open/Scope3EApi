import fetch from 'node-fetch';
import { MulesoftEmailClient } from '.';

jest.mock('node-fetch');

const emailApiUrl = 'some.fake.mail.api';
const emailClientId = '<some client id>';
const emailClientSecret = '<some client secret>';

const email = {
  body: 'Some body',
  recipient: 'Test recipient',
  subject: 'Test subject',
  from: 'no-reply@some-domain.com',
};

describe('MulesoftEmailClient', () => {
  it('should correctly forward mail requests to the Email API', async () => {
    ((fetch as unknown) as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'email sent successfully' }),
      statusText: 'OK',
      status: 200,
    });

    const client = new MulesoftEmailClient(
      emailApiUrl,
      emailClientId,
      emailClientSecret
    );

    const request = await client.sendEmail(email);

    expect(request).toEqual({
      message: 'Email successfully sent to recipient.',
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith('some.fake.mail.api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        client_id: '<some client id>',
        client_secret: '<some client secret>',
      },
      body: `{"ContentType":"text/html","emailBody":"Some body","fromEmail":"no-reply@some-domain.com","subject":"Test subject","toEmail":"Test recipient"}`,
    });
  });

  it('should throw gracefully if the API returns a bad request', async () => {
    ((fetch as unknown) as jest.Mock).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          correlationId: '05bc2eb0-0fb8-11eb-a5b1-023a9e11dce8',
          exception: {
            exceptionCode: 'BAD_REQUEST',
            timeStamp: '2020-10-16T13:46:33',
            cause:
              'Description: /toEmail expected type: String, found: JSONArray  Location:   Position: Line 0,  Column 0',
          },
        }),
      statusText: 'Bad Request',
      status: 400,
    });

    const client = new MulesoftEmailClient(
      emailApiUrl,
      emailClientId,
      emailClientSecret
    );

    const request = client.sendEmail(email);

    expect.assertions(1);

    await expect(request).rejects.toThrowError(
      'Email send request failed: HTTP 400, message: "Description: /toEmail expected type: ' +
        'String, found: JSONArray  Location:   Position: Line 0,  Column 0" (correlation ID: ' +
        '05bc2eb0-0fb8-11eb-a5b1-023a9e11dce8).'
    );
  });

  it('should throw gracefully if the API returns an internal server error', async () => {
    ((fetch as unknown) as jest.Mock).mockResolvedValue({
      ok: false,
      json: () =>
        Promise.resolve({
          correlationId: 'ff6c0aa0-0fb5-11eb-a5b1-023a9e11dce8',
          exception: {
            exceptionCode: 'INTERNAL_SERVER_ERROR',
            timeStamp: '2020-10-16T13:46:33',
            cause:
              "Description: HTTP POST on resource 'some.fake.mail.api' failed: internal server error (500)",
          },
        }),
      statusText: 'Internal Server Error',
      status: 500,
    });

    const client = new MulesoftEmailClient(
      emailApiUrl,
      emailClientId,
      emailClientSecret
    );

    const request = client.sendEmail(email);

    expect.assertions(1);

    await expect(request).rejects.toThrowError(
      'Email send request failed: HTTP 500, message: "Description: HTTP POST on resource ' +
        "'some.fake.mail.api' failed: internal server error (500)\" (correlation ID: " +
        'ff6c0aa0-0fb5-11eb-a5b1-023a9e11dce8).'
    );
  });
});
