import { useCallback } from 'react';

/**
 * Returns an onKeyDown handler for invoice/quote forms with line items.
 *
 * Navigation flow when pressing Enter:
 *   lines.N.quantity  →  lines.N.unitPrice
 *   lines.N.unitPrice →  lines.(N+1).quantity  (if it exists in the DOM)
 *                     →  lines.(N+1).unitPrice  (if the next line has no quantity, e.g. service)
 *                     →  #discountPercent        (if there are no more lines)
 *
 * Other rules:
 *   - <textarea>  → default behaviour (newline).
 *   - <button>    → default behaviour (click).
 *   - Any other <input>/<select> → next focusable field in DOM order.
 */
export function useInvoiceFormKeyDown() {
  return useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;

    const target = e.target as HTMLInputElement;
    const tag = target.tagName.toLowerCase();

    if (tag === 'textarea' || tag === 'button') return;

    e.preventDefault();

    const name = target.name ?? '';
    const form = e.currentTarget;

    // lines.N.quantity (identified by data-invoice-qty) → lines.N.unitPrice
    const qtyAttr = (target as HTMLElement).dataset.invoiceQty;
    if (qtyAttr !== undefined) {
      const n = parseInt(qtyAttr, 10);
      form.querySelector<HTMLElement>(`input[name="lines.${n}.unitPrice"]`)?.focus();
      return;
    }

    // lines.N.unitPrice → next line quantity (if visible) or next price, or discountPercent
    const priceMatch = name.match(/^lines\.(\d+)\.unitPrice$/);
    if (priceMatch) {
      const n = parseInt(priceMatch[1], 10);
      const nextQty = form.querySelector<HTMLElement>(`input[data-invoice-qty="${n + 1}"]`);
      if (nextQty) {
        nextQty.focus();
        return;
      }
      const nextPrice = form.querySelector<HTMLElement>(`input[name="lines.${n + 1}.unitPrice"]`);
      if (nextPrice) {
        nextPrice.focus();
        return;
      }
      document.getElementById('discountPercent')?.focus();
      return;
    }

    // Default: move to next focusable field in DOM order
    const focusableSelectors = 'input:not([disabled]), select:not([disabled])';
    const focusable = Array.from(form.querySelectorAll<HTMLElement>(focusableSelectors));
    const idx = focusable.indexOf(target);
    if (idx >= 0 && idx < focusable.length - 1) {
      focusable[idx + 1].focus();
    }
  }, []);
}
