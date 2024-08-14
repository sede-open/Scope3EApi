# Emails

The application has two systems for sending emails:

- Hubspot
- Mulesoft

## Hubspot

Hubspot is an external service provider for sending transactional emails and multi-email campaigns. We have built a large amount of email sending logic using Hubspot's automation services. This logic is contained within the Hubspot platform.

TODO @HrayrPetrosyan to fill out more logic here.

More information can be found on this [Confluence page](https://atlassian.net/wiki/spaces/APP/pages/3470262285/Transactional+Emails) for more information.

### Hubspot Development

Before testing any Hubspot functionality on non-production environments please make sure that the recipient email address is whitelisted.

For that please update `WHITELISTED_EMAILS` array in the `src/constants/hubspot.ts` file.

This has been added to ensure emails are not sent mistakenly from non-production environments.

## Mulesoft

Mulesoft is a legacy tool which was superceded by Hubspot. It is still used for some emails, but new emails should be added to Hubspot.

## Sending Emails

For both platforms we send emails using a job queue. This is to ensure that emails are sent in a reliable way and that we don't overload the email sending service or slow response times.

```typescript
addJobSendEmailToQueue(...params...)
```

For the **HubSpot** transactional emails there is a separate processor within the same queue. Please use the following method while creating new methods for HubspotEmailClient:

```typescript
addJobSendHubspotEmailToQueue(...params...)
```
