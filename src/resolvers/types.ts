import { IContext } from '../apolloContext';

export type ResolverFunction<Args, Returned> = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  roots: any,
  args: Args,
  context: IContext
) => Promise<Returned>;
