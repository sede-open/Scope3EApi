import { addJobSendEmailToQueue } from '../../jobs/tasks/email/queue';
import { getInviteToJoinTemplate } from '../../emailTemplates/inviteToJoin';
import * as newCompanyToVetTemplateUtils from '../../emailTemplates/newCompanyToVet';
import * as inviterVetoTemplateUtils from '../../emailTemplates/companyVetoedForInviter';
import * as inviteeVetoTemplateUtils from '../../emailTemplates/companyVetoedForInvitee';
import * as welcomeNewTemplateUtils from '../../emailTemplates/welcomeToNewAkamaiUser';
import * as welcomeExistingTemplateUtils from '../../emailTemplates/welcomeToExistingAkamaiUser';
import * as userRemovedFromCompanyUtils from '../../emailTemplates/userRemovedFromCompany';
import { NotificationClient } from '.';
import { UserEntity } from '../../entities/User';
import {
  supplierEditorUser2Mock,
  supplierEditorUserMock,
} from '../../mocks/user';
import { CompanyEntity } from '../../entities/Company';
import { companyMock } from '../../mocks/company';

jest.mock('../../jobs/tasks/email/queue');
jest.mock('../../emailTemplates/inviteToJoin');

describe('NotificationClient', () => {
  const client = new NotificationClient();

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('notifyOfInviteToJoin()', () => {
    beforeEach(() => {
      ((getInviteToJoinTemplate as unknown) as jest.Mock).mockImplementation(
        () => ({ template: '', subject: '' })
      );
    });

    it('will get template and all addJobSendEmailToQueue()', () => {
      const sender = ({
        ...supplierEditorUserMock,
        company: { name: 'Company A' },
      } as unknown) as UserEntity;
      const recipient = (supplierEditorUser2Mock as unknown) as UserEntity;

      client.notifyOfInviteToJoin({ sender, recipient });

      expect(getInviteToJoinTemplate).toHaveBeenCalledTimes(1);
      expect(getInviteToJoinTemplate).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteeName: recipient.firstName,
          inviterName: `${sender.firstName} ${sender.lastName}`,
          inviterCompanyName: sender.company!.name,
          inviteLink: expect.any(String),
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: recipient.email,
        })
      );
    });
  });

  describe('notifyOfCompanyToBeVetted()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(newCompanyToVetTemplateUtils, 'getNewCompanyToVetTemplate');

      const company = (companyMock as unknown) as CompanyEntity;

      client.notifyOfCompanyToBeVetted({ company });

      expect(
        newCompanyToVetTemplateUtils.getNewCompanyToVetTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        newCompanyToVetTemplateUtils.getNewCompanyToVetTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          companyName: company.name,
          companyCountry: company.dnbCountry,
          ctaLink: 'localhost:3000/admin-dashboard/users',
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: process.env.XYZ_EMAIL_ADDRESS,
          subject: 'A new company is ready to be vetted',
          body: expect.any(String),
        })
      );
    });
  });

  describe('notifyInviterOfVetoedCompany()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(inviterVetoTemplateUtils, 'getCompanyVetoedInviterTemplate');

      const recipient = (supplierEditorUser2Mock as unknown) as UserEntity;
      const inviteeCompanyName = 'Trali vali ltd';
      const inviteeName = 'Test McTest';

      client.notifyInviterOfVetoedCompany({
        inviteeName,
        inviteeCompanyName,
        recipient,
      });

      expect(
        inviterVetoTemplateUtils.getCompanyVetoedInviterTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        inviterVetoTemplateUtils.getCompanyVetoedInviterTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          inviteeName,
          inviteeCompanyName,
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: recipient.email,
          subject: 'Invitation to join the Hub failed',
          body: expect.any(String),
        })
      );
    });
  });

  describe('notifyInviteeOfVetoedCompany()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(inviteeVetoTemplateUtils, 'getCompanyVetoedInviteeTemplate');

      const recipient = (supplierEditorUser2Mock as unknown) as UserEntity;

      client.notifyInviteeOfVetoedCompany({
        recipient,
      });

      expect(
        inviteeVetoTemplateUtils.getCompanyVetoedInviteeTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        inviteeVetoTemplateUtils.getCompanyVetoedInviteeTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          hubCTA: process.env.WEB_APP_BASE_URL,
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: recipient.email,
          subject: 'Registration unsuccessful',
          body: expect.any(String),
        })
      );
    });
  });

  describe('notifyNewAkamaiUserWelcome()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(welcomeNewTemplateUtils, 'getWelcomeToNewAkamaiUserTemplate');

      const recipient = (supplierEditorUser2Mock as unknown) as UserEntity;

      client.notifyNewAkamaiUserWelcome({
        recipient,
      });

      expect(
        welcomeNewTemplateUtils.getWelcomeToNewAkamaiUserTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        welcomeNewTemplateUtils.getWelcomeToNewAkamaiUserTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          hubCTA: process.env.WEB_APP_BASE_URL,
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: recipient.email,
          subject: 'Welcome to the Hub',
          body: expect.any(String),
        })
      );
    });
  });

  describe('notifyExistingAkamaiUserWelcome()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(
        welcomeExistingTemplateUtils,
        'getWelcomeToExistingAkamaiUserTemplate'
      );

      const recipient = (supplierEditorUser2Mock as unknown) as UserEntity;

      client.notifyExistingAkamaiUserWelcome({
        recipient,
      });

      expect(
        welcomeExistingTemplateUtils.getWelcomeToExistingAkamaiUserTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        welcomeExistingTemplateUtils.getWelcomeToExistingAkamaiUserTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          signInCTA: `${process.env.WEB_APP_BASE_URL}/auth/akamai`,
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: recipient.email,
          subject: 'Welcome to the Hub',
          body: expect.any(String),
        })
      );
    });
  });

  describe('notifyUserRemovedFromCompany()', () => {
    it('will get template and all addJobSendEmailToQueue()', () => {
      jest.spyOn(
        userRemovedFromCompanyUtils,
        'getUserRemovedFromCompanyTemplate'
      );

      const removedUserEmail = 'test@test.com';

      client.notifyUserRemovedFromCompany({
        removedUserEmail,
      });

      expect(
        userRemovedFromCompanyUtils.getUserRemovedFromCompanyTemplate
      ).toHaveBeenCalledTimes(1);

      expect(
        userRemovedFromCompanyUtils.getUserRemovedFromCompanyTemplate
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          removedUserEmail,
        })
      );

      expect(addJobSendEmailToQueue).toHaveBeenCalledTimes(1);
      expect(addJobSendEmailToQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: process.env.XYZ_EMAIL_ADDRESS,
          subject:
            userRemovedFromCompanyUtils.USER_REMOVED_FROM_COMPANY_SUBJECT,
          body: expect.any(String),
        })
      );
    });
  });
});
