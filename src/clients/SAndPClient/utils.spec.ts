import {
  getTaggedCiqId,
  getTaggedDunsId,
  removeTagFromCiqId,
  removeTagFromDunsId,
} from './utils';

describe(getTaggedDunsId.name, () => {
  it('should prefix the DUNS identifier to the ID', () => {
    expect(getTaggedDunsId('12345')).toEqual('DB12345');
  });
});

describe(removeTagFromDunsId.name, () => {
  it('should strip the DUNS identifier prefix from the ID', () => {
    expect(removeTagFromDunsId('DB12345')).toEqual('12345');
  });

  it('should strip the DUNS identifier prefix from the ID even if lower case', () => {
    expect(removeTagFromDunsId('dbabcdef')).toEqual('abcdef');
  });

  it('should return the original string if the DUNS identifier prefix is not detected', () => {
    expect(removeTagFromDunsId('ABC12345')).toEqual('ABC12345');
  });
});

describe(getTaggedCiqId.name, () => {
  it('should prefix the CIQ identifier to the ID', () => {
    expect(getTaggedCiqId('12345')).toEqual('IQ12345');
  });
});

describe(removeTagFromCiqId.name, () => {
  it('should strip the CIQ identifier prefix from the ID', () => {
    expect(removeTagFromCiqId('IQ12345')).toEqual('12345');
  });

  it('should strip the CIQ identifier prefix from the ID even if lower case', () => {
    expect(removeTagFromCiqId('iq12345')).toEqual('12345');
  });

  it('should return the original string if the CIQ identifier prefix is not detected', () => {
    expect(removeTagFromCiqId('abc12345')).toEqual('abc12345');
  });
});
