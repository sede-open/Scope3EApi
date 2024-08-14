import { LaunchDarklyClient } from './src/clients/LaunchDarklyClient';
import RedisMock from 'ioredis-mock';

/* https://github.com/stipsan/ioredis-mock/issues/1095 */
class IoRedisMock extends RedisMock {
  constructor(opts: { lazyConnect: boolean }) {
    super(opts);
    this.lazyConnect = opts && opts?.lazyConnect;
  }

  get status() {
    return this.connected ? 'ready' : this.lazyConnnect ? 'wait' : 'end';
  }

  disconnect() {
    process.nextTick(() => this.emit('end'));
    super.disconnect();
    this.connected = false;
  }
}

jest.setMock('ioredis', IoRedisMock);

process.env.JWT_ISSUER = 
process.env.INVITE_JWT_SECRET = 
process.env.WEB_APP_BASE_URL = 
process.env.XYZ_EMAIL_ADDRESS = 
process.env.AKAMAI_CLIENT_ID = 
process.env.AKAMAI_SECRET = 
process.env.AKAMAI_REGISTRATION_REDIRECT = 
process.env.AUTH_AUTH_SECRET = 
process.env.AUTH_CLIENT_ID = 
process.env.AUTH_CLIENT_SECRET = 
process.env.AUTH_TOKEN_API = 

jest.setTimeout(30000);

afterAll(async () => {
  if (LaunchDarklyClient.hasInstance()) {
    const client = (await LaunchDarklyClient.getInstance()).getClient();
    client.close();
  }
});
