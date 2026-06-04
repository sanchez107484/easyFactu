import { useCallback } from 'react';

/**
 * Focuses an element without triggering the browser's default scrollIntoView
 * (which can scroll multiple ancestor scroll containers at once and misalign the
 * layout), then manually scrolls the minimum amount needed to make it visible.
 */
function focusElement(el: HTMLElement) {
  el.focus({ preventScroll: true });
  el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
}

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
      const el = form.querySelector<HTMLElement>(`input[name="lines.${n}.unitPrice"]`);
      if (el) focusElement(el);
      return;
    }

    // lines.N.unitPrice → next line quantity (if visible) or next price, or discountPercent
    const priceMatch = name.match(/^lines\.(\d+)\.unitPrice$/);
    if (priceMatch) {
      const n = parseInt(priceMatch[1], 10);
      const nextQty = form.querySelector<HTMLElement>(`input[data-invoice-qty="${n + 1}"]`);
      if (nextQty) {
        focusElement(nextQty);
        return;
      }
      const nextPrice = form.querySelector<HTMLElement>(`input[name="lines.${n + 1}.unitPrice"]`);
      if (nextPrice) {
        focusElement(nextPrice);
        return;
      }
      const discountEl = document.getElementById('discountPercent');
      if (discountEl) focusElement(discountEl);
      return;
    }

    // Default: move to next truly interactive field in DOM order.
    // Exclude readOnly inputs and tabIndex=-1 elements (e.g. computed display fields).
    const focusableSelectors = 'input:not([disabled]):not([readonly]), select:not([disabled])';
    const focusable = Array.from(form.querySelectorAll<HTMLElement>(focusableSelectors)).filter(
      (el) => (el as HTMLInputElement).tabIndex !== -1,
    );
    const idx = focusable.indexOf(target);
    if (idx >= 0 && idx < focusable.length - 1) {
      focusElement(focusable[idx + 1]);
    }
  }, []);
}
