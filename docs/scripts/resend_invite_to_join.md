# Csv Resend Invite To Join

This script is used when company upload script failed to upload the data to HubSpot. It reads the company data from the csv file, finds the company and the user and uploads the data to HubSpot. **src/scripts/resendInviteToJoin/index.ts**. The directory contains a Template file for the structure the data should be uploaded in, this called **Template.csv**. Reading of the data starts at row 2 of the provided template.

Firstly a validation check will run on all rows. If there is an error in any row of data, no data will be uploaded and errors will be outputted in a file called **csvErrors.json**. This is generated after the script has finished and is located in the directory **src/scripts/resendInviteToJoin/**

Secondly, once the rows have all been validated, they will then be uploaded sequentially to HubSpot.

If an error occurs that row will not have been uploaded. If there is not error then the row has been uploaded.
To view all Server Errors and Successful uploads you can view them in the corresponding files: **src/scripts/resendInviteToJoin/serverErrors.json** and **src/scripts/resendInviteToJoin/serverSuccessResponses.json**

## Envs

There are a number of environment variables to be added to your .env for the script to read:

| Name | Description | Required
------------- | ------------- | -------------
HUBSPOT_CRM_TOKEN | Make sure the right environment token is used | Yes
INVITE_JWT_SECRET | The secret of the environment used in generating the invite token | Yes
JWT_ISSUER | The api host of the application | Yes
WEB_APP_BASE_URL | The base URL of the client application | Yes


To run the command do:

```
npx ts-node src/scripts/resendInviteToJoin/index.ts --csvPath='src/scripts/resendInviteToJoin/Template.csv' --inviterId='9AE3D621-9BD5-4719-9BDF-5570D4A83AC7'
```

## Node version

Use v18 or higher.
