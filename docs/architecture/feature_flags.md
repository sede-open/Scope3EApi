# Feature Flags

The application uses [Launch Darkly](https://launchdarkly.com) to toggle features within the application.

## Launch Darkly

Each [environment](../infrastructure/environments.md) has its own Launch Darkly environment to match. The environment is set with the `LAUNCH_DARKLY_SERVER_SDK_KEY` environment variable.

A `LaunchDarklyClient` singleton is instantiated at program startup. You can then access an instance of Launch Darkly by calling `LaunchDarklyClient.getInstance()`.

Flags can be accessed using the helper function `getFlag(flagName, fallbackValue)`, and a third option of `user` can be passed in to target a specific user.

Flag responses can be mocked using the NodeJS example shown in [the launch darkly docs](https://github.com/launchdarkly/jest-launchdarkly-mock#usage).

## Testing with Feature Flags

When writing tests you can create a mock set of Launch Darkly flags using the `getLDTestData` helper function to create a `TestData` object, which can then be used to mock flags for tests.

```typescript
const td = await getLDTestData();
await td.update(
  td
    .flag(LaunchDarklyFlags.IS_HUBSPOT_INVITE_TO_JOIN_WORKFLOW_ENABLED)
    .valueForAllUsers(false)
);
```
