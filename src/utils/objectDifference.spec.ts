import { objectDifference } from './objectDifference';

describe(objectDifference.name, () => {
  it('should show changes to key values', () => {
    expect(
      objectDifference(
        { a: 'a', b: 'b', c: 'c', d: 'd' },
        { a: 'a', b: 'x', c: 'y', d: 'd' }
      )
    ).toEqual({ b: 'x', c: 'y' });
  });

  it('should show new key values', () => {
    expect(objectDifference({ a: 'a' }, { a: 'a', b: 'b' })).toEqual({
      b: 'b',
    });
  });

  it('will not show removed keys', () => {
    expect(objectDifference({ a: 'a', b: 'b' }, { a: 'a' })).toEqual({});
  });
});
