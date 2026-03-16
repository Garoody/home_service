"use strict";

import db from "../config/database.js";
import BookingService from "./BookingService.js";
import PaymentService from "./PaymentService.js";

/**
 * DashboardService
 * Centralise les donnees affichees dans l'espace utilisateur.
 * Le contenu varie selon le role connecte : client ou prestataire.
 */
class DashboardService {
  // Prepare les indicateurs utiles au tableau de bord client.
  static async getClientDashboard(userId) {
    const [bookings, payments, reviewsResult] = await Promise.all([
      BookingService.listForUser(userId),
      PaymentService.listForUser(userId),
      db.query(
        `
        SELECT COUNT(*)::int AS total
        FROM public.reviews
        WHERE client_id::text = $1
        `,
        [userId]
      ),
    ]);

    return {
      role: "client",
      stats: {
        bookings: bookings.length,
        pending: bookings.filter((booking) => booking.status === "pending").length,
        completed: bookings.filter((booking) => booking.status === "completed").length,
        payments: payments.filter((payment) => payment.payment_status === "paid").length,
        reviews: reviewsResult.rows[0]?.total || 0,
      },
      recentBookings: bookings.slice(0, 4),
      recentPayments: payments.slice(0, 4),
    };
  }

  // Prepare les indicateurs utiles au tableau de bord prestataire.
  static async getProviderDashboard(userId) {
    const [servicesResult, bookingsResult, reviewsResult] = await Promise.all([
      db.query(
        `
        SELECT
          s.id_service::text AS id,
          s.title,
          s.price,
          c.name AS category_name,
          s.created_at
        FROM public.services s
        JOIN public.categories c ON c.id_category = s.category_id
        WHERE s.provider_id::text = $1
        ORDER BY s.created_at DESC
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          b.id_booking::text AS id,
          b.status,
          b.booking_date,
          b.booking_time,
          b.total_price,
          s.title AS service_title,
          u.full_name AS client_name
        FROM public.bookings b
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users u ON u.id_user = b.client_id
        WHERE s.provider_id::text = $1
        ORDER BY b.created_at DESC
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          COUNT(*)::int AS total_reviews,
          COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating
        FROM public.reviews
        WHERE provider_id::text = $1
        `,
        [userId]
      ),
    ]);

    const services = servicesResult.rows;
    const bookings = bookingsResult.rows;
    const reviews = reviewsResult.rows[0] || { total_reviews: 0, average_rating: 0 };

    return {
      role: "provider",
      stats: {
        services: services.length,
        bookings: bookings.length,
        activeBookings: bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed").length,
        completedBookings: bookings.filter((booking) => booking.status === "completed").length,
        totalReviews: reviews.total_reviews || 0,
        averageRating: Number(reviews.average_rating || 0),
      },
      latestServices: services.slice(0, 4),
      latestBookings: bookings.slice(0, 4),
    };
  }
}

export default DashboardService;
