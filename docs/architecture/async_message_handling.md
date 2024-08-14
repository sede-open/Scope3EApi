# Async Message Handling

The project currently makes light use of [Bull](https://github.com/OptimalBits/bull) for job queue management. Using Redis as a persistent store for jobs. Bull allows us to create jobs that can be processed asynchronously. This is useful for sending emails, or other tasks that can be done in the background.

## Job Queues

If you need to force job queues to be processed, you can use the following command (stop server when running this as it will use port 4000):

```bash
yarn process-queues
```

At the moment, the job queue processing starts with the server. If necessary, we could extract job processing into a separate repo/micro service to improve the architecture and performance in the future.

TODO @HrayrPetrosyan More info here on state of async messages in the application.
