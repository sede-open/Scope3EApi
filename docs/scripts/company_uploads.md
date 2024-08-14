# Csv Company Upload

This script uploads a csv of company data. **src/scripts/companyUpload/index.ts**. The directory contains a Template file for the structure the data should be uploaded in, this called **Template.csv**. Reading of the data starts at row 2 of the provided template.

Firstly a validation check will run on all rows. If there is an error in any row of data, no data will be uploaded and errors will be outputted in a file called **csvErrors.json**. This is generated after the script has finished and is located in the directory **src/scripts/companyUpload/**

Secondly, once the rows have all been validated, they will then be uploaded sequentially to the server. There are a number of errors you could get back from this API. The common ones are:

| Error Status        | Graphql Error          | Description                                                                                    |
| ------------------- | ---------------------- | ---------------------------------------------------------------------------------------------- |
| 400 ERR_BAD_REQUEST | NA                     | Usually the JWT has expired, you will need to generate a new one                               |
| 400 ECONNREFUSED    | NA                     | The server can't be reached. Is your serverUrl correct or has the server crashed / not started |
| 200                 | Company already exists | The companyDuns number already exists inside the companies table.                              |
| 200                 | User already exists    | The email already exists in the users table.                                                   |

If an error occurs that row will not have been uploaded. If there is not error then the row has been uploaded.
To view all Server Errors and Successful uploads you can view them in the corresponding files: **src/scripts/companyUpload/serverErrors.json** and **src/scripts/companyUpload/serverSuccessResponses.json**

## Envs

There are a number of environment variables to be added to your .env for the script to read:

| Name | Description | Required
------------- | ------------- | -------------
BATCH_COMPANY_UPLOAD_JWT_TOKEN | jwt token from the server environment you are targetting | YES
FAKE_JSON_SERVER | The url the fake json server runs | NO
FAKE_JSON_SERVER_ENABLED | Enables the fake json server to mock companyDuns requests | NO

To run the command do:

```
npx ts-node src/scripts/companyUpload/index.ts --csvPath='src/scripts/companyUpload/Template.csv' --serverUrl='http://localhost:4000/graphql'
```

## Node version

Use v18 or higher.
