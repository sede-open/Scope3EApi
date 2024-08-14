# Testing

The project supports a unit, integration and E2E tests. Unit and Integration tests are written using the [Jest](https://jestjs.io/) framework, and integration tests are written using [Playwright](https://playwright.dev/).

## How to define tests

A unit test or an integration test is defined by the folder in which it is placed, or by the file pattern it follows.

### Unit tests

Unit test patterns can be found in the [jest.unit.config.js](../../jest.unit.config.js) file.

At the time of writing, unit tests are defined by the following patterns:

- `src/**/*.spec.ts` in any folder outside of `src/resolvers/` and `src/routes/`

Any attempts to connect to the database in a unit test will result in an error.

### Integration tests

Integration test path patterns can be found in the [jest.integration.config](../../jest.integration.config.js) file, under the `testMatch` property.

At time of writing the following paths and patterns will execute integration tests:

- Spec files in the `src/resolvers/**/*.spec.ts` folder.
- Spec files in the `src/routes/**/*.spec.ts` folder.
- Files ending in `src/**/*.integration.spec.ts` that exist outside of the above two folders.

### E2E tests

TODO ONCE PLAYWRIGHT PR IS MERGED

## Testing Standards

It is expected that any new code will be covered by unit tests and integration tests. Integration tests should ideally cover all the code paths in a resolver or route, and unit tests should cover all the code paths in a function.

### When to write an integration test

We should aim to write integration tests for code at the transport layer and at the repository layer. You can read more information about what these layers are in the [Repo Structure](../../docs/architecture/repo_structure.md) document.

In practice this means writing integration tests against resolvers or cronjobs, and against repository methods.

## State of testing in the codebase

Historically many of the integration tests were written against several user and company records which were bootstrapped at the start of the test suite run. This meant that the tests were not isolated, and could lead to issues where the state of these records is mutated between tests. It also created large dependencies on a handful of mocks, which made it difficult to change data for new tests.

You can see this throughout the codebase in the numerous references to `company2Mock.id` and `user2Mock.id` etc. These are referring to the records bootstrapped in [jest.integration.setup.ts](../../jest.integration.setup.ts)

## How to write integration tests

Tests that have been more recently are bootstrapping their own data. An example that has been written more recently can be found in [src/resolvers/CompanyPrivacyResolver/companyPrivacyResolver.spec.ts](../../src/resolvers/CompanyPrivacyResolver/companyPrivacyResolver.spec.ts).

Here you can see that data is initalised and cleaned up using `setup` and `teardown` functions executed before and after tests.

## Mocks

When creating mock data for an entity, try to use a factory function which can be used to generate data objects. This will make it easier to change the shape of the data in the future, and will make it easier to create new data objects for tests.

An example of this can be seen in `createCompanyRelationshipRecommendationMock` in [src/mocks/companyRelationshipRecommendation.ts](../../src/mocks/companyRelationshipRecommendation.ts).
