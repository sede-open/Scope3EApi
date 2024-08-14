# Migrations

Migrations are run at the moment as the server starts up by typeorm (in the future we may want to separate this into a CI step or a k8 job).

To create a new migration file:

```bash
yarn migrate:create myMigrationName
```

Each migration should be created with an up and down method to create and undo the change.
