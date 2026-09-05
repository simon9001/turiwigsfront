/**
 * Paystack's hosted page is reached with a full page navigation, which wipes
 * every bit of in-memory state. When the customer is sent back to
 * /payment/success or /payment/failed the app otherwise has no idea whether
 * they were paying for a booking or an order.
 *
 * /payment/success can usually recover this by verifying the reference with
 * the server, but /payment/failed has nothing to verify against — so the
 * context is stashed here before handing over to Paystack.
 */

const BOOKING_ID = 'pg_booking_id';
const REFERENCE = 'pg_reference';

/** Remember what this payment was for, just before redirecting to Paystack. */
export function rememberPaymentContext(ctx: { bookingId?: string; reference?: string }): void {
  if (typeof window === 'undefined') return;
  try {
    if (ctx.bookingId) sessionStorage.setItem(BOOKING_ID, ctx.bookingId);
    if (ctx.reference) sessionStorage.setItem(REFERENCE, ctx.reference);
  } catch {
    // Private browsing or a full quota. The success page can still recover
    // from the reference in the URL; the failed page just shows generic copy.
  }
}
