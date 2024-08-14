import { EntityManager } from 'typeorm';
import { IContext } from '../apolloContext';

export type ControllerFunction<Args, Returned> = (
  args: Args,
  context: IContext
) => Returned;

export type ControllerFunctionAsync<Args, Returned> = (
  args: Args,
  context: IContext,
  transactionalEntityManager?: EntityManager
) => Promise<Returned>;

export type Entries<T> = {
  [K in keyof T]: [K, T[K]];
}[keyof T][];
