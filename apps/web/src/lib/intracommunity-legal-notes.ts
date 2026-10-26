import {
  INTRACOMMUNITY_LEGAL_NOTES,
  type IntracommunityLegalNoteKind,
} from '@easyfactura/shared-constants';
import type { LineMode } from '@/lib/invoice-line-types';

const ALL_KINDS = Object.keys(INTRACOMMUNITY_LEGAL_NOTES) as IntracommunityLegalNoteKind[];

/** Goods lines need the art. 25 exemption; services and free-text lines the reverse charge. */
export function requiredIntracommunityNotes(
  isIntracommunityCustomer: boolean,
  lineModes: readonly LineMode[],
): IntracommunityLegalNoteKind[] {
  if (!isIntracommunityCustomer) return [];
  const required = new Set<IntracommunityLegalNoteKind>();
  for (const mode of lineModes) required.add(mode === 'product' ? 'GOODS' : 'SERVICES');
  if (required.size === 0) required.add('SERVICES');
  return ALL_KINDS.filter((kind) => required.has(kind));
}

/**
 * Returns the notes with exactly the required legal mentions: adds the missing
 * ones at the end and removes those the invoice no longer needs. Any other
 * text the user wrote is kept untouched.
 */
export function syncIntracommunityNotes(
  notes: string,
  required: readonly IntracommunityLegalNoteKind[],
): string {
  let result = notes;
  for (const kind of ALL_KINDS) {
    const mention = INTRACOMMUNITY_LEGAL_NOTES[kind];
    const isPresent = result.includes(mention);
    if (required.includes(kind) && !isPresent) {
      result = result.trim() ? `${result.trimEnd()}\n${mention}` : mention;
    } else if (!required.includes(kind) && isPresent) {
      result = result
        .replace(mention, '')
        .replace(/\n{2,}/g, '\n')
        .trim();
    }
  }
  return result;
}
