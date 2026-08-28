import { DealStatus } from '@repo/firebase';

// ══════════════════════════════════════════════════════════════════════════════
// ALLOWED INITIAL STATUSES
// ══════════════════════════════════════════════════════════════════════════════
//
// Only these statuses are valid when first creating a deal.
// Everything else requires preconditions (locked plots, payment schedules,
// signed contracts, full payment) that cannot be satisfied in a single
// creation call.
//
// ENQUIRY    — default; agent captures the prospect in the system
// NEGOTIATION — backdating a deal already in active discussion
// OFFER_ISSUED — backdating a deal where an offer letter was already sent offline
//
export const ALLOWED_INITIAL_STATUSES = new Set<DealStatus>([
  DealStatus.ENQUIRY,
  DealStatus.NEGOTIATION,
  DealStatus.OFFER_ISSUED,
]);
