export function hasDataProperty<T>(
  object: Record<string, any>,
  key: string
): object is T {
  return Object.prototype.hasOwnProperty.call(object, key);
}
