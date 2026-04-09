"use strict";

function getBookingPriority(booking = {}) {
  if (booking.status === "completed") return 5;
  if (booking.payment_status === "paid") return 4;
  if (booking.status === "confirmed") return 3;
  if (booking.status === "pending") return 2;
  if (booking.status === "cancelled") return 1;
  return 0;
}

export function pickRelevantServiceBooking(bookings = []) {
  if (!Array.isArray(bookings) || bookings.length === 0) return null;

  return bookings.reduce((best, current) => {
    if (!best) return current;

    const currentPriority = getBookingPriority(current);
    const bestPriority = getBookingPriority(best);

    if (currentPriority !== bestPriority) {
      return currentPriority > bestPriority ? current : best;
    }

    return new Date(current.created_at || 0) > new Date(best.created_at || 0)
      ? current
      : best;
  }, null);
}

export function buildServiceViewerState(booking) {
  if (!booking) return null;

  const bookingId = booking.id || null;
  const conversationId = booking.conversation_id || null;

  if (booking.status === "completed") {
    return {
      code: "completed",
      label: "Terminee",
      tone: "success",
      helper: "Cette prestation est terminee.",
      actionLabel: "Voir ma reservation",
      actionHref: "/bookings",
      bookingId,
      conversationId,
    };
  }

  if (booking.payment_status === "paid") {
    return {
      code: "paid",
      label: "Paye",
      tone: "success",
      helper: "Vous avez deja regle ce service.",
      actionLabel: conversationId ? "Voir la discussion" : "Voir ma reservation",
      actionHref: conversationId ? `/conversations/${conversationId}` : "/bookings",
      bookingId,
      conversationId,
    };
  }

  if (booking.status === "confirmed") {
    return {
      code: "confirmed",
      label: "A payer",
      tone: "info",
      helper: "Le prestataire a confirme votre demande.",
      actionLabel: bookingId ? "Payer maintenant" : "Voir ma reservation",
      actionHref: bookingId ? `/payments/${bookingId}` : "/bookings",
      bookingId,
      conversationId,
    };
  }

  if (booking.status === "pending") {
    return {
      code: "pending",
      label: "Demande envoyee",
      tone: "warning",
      helper: "Votre demande est en attente de confirmation.",
      actionLabel: conversationId ? "Voir la discussion" : "Voir ma demande",
      actionHref: conversationId ? `/conversations/${conversationId}` : "/bookings",
      bookingId,
      conversationId,
    };
  }

  if (booking.status === "cancelled") {
    return {
      code: "cancelled",
      label: "Annulee",
      tone: "danger",
      helper: "Votre derniere demande sur ce service a ete annulee.",
      actionLabel: "Voir mes reservations",
      actionHref: "/bookings",
      bookingId,
      conversationId,
    };
  }

  return null;
}
