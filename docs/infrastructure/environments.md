
## Deployment pipelines

Currently any commit to a non-master branch will create a deployment pipeline to the dev and staging environments. This is done via a [Github Action Workflow](../../.github/workflows/pr_branch.yml).

A separate workflow will deploy to preprod and prod when a PR is merged into the master branch. This is done via another [Github Action Workflow](../../.github/workflows/master.yml).

Deployment to any environment requires a manual approval via the Github Actions UI. This is to prevent accidental deployments to production, as well as deployments which would override any deployment currently being tested in an environment.

## Configuring Deployment Pipelines

At the time of writing `dev` and `staging` environments are used as QA environments. `preprod` is unused, and `prod` is used for production.

The team is free to edit the pipelines to suit their needs. For example, if you want to deploy to `preprod` and `prod` when a PR is merged into a non-master branch, you can do so by editing the [pr_branch.yml](../../.github/workflows/pr_branch.yml) file.

Or similarly, if you wanted to deploy to `preprod` on commit to a non-master branch, you could do that too.
