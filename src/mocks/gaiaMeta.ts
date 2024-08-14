import { AppMetaName } from '../constants/appMeta';

export const dnbTokenMock = {
  id: '73c00e54-b3aa-4aac-8304-f761e9b25874',
  name: AppMetaName.DNB_TOKEN,
  value: JSON.stringify({
    access_token: 'djskkhjshdjsahdjksahdjkhjs',
    expiresIn: '888888',
  }),
  createdAt: '2020-08-27 09:11:00',
};

export const dnbTokenMock2 = {
  id: '73c00e54-b3aa-4aac-8304-f761e9b25894',
  name: AppMetaName.DNB_TOKEN,
  value: JSON.stringify({
    access_token: 'aaaaaaaaaaaaaaaaa',
    expiresIn: '888888',
  }),
  createdAt: '2020-09-27 09:11:00',
};
