import baseConfig from './ormconfig';

module.exports = {
  ...baseConfig,
  requestTimeout: 30000,
};
