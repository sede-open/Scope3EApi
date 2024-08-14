module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.unit.setup.ts'],
  modulePathIgnorePatterns: [
    '<rootDir>/build/',
    '<rootDir>/src/resolvers',
    '<rootDir>/src/routes',
  ],
  testPathIgnorePatterns: ['.*\\.integration\\.spec\\.ts$'],
};
