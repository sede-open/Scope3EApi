import { getCompanyRejectedInvitationTemplate } from './companyRejectedInvitation';

describe('getcompanyRejectedInvitationTemplate()', () => {
  const inviteeName = 'some-invitee-name';
  const companyName = 'some-company-name';
  it('should render correct invitee name and correct company name', () => {
    const result = getCompanyRejectedInvitationTemplate({
      inviteeName,
      companyName,
    });

    expect(result.template).toContain(inviteeName);
    expect(result.template).toContain(companyName);
  });
});
