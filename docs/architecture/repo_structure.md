# Repo Structure

## Services

### DatabaseService.ts

This service is a wrapper for typeorm connections and repositories fetching. It can be instantiated as a protected variable inside a service. The main function is to allow the dynamic use of an Entity Manager instance inside of a service for transactional queries. The entity manager can be set with 'setEntityManager'. Once set, any call to DatabaseSerivce.getRepository will return a repository using the entity manager.

### BaseService.ts

This class is a base service class which can be inheritted from for all service classes. It has CRUD functions for the domain the service is using and helper functions for the DatabaseService.
Two generics must be passed into the BaseService when extending, the first is an "Entity" which is a typeorm entity, the second is a class or interface representation of the Entity. The second only includes a representation of the entity without orm relations and is used to indentify what fields are required or optional when creating or updating an entity. An example in the codebase is CompanyPrivacy in src/repositories/CompanyPrivacyRepository.ts
