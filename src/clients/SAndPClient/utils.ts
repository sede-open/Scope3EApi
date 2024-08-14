import { IdentifierType } from './types';

/** When using a duns number as identifier via the S&P API you must prefix the ID with DB */
export function getTaggedDunsId(dunsId: string) {
  return `DB${dunsId}`;
}

export function removeTagFromDunsId(taggedDunsId: string) {
  if (taggedDunsId.toUpperCase().startsWith('DB')) {
    return taggedDunsId.slice(2, taggedDunsId.length);
  }
  return taggedDunsId;
}

/** When using a CIQ number as identifier via the S&P API you must prefix the ID with IQ */
export function getTaggedCiqId(ciqId: string) {
  return `IQ${ciqId}`;
}

export function removeTagFromCiqId(taggedCiqId: string) {
  if (taggedCiqId.toUpperCase().startsWith('IQ')) {
    return taggedCiqId.slice(2, taggedCiqId.length);
  }
  return taggedCiqId;
}

export function getIdentifierFormatterFunction(
  identifierType: IdentifierType | string
) {
  switch (identifierType) {
    case IdentifierType.CIQ_ID:
      return getTaggedCiqId;
    case IdentifierType.DUNS:
      return getTaggedDunsId;
    default:
      return () => identifierType;
  }
}
