"use strict";

import db from "../config/database.js";
import BookingService from "./BookingService.js";
import PaymentService from "./PaymentService.js";
import ServiceService from "./ServiceService.js";

class DashboardService {
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

  static async getProviderDashboard(userId, { publicOnly = false } = {}) {
    const hasAdminStatusColumn = await ServiceService.hasAdminStatusColumn();
    const serviceVisibilitySql =
      hasAdminStatusColumn
        ? publicOnly
          ? "AND COALESCE(s.admin_status, 'active') = 'active'"
          : "AND COALESCE(s.admin_status, 'active') <> 'deleted'"
        : "";

    const [servicesResult, bookings, reviewsResult, payments] = await Promise.all([
      db.query(
        `
        SELECT
          s.id_service::text AS id,
          s.id_service::text AS slug,
          s.title,
          s.price,
          c.name AS category_name,
          s.created_at
        FROM public.services s
        JOIN public.categories c ON c.id_category = s.category_id
        WHERE s.provider_id::text = $1
          ${serviceVisibilitySql}
        ORDER BY s.created_at DESC
        `,
        [userId]
      ),
      BookingService.listForProvider(userId),
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
      PaymentService.listForProvider(userId),
    ]);

    const services = servicesResult.rows;
    const reviews = reviewsResult.rows[0] || { total_reviews: 0, average_rating: 0 };
    const revenue = payments.reduce((total, payment) => total + Number(payment.amount || 0), 0);

    return {
      role: "provider",
      stats: {
        services: services.length,
        bookings: bookings.length,
        activeBookings: bookings.filter((booking) => booking.status === "pending" || booking.status === "confirmed").length,
        completedBookings: bookings.filter((booking) => booking.status === "completed").length,
        paidPayments: payments.length,
        revenue,
        totalReviews: reviews.total_reviews || 0,
        averageRating: Number(reviews.average_rating || 0),
      },
      latestServices: services.slice(0, 4),
      latestBookings: bookings.slice(0, 4),
      recentPayments: payments.slice(0, 4),
    };
  }

  // Tableau de bord unique pour un compte utilisateur normal.
  // Le même compte peut réserver et publier des services.
  static async getUserDashboard(userId) {
    const [clientDashboard, providerDashboard] = await Promise.all([
      this.getClientDashboard(userId),
      this.getProviderDashboard(userId),
    ]);

    return {
      role: "user",
      stats: {
        bookings: clientDashboard.stats.bookings,
        pending: clientDashboard.stats.pending,
        completed: clientDashboard.stats.completed,
        payments: clientDashboard.stats.payments,
        reviewsLeft: clientDashboard.stats.reviews,
        services: providerDashboard.stats.services,
        requests: providerDashboard.stats.bookings,
        activeRequests: providerDashboard.stats.activeBookings,
        completedServices: providerDashboard.stats.completedBookings,
        receivedPayments: providerDashboard.stats.paidPayments,
        revenue: providerDashboard.stats.revenue,
        reviewsReceived: providerDashboard.stats.totalReviews,
        averageRating: providerDashboard.stats.averageRating,
      },
      recentBookings: clientDashboard.recentBookings,
      recentPayments: clientDashboard.recentPayments,
      latestServices: providerDashboard.latestServices,
      latestRequests: providerDashboard.latestBookings,
      providerPayments: providerDashboard.recentPayments,
    };
  }
}

export default DashboardService;
