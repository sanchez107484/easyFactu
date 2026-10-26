import { useEffect } from 'react';
import { CustomerType } from '@easyfactura/shared-types';
import type { LineMode } from '@/lib/invoice-line-types';
import {
  requiredIntracommunityNotes,
  syncIntracommunityNotes,
} from '@/lib/intracommunity-legal-notes';

interface NotesAccessor {
  getNotes: () => string | undefined;
  setNotes: (notes: string) => void;
}

/**
 * Keeps the intra-EU legal mention in the invoice notes while the selected
 * customer is intracommunity. Runs only when the customer or the kind of lines
 * (goods / services) changes, so a mention the user deletes stays deleted.
 * Does nothing until the customer is known (e.g. while the list loads).
 *
 * @returns whether the invoice currently needs an intracommunity mention.
 */
export function useIntracommunityLegalNotes(
  customerType: CustomerType | undefined,
  lineModes: readonly LineMode[],
  { getNotes, setNotes }: NotesAccessor,
): boolean {
  const required = requiredIntracommunityNotes(
    customerType === CustomerType.INTRACOMMUNITY,
    lineModes,
  );
  const requiredKey = required.join(',');

  useEffect(() => {
    if (customerType === undefined) return;
    const currentNotes = getNotes() ?? '';
    const nextNotes = syncIntracommunityNotes(currentNotes, required);
    if (nextNotes !== currentNotes) setNotes(nextNotes);
    // `required` is derived from requiredKey; listing it would re-run on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerType, requiredKey]);

  return required.length > 0;
}
