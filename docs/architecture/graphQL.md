# GraphQL

This document has various pieces of contextual information about the GraphQL implementation in the project.

## GraphQL and Type generation

1. GraphQL data types such as queries, mutations, inputs, scalars and directives are defined in the `typeDefs` directory.

2. Running `yarn apollo:generate` will generate and update the `schema.graphql` file that Apollo server reads as well as `src/types.ts`

3. When you need to reference GraphQL types in your code, import them from the auto-generated file `src/types.ts`. Note that edits should not be made to `src/types.ts` directly, as they will be overwritten the next time `yarn apollo:generate` is run.

## GraphQL Types for the frontend

The `schema.graphql` file is also used to generate types for the frontend. This is done by running `yarn apollo:generate` from the `app` UI project. Currently the two projects must be colocated in the same directory in order for this to work.

## Access Control on GraphQL Endpoints

The application has a permissions system which grants access to certain GraphQL endpoints based on the user's role. This is done using the `@hasRole` directive. For example, the following mutation is only accessible to users with the `ADMIN` role:

```graphql
type Mutation {
  createUser(input: CreateUserInput!): User @hasRole(roles: ["ADMIN"])
}
```

More information on this feature can be found in the [directives section](#directives).

## Custom Scalars

To keep our schema as secure as possible, please use existing or create new scalars to add field validation and sanitisation before mutations and queries are actually called. Scalars are useful for when using enums is not appropriate.

Existing custom scalars:

- Email - valid email address
- SafeString - string containing only printable [ASCII](https://en.wikipedia.org/wiki/ASCII#Character_set) characters
- UserName - first or last name containing no forbidden characters (in line with Akamai rules)
- Date
- UUID - [graphql-scalars UUID](https://www.graphql-scalars.dev/docs/scalars/uuid)

To create a new custom scalar:

- Define your scalar in [scalars directory](./src/scalars)
- Create a resolver for the scalar in [resolvers directory](./src/resolvers)
- Add the scalar to [helpers directory in typeDefs](./src/typeDefs/helpers)
- Add the scalar typescript definitions to [codegen.yml](./codegen.yml)
- Use it in the schema

For more information about custom scalars, see [here](https://www.apollographql.com/docs/apollo-server/schema/custom-scalars/).

[graphql-scalars](https://www.graphql-scalars.dev/docs/scalars) library is used for UUID scalar, it has many predefined scalar that may be useful in the future. Check it before creating new ones.

## Directives

Existing permission directives:

1. @hasRole(roles: ["ADMIN"]) - for role permissions
2. @belongsToApprovedCompany - for checking if the user is ADMIN or belongs to an approved company
