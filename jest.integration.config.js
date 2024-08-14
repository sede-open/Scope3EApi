module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['<rootDir>/build/'],
  setupFilesAfterEnv: ['<rootDir>/jest.integration.setup.ts'],
  testMatch: [
    '<rootDir>/src/resolvers/**/*.spec.ts',
    '<rootDir>/src/routes/**/*.spec.ts',
    '<rootDir>/src/**/*.integration.spec.ts',
  ],
  testTimeout: 10000,
};
