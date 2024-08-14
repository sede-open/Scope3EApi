# Files

An express router has been added for `/files`. This is separate from GraphQL to avoid overloading the Apollo server and make it easier to refactor into a separate microservice for the future.

Currently, [multer](https://www.npmjs.com/package/multer) middleware is used to help read files and apply validations. It loads the files into memory first. Memory should be cleaned up after each request is finished but it may become an issue if we start receiving a large amount of files. At this point, we may need to look for an alternative.
