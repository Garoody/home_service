"use strict";

import db from "../config/database.js";
import BookingMaintenanceService from "./BookingMaintenanceService.js";

function buildSearchPattern(value) {
  const normalized = String(value || "").trim();
  return normalized ? `%${normalized}%` : null;
}

function normalizeReason(reason) {
  const value = String(reason || "").trim();
  return value || null;
}

function requireReason(action, reason) {
  const mandatoryReasonActions = new Set([
    "warn",
    "suspend",
    "ban",
    "delete",
    "disable_messages",
    "disable_publishing",
    "suspended",
    "deleted",
    "hidden",
  ]);

  if (mandatoryReasonActions.has(action) && !normalizeReason(reason)) {
    throw new Error("Un motif est obligatoire pour cette action admin.");
  }
}

function formatActionLabel(actionType) {
  const labels = {
    read_conversation: "Lecture de la conversation",
    read_booking: "Lecture de la reservation",
    read_payment: "Lecture du paiement",
    read_user: "Lecture du compte",
    read_service: "Lecture du service",
    read_review: "Lecture de l'avis",
    warn_user: "Avertissement envoye",
    suspend_user: "Compte suspendu",
    unsuspend_user: "Suspension levee",
    ban_user: "Compte banni",
    unban_user: "Bannissement leve",
    disable_messages: "Messagerie coupee",
    enable_messages: "Messagerie retablie",
    disable_publishing: "Publication coupee",
    enable_publishing: "Publication retablie",
    delete_user: "Compte supprime cote admin",
    active_service: "Service rendu actif",
    suspended_service: "Service suspendu",
    deleted_service: "Service supprime cote admin",
    visible_review: "Avis rendu visible",
    hidden_review: "Avis masque publiquement",
    deleted_review: "Avis supprime cote admin",
    create_report: "Signalement cree",
    update_report_status: "Signalement mis a jour",
  };

  return labels[actionType] || "Action admin";
}

function formatRecentLog(log) {
  const metadata =
    log?.metadata && typeof log.metadata === "object" ? log.metadata : {};

  if (log.action_type === "read_conversation") {
    const participants =
      log.conversation_client_name && log.conversation_provider_name
        ? `Client : ${log.conversation_client_name} · Prestataire : ${log.conversation_provider_name}`
        : `Conversation #${log.target_id}`;

    return {
      ...log,
      display_title: "Lecture de la conversation",
      display_subject: participants,
      display_detail:
        log.conversation_service_title ||
        metadata.serviceTitle ||
        log.reason ||
        "Consultation admin en lecture seule",
      display_link: log.target_id ? `/admin/conversations/${log.target_id}` : null,
    };
  }

  if (log.target_type === "user") {
    const warningLevel = metadata.warningLevel
      ? `${metadata.warningLevel}${log.reason ? " · " : ""}`
      : "";

    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_user_name || metadata.userName || `Compte #${log.target_id}`,
      display_detail:
        `${warningLevel}${log.reason || "Action appliquee sur le compte."}`.trim(),
      display_link: "/admin/users",
    };
  }

  if (log.target_type === "service") {
    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_service_title ||
        metadata.serviceTitle ||
        `Service #${log.target_id}`,
      display_detail:
        log.target_service_provider_name
          ? `Prestataire : ${log.target_service_provider_name}`
          : log.reason || "Action appliquee sur le service.",
      display_link: "/admin/services",
    };
  }

  if (log.target_type === "review") {
    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_review_service_title ||
        metadata.serviceTitle ||
        `Avis #${log.target_id}`,
      display_detail:
        log.target_review_client_name
          ? `Client : ${log.target_review_client_name}`
          : log.reason || "Action appliquee sur l'avis.",
      display_link: "/admin/reviews",
    };
  }

  if (log.target_type === "booking") {
    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_booking_service_title ||
        metadata.serviceTitle ||
        `Reservation #${log.target_id}`,
      display_detail:
        log.target_booking_client_name && log.target_booking_provider_name
          ? `Client : ${log.target_booking_client_name} - Prestataire : ${log.target_booking_provider_name}`
          : log.reason || "Action admin sur la reservation.",
      display_link: log.target_id ? `/admin/bookings/${log.target_id}` : "/admin/bookings",
    };
  }

  if (log.target_type === "payment") {
    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_payment_service_title ||
        metadata.serviceTitle ||
        `Paiement #${log.target_id}`,
      display_detail:
        log.target_payment_client_name
          ? `Client : ${log.target_payment_client_name}`
          : log.reason || "Action admin sur le paiement.",
      display_link: log.target_id ? `/admin/payments/${log.target_id}` : "/admin/payments",
    };
  }

  if (log.target_type === "report") {
    return {
      ...log,
      display_title: formatActionLabel(log.action_type),
      display_subject:
        log.target_report_title || metadata.reportTitle || `Signalement #${log.target_id}`,
      display_detail:
        log.reason || metadata.priority || "Action admin sur le signalement.",
      display_link: "/admin/reports",
    };
  }

  return {
    ...log,
    display_title: formatActionLabel(log.action_type),
    display_subject: `${log.target_type} #${log.target_id}`,
    display_detail: log.reason || "Action admin enregistree.",
    display_link: null,
  };
}

class AdminService {
  async hasReportsTable() {
    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'admin_reports'
      `
    );

    return result.rows[0]?.count === 1;
  }

  async logAction({
    adminId,
    actionType,
    targetType,
    targetId,
    reason = null,
    metadata = null,
    dbClient = db,
  }) {
    await dbClient.query(
      `
      INSERT INTO public.admin_action_logs (
        admin_id,
        action_type,
        target_type,
        target_id,
        reason,
        metadata
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6::jsonb)
      `,
      [
        adminId,
        actionType,
        targetType,
        String(targetId),
        normalizeReason(reason),
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  }

  async queryActionLogs({
    q = "",
    actionType = "",
    targetType = "",
    targetId = "",
    limit = null,
  } = {}) {
    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(
          l.action_type ILIKE $${values.length}
          OR l.target_type ILIKE $${values.length}
          OR u.full_name ILIKE $${values.length}
          OR COALESCE(target_user.full_name, '') ILIKE $${values.length}
          OR COALESCE(target_service.title, '') ILIKE $${values.length}
          OR COALESCE(review_service.title, '') ILIKE $${values.length}
          OR COALESCE(convo.client_name, '') ILIKE $${values.length}
          OR COALESCE(convo.provider_name, '') ILIKE $${values.length}
          OR COALESCE(report_item.title, '') ILIKE $${values.length}
          OR COALESCE(l.reason, '') ILIKE $${values.length}
        )`
      );
    }

    if (actionType) {
      values.push(actionType);
      where.push(`l.action_type = $${values.length}`);
    }

    if (targetType) {
      values.push(targetType);
      where.push(`l.target_type = $${values.length}`);
    }

    if (targetId) {
      values.push(String(targetId));
      where.push(`l.target_id = $${values.length}`);
    }

    const safeLimit =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? `LIMIT ${Number(limit)}`
        : "";

    const result = await db.query(
      `
      SELECT
        l.id_admin_action::text AS id,
        l.action_type,
        l.target_type,
        l.target_id,
        l.reason,
        l.metadata,
        l.created_at,
        u.full_name AS admin_name,
        target_user.full_name AS target_user_name,
        target_service.title AS target_service_title,
        service_provider.full_name AS target_service_provider_name,
        review_service.title AS target_review_service_title,
        review_client.full_name AS target_review_client_name,
        convo.service_title AS conversation_service_title,
        convo.client_name AS conversation_client_name,
        convo.provider_name AS conversation_provider_name,
        booking_item.service_title AS target_booking_service_title,
        booking_item.client_name AS target_booking_client_name,
        booking_item.provider_name AS target_booking_provider_name,
        payment_item.service_title AS target_payment_service_title,
        payment_item.client_name AS target_payment_client_name,
        report_item.title AS target_report_title
      FROM public.admin_action_logs l
      JOIN public.users u ON u.id_user = l.admin_id
      LEFT JOIN public.users target_user
        ON l.target_type = 'user'
       AND target_user.id_user::text = l.target_id
      LEFT JOIN public.services target_service
        ON l.target_type = 'service'
       AND target_service.id_service::text = l.target_id
      LEFT JOIN public.users service_provider
        ON service_provider.id_user = target_service.provider_id
      LEFT JOIN public.reviews target_review
        ON l.target_type = 'review'
       AND target_review.id_review::text = l.target_id
      LEFT JOIN public.bookings review_booking
        ON review_booking.id_booking = target_review.booking_id
      LEFT JOIN public.services review_service
        ON review_service.id_service = review_booking.service_id
      LEFT JOIN public.users review_client
        ON review_client.id_user = target_review.client_id
      LEFT JOIN LATERAL (
        SELECT
          s.title AS service_title,
          client.full_name AS client_name,
          provider.full_name AS provider_name
        FROM public.booking_conversations bc
        JOIN public.bookings b ON b.id_booking = bc.booking_id
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users client ON client.id_user = bc.client_id
        JOIN public.users provider ON provider.id_user = bc.provider_id
        WHERE l.target_type = 'conversation'
          AND bc.id_conversation::text = l.target_id
        LIMIT 1
      ) AS convo ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          s.title AS service_title,
          client.full_name AS client_name,
          provider.full_name AS provider_name
        FROM public.bookings b
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users client ON client.id_user = b.client_id
        JOIN public.users provider ON provider.id_user = s.provider_id
        WHERE l.target_type = 'booking'
          AND b.id_booking::text = l.target_id
        LIMIT 1
      ) AS booking_item ON TRUE
      LEFT JOIN LATERAL (
        SELECT
          s.title AS service_title,
          client.full_name AS client_name
        FROM public.payments p
        JOIN public.bookings b ON b.id_booking = p.booking_id
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users client ON client.id_user = b.client_id
        WHERE l.target_type = 'payment'
          AND p.id_payment::text = l.target_id
        LIMIT 1
      ) AS payment_item ON TRUE
      LEFT JOIN public.admin_reports report_item
        ON l.target_type = 'report'
       AND report_item.id_admin_report::text = l.target_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY l.created_at DESC
      ${safeLimit}
      `,
      values
    );

    return result.rows.map(formatRecentLog);
  }

  async getDashboardData() {
    const [
      userStats,
      serviceStats,
      bookingStats,
      paymentStats,
      reviewStats,
      recentLogs,
    ] = await Promise.all([
      db.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE role = 'client' AND deleted_by_admin_at IS NULL)::int AS clients,
          COUNT(*) FILTER (WHERE role = 'provider' AND deleted_by_admin_at IS NULL)::int AS providers,
          COUNT(*) FILTER (
            WHERE role <> 'admin'
              AND (
                warning_count > 0
                OR suspended_at IS NOT NULL
                OR banned_at IS NOT NULL
                OR deleted_by_admin_at IS NOT NULL
              )
          )::int AS sanctioned_accounts
        FROM public.users
        `
      ),
      db.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE admin_status = 'active')::int AS active_services,
          COUNT(*) FILTER (WHERE admin_status = 'suspended')::int AS suspended_services,
          COUNT(*) FILTER (WHERE admin_status = 'deleted')::int AS deleted_services
        FROM public.services
        `
      ),
      db.query(
        `
        SELECT
          COUNT(*)::int AS total_bookings,
          COUNT(*) FILTER (WHERE booking_date = CURRENT_DATE)::int AS bookings_today
        FROM public.bookings
        `
      ),
      db.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_count,
          COALESCE(SUM(amount) FILTER (WHERE payment_status = 'paid'), 0)::numeric(12,2) AS paid_amount
        FROM public.payments
        `
      ),
      db.query(
        `
        SELECT
          COUNT(*) FILTER (WHERE hidden_by_admin = FALSE AND deleted_by_admin_at IS NULL)::int AS public_reviews,
          COUNT(*) FILTER (WHERE hidden_by_admin = TRUE AND deleted_by_admin_at IS NULL)::int AS hidden_reviews
        FROM public.reviews
        `
      ),
      db.query(
        `
        SELECT
          l.id_admin_action::text AS id,
          l.action_type,
          l.target_type,
          l.target_id,
          l.reason,
          l.metadata,
          l.created_at,
          u.full_name AS admin_name,
          target_user.full_name AS target_user_name,
          target_service.title AS target_service_title,
          service_provider.full_name AS target_service_provider_name,
          review_service.title AS target_review_service_title,
          review_client.full_name AS target_review_client_name,
          convo.service_title AS conversation_service_title,
          convo.client_name AS conversation_client_name,
          convo.provider_name AS conversation_provider_name
        FROM public.admin_action_logs l
        JOIN public.users u ON u.id_user = l.admin_id
        LEFT JOIN public.users target_user
          ON l.target_type = 'user'
         AND target_user.id_user::text = l.target_id
        LEFT JOIN public.services target_service
          ON l.target_type = 'service'
         AND target_service.id_service::text = l.target_id
        LEFT JOIN public.users service_provider
          ON service_provider.id_user = target_service.provider_id
        LEFT JOIN public.reviews target_review
          ON l.target_type = 'review'
         AND target_review.id_review::text = l.target_id
        LEFT JOIN public.bookings review_booking
          ON review_booking.id_booking = target_review.booking_id
        LEFT JOIN public.services review_service
          ON review_service.id_service = review_booking.service_id
        LEFT JOIN public.users review_client
          ON review_client.id_user = target_review.client_id
        LEFT JOIN LATERAL (
          SELECT
            s.title AS service_title,
            client.full_name AS client_name,
            provider.full_name AS provider_name
          FROM public.booking_conversations bc
          JOIN public.bookings b ON b.id_booking = bc.booking_id
          JOIN public.services s ON s.id_service = b.service_id
          JOIN public.users client ON client.id_user = bc.client_id
          JOIN public.users provider ON provider.id_user = bc.provider_id
          WHERE l.target_type = 'conversation'
            AND bc.id_conversation::text = l.target_id
          LIMIT 1
        ) AS convo ON TRUE
        ORDER BY l.created_at DESC
        LIMIT 8
        `
      ),
    ]);

    return {
      stats: {
        clients: userStats.rows[0]?.clients || 0,
        providers: userStats.rows[0]?.providers || 0,
        sanctionedAccounts: userStats.rows[0]?.sanctioned_accounts || 0,
        activeServices: serviceStats.rows[0]?.active_services || 0,
        suspendedServices: serviceStats.rows[0]?.suspended_services || 0,
        deletedServices: serviceStats.rows[0]?.deleted_services || 0,
        totalBookings: bookingStats.rows[0]?.total_bookings || 0,
        bookingsToday: bookingStats.rows[0]?.bookings_today || 0,
        paidPayments: paymentStats.rows[0]?.paid_count || 0,
        paidAmount: paymentStats.rows[0]?.paid_amount || 0,
        publicReviews: reviewStats.rows[0]?.public_reviews || 0,
        hiddenReviews: reviewStats.rows[0]?.hidden_reviews || 0,
      },
      recentLogs: recentLogs.rows.map(formatRecentLog),
    };
  }

  async listUsers({ q = "", status = "" } = {}) {
    const values = [];
    const where = [`u.role <> 'admin'`];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length} OR COALESCE(u.phone, '') ILIKE $${values.length})`
      );
    }

    switch (status) {
      case "active":
        where.push(`u.deleted_by_admin_at IS NULL AND u.banned_at IS NULL AND u.suspended_at IS NULL`);
        break;
      case "warned":
        where.push(`u.warning_count > 0`);
        break;
      case "suspended":
        where.push(`u.suspended_at IS NOT NULL`);
        break;
      case "banned":
        where.push(`u.banned_at IS NOT NULL`);
        break;
      case "deleted":
        where.push(`u.deleted_by_admin_at IS NOT NULL`);
        break;
      case "messaging-disabled":
        where.push(`u.can_message = FALSE`);
        break;
      case "publishing-disabled":
        where.push(`u.can_publish_services = FALSE`);
        break;
      default:
        break;
    }

    const result = await db.query(
      `
      SELECT
        u.id_user::text AS id,
        u.full_name,
        u.email,
        u.phone,
        u.profile_photo_path,
        u.role,
        u.warning_count,
        u.suspended_at,
        u.suspended_reason,
        u.banned_at,
        u.banned_reason,
        u.can_message,
        u.can_publish_services,
        u.deleted_by_admin_at,
        u.created_at,
        COUNT(DISTINCT s.id_service)::int AS service_count,
        COUNT(DISTINCT b.id_booking)::int AS booking_count,
        MAX(w.created_at) AS last_warning_at
      FROM public.users u
      LEFT JOIN public.services s ON s.provider_id = u.id_user
      LEFT JOIN public.bookings b ON b.client_id = u.id_user
      LEFT JOIN public.admin_user_warnings w ON w.user_id = u.id_user
      WHERE ${where.join(" AND ")}
      GROUP BY u.id_user
      ORDER BY u.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  async moderateUser({ adminId, userId, action, reason, warningLevel }) {
    const normalizedReason = normalizeReason(reason);
    requireReason(action, normalizedReason);

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `
        SELECT
          id_user::text AS id,
          full_name,
          role,
          warning_count,
          can_message,
          can_publish_services
        FROM public.users
        WHERE id_user::text = $1
        LIMIT 1
        `,
        [userId]
      );

      const user = userResult.rows[0];
      if (!user) {
        throw new Error("Utilisateur introuvable.");
      }

      if (String(user.id) === String(adminId)) {
        throw new Error("Vous ne pouvez pas appliquer cette action sur votre propre compte admin.");
      }

      if (user.role === "admin") {
        throw new Error("La moderation d'un autre compte admin n'est pas autorisee ici.");
      }

      const warningLabel = String(warningLevel || "").trim() || "Avertissement";

      switch (action) {
        case "warn":
          await client.query(
            `
            INSERT INTO public.admin_user_warnings (user_id, admin_id, warning_level, reason)
            VALUES ($1::uuid, $2::uuid, $3, $4)
            `,
            [userId, adminId, warningLabel, normalizedReason]
          );

          await client.query(
            `
            UPDATE public.users
            SET warning_count = warning_count + 1, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId]
          );

          await this.logAction({
            adminId,
            actionType: "warn_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: {
              warningLevel: warningLabel,
              userName: user.full_name,
            },
            dbClient: client,
          });
          break;

        case "suspend":
          await client.query(
            `
            UPDATE public.users
            SET suspended_at = NOW(), suspended_reason = $2, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId, normalizedReason]
          );

          await this.logAction({
            adminId,
            actionType: "suspend_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;

        case "unsuspend":
          await client.query(
            `
            UPDATE public.users
            SET suspended_at = NULL, suspended_reason = NULL, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId]
          );

          await this.logAction({
            adminId,
            actionType: "unsuspend_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;

        case "ban":
          await client.query(
            `
            UPDATE public.users
            SET
              banned_at = NOW(),
              banned_reason = $2,
              can_message = FALSE,
              can_publish_services = FALSE,
              updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId, normalizedReason]
          );

          await client.query(
            `
            UPDATE public.services
            SET
              admin_status = 'deleted',
              admin_status_reason = COALESCE($2, admin_status_reason),
              admin_status_updated_at = NOW(),
              updated_at = NOW()
            WHERE provider_id::text = $1
            `,
            [userId, normalizedReason]
          );

          await this.logAction({
            adminId,
            actionType: "ban_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;

        case "unban":
          await client.query(
            `
            UPDATE public.users
            SET banned_at = NULL, banned_reason = NULL, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId]
          );

          await this.logAction({
            adminId,
            actionType: "unban_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;

        case "disable_messages":
        case "enable_messages": {
          const canMessage = action === "enable_messages";

          await client.query(
            `
            UPDATE public.users
            SET can_message = $2, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId, canMessage]
          );

          await this.logAction({
            adminId,
            actionType: canMessage ? "enable_messages" : "disable_messages",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;
        }

        case "disable_publishing":
        case "enable_publishing": {
          const canPublish = action === "enable_publishing";

          await client.query(
            `
            UPDATE public.users
            SET can_publish_services = $2, updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId, canPublish]
          );

          await this.logAction({
            adminId,
            actionType: canPublish ? "enable_publishing" : "disable_publishing",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;
        }

        case "delete":
          await client.query(
            `
            UPDATE public.users
            SET
              deleted_by_admin_at = NOW(),
              can_message = FALSE,
              can_publish_services = FALSE,
              updated_at = NOW()
            WHERE id_user::text = $1
            `,
            [userId]
          );

          await client.query(
            `
            UPDATE public.services
            SET
              admin_status = 'deleted',
              admin_status_reason = COALESCE($2, admin_status_reason),
              admin_status_updated_at = NOW(),
              updated_at = NOW()
            WHERE provider_id::text = $1
            `,
            [userId, normalizedReason]
          );

          await this.logAction({
            adminId,
            actionType: "delete_user",
            targetType: "user",
            targetId: userId,
            reason: normalizedReason,
            metadata: { userName: user.full_name },
            dbClient: client,
          });
          break;

        default:
          throw new Error("Action admin invalide.");
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async listServices({ q = "", status = "" } = {}) {
    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(s.title ILIKE $${values.length} OR u.full_name ILIKE $${values.length} OR c.name ILIKE $${values.length})`
      );
    }

    if (status && ["active", "suspended", "deleted"].includes(status)) {
      values.push(status);
      where.push(`s.admin_status = $${values.length}`);
    }

    const result = await db.query(
      `
      SELECT
        s.id_service::text AS id,
        s.title,
        s.price,
        s.admin_status,
        s.admin_status_reason,
        s.admin_status_updated_at,
        s.created_at,
        u.id_user::text AS provider_id,
        u.full_name AS provider_name,
        u.email AS provider_email,
        u.profile_photo_path AS provider_profile_photo,
        c.name AS category_name
      FROM public.services s
      JOIN public.users u ON u.id_user = s.provider_id
      JOIN public.categories c ON c.id_category = s.category_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY s.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  async moderateService({ adminId, serviceId, action, reason }) {
    const normalizedReason = normalizeReason(reason);
    requireReason(action, normalizedReason);

    if (!["active", "suspended", "deleted"].includes(action)) {
      throw new Error("Action service invalide.");
    }

    const result = await db.query(
      `
      UPDATE public.services
      SET
        admin_status = $2,
        admin_status_reason = $3,
        admin_status_updated_at = NOW(),
        updated_at = NOW()
      WHERE id_service::text = $1
      RETURNING id_service::text AS id, title
      `,
      [serviceId, action, normalizedReason]
    );

    if (!result.rows[0]) {
      throw new Error("Service introuvable.");
    }

    await this.logAction({
      adminId,
      actionType: `${action}_service`,
      targetType: "service",
      targetId: serviceId,
      reason: normalizedReason,
      metadata: {
        serviceTitle: result.rows[0]?.title || null,
      },
    });
  }

  async listReviews({ q = "", visibility = "" } = {}) {
    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(COALESCE(r.comment, '') ILIKE $${values.length} OR s.title ILIKE $${values.length} OR client.full_name ILIKE $${values.length} OR provider.full_name ILIKE $${values.length})`
      );
    }

    switch (visibility) {
      case "visible":
        where.push(`r.hidden_by_admin = FALSE AND r.deleted_by_admin_at IS NULL`);
        break;
      case "hidden":
        where.push(`r.hidden_by_admin = TRUE AND r.deleted_by_admin_at IS NULL`);
        break;
      case "deleted":
        where.push(`r.deleted_by_admin_at IS NOT NULL`);
        break;
      default:
        break;
    }

    const result = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.provider_reply,
        r.hidden_by_admin,
        r.admin_hidden_reason,
        r.deleted_by_admin_at,
        r.created_at,
        s.title AS service_title,
        client.full_name AS client_name,
        client.profile_photo_path AS client_profile_photo,
        provider.full_name AS provider_name,
        provider.profile_photo_path AS provider_profile_photo
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users client ON client.id_user = r.client_id
      JOIN public.users provider ON provider.id_user = r.provider_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY r.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  async moderateReview({ adminId, reviewId, action, reason }) {
    const normalizedReason = normalizeReason(reason);
    requireReason(action, normalizedReason);

    if (!["visible", "hidden", "deleted"].includes(action)) {
      throw new Error("Action avis invalide.");
    }

    const mapping = {
      visible: {
        hidden: false,
        deletedAt: null,
        reason: null,
      },
      hidden: {
        hidden: true,
        deletedAt: null,
        reason: normalizedReason,
      },
      deleted: {
        hidden: true,
        deletedAt: new Date().toISOString(),
        reason: normalizedReason,
      },
    };

    const target = mapping[action];

    const result = await db.query(
      `
      WITH review_target AS (
        SELECT
          r.id_review,
          s.title AS service_title
        FROM public.reviews r
        JOIN public.bookings b ON b.id_booking = r.booking_id
        JOIN public.services s ON s.id_service = b.service_id
        WHERE r.id_review::text = $1
        LIMIT 1
      )
      UPDATE public.reviews
      SET
        hidden_by_admin = $2,
        admin_hidden_reason = $3,
        deleted_by_admin_at = $4::timestamptz,
        updated_at = NOW()
      FROM review_target
      WHERE public.reviews.id_review = review_target.id_review
      RETURNING public.reviews.id_review::text AS id, review_target.service_title
      `,
      [reviewId, target.hidden, target.reason, target.deletedAt]
    );

    if (!result.rows[0]) {
      throw new Error("Avis introuvable.");
    }

    await this.logAction({
      adminId,
      actionType: `${action}_review`,
      targetType: "review",
      targetId: reviewId,
      reason: normalizedReason,
      metadata: {
        serviceTitle: result.rows[0]?.service_title || null,
      },
    });
  }

  async listConversations({ q = "" } = {}) {
    await BookingMaintenanceService.expirePendingBookings();

    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(client.full_name ILIKE $${values.length} OR provider.full_name ILIKE $${values.length} OR s.title ILIKE $${values.length} OR COALESCE(last_message.content, '') ILIKE $${values.length})`
      );
    }

    const result = await db.query(
      `
      SELECT
        bc.id_conversation::text AS id,
        bc.booking_id::text AS booking_id,
        s.title AS service_title,
        b.booking_date,
        b.booking_time,
        b.status AS booking_status,
        client.full_name AS client_name,
        client.email AS client_email,
        client.profile_photo_path AS client_profile_photo,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.profile_photo_path AS provider_profile_photo,
        last_message.content AS last_message,
        last_message.created_at AS last_message_at,
        COUNT(cm.id_message)::int AS message_count
      FROM public.booking_conversations bc
      JOIN public.bookings b ON b.id_booking = bc.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users client ON client.id_user = bc.client_id
      JOIN public.users provider ON provider.id_user = bc.provider_id
      LEFT JOIN public.conversation_messages cm ON cm.conversation_id = bc.id_conversation
      LEFT JOIN LATERAL (
        SELECT content, created_at
        FROM public.conversation_messages
        WHERE conversation_id = bc.id_conversation
        ORDER BY created_at DESC
        LIMIT 1
      ) AS last_message ON TRUE
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      GROUP BY
        bc.id_conversation,
        bc.booking_id,
        s.title,
        b.booking_date,
        b.booking_time,
        b.status,
        client.full_name,
        client.email,
        client.profile_photo_path,
        provider.full_name,
        provider.email,
        provider.profile_photo_path,
        last_message.content,
        last_message.created_at
      ORDER BY COALESCE(last_message.created_at, bc.updated_at, bc.created_at) DESC
      `
      ,
      values
    );

    return result.rows;
  }

  async getConversationByIdForAdmin({ conversationId, adminId }) {
    await BookingMaintenanceService.expirePendingBookings();

    const conversationResult = await db.query(
      `
      SELECT
        bc.id_conversation::text AS id,
        bc.booking_id::text AS booking_id,
        bc.client_id::text AS client_id,
        bc.provider_id::text AS provider_id,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        b.booking_date,
        b.booking_time,
        b.status AS booking_status,
        b.total_price,
        client.full_name AS client_name,
        client.email AS client_email,
        client.profile_photo_path AS client_profile_photo,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.profile_photo_path AS provider_profile_photo
      FROM public.booking_conversations bc
      JOIN public.bookings b ON b.id_booking = bc.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users client ON client.id_user = bc.client_id
      JOIN public.users provider ON provider.id_user = bc.provider_id
      WHERE bc.id_conversation::text = $1
      LIMIT 1
      `,
      [conversationId]
    );

    const conversation = conversationResult.rows[0];
    if (!conversation) {
      throw new Error("Conversation introuvable.");
    }

    const messagesResult = await db.query(
      `
      SELECT
        cm.id_message::text AS id,
        cm.sender_id::text AS sender_id,
        u.full_name AS sender_name,
        u.profile_photo_path AS sender_profile_photo,
        CASE
          WHEN cm.sender_id = bc.client_id THEN 'client'
          WHEN cm.sender_id = bc.provider_id THEN 'provider'
          ELSE COALESCE(u.role::text, 'client')
        END AS sender_role,
        cm.content,
        cm.created_at
      FROM public.conversation_messages cm
      JOIN public.booking_conversations bc
        ON bc.id_conversation = cm.conversation_id
      JOIN public.users u ON u.id_user = cm.sender_id
      WHERE cm.conversation_id::text = $1
      ORDER BY cm.created_at ASC
      `,
      [conversationId]
    );

    await this.logAction({
      adminId,
      actionType: "read_conversation",
      targetType: "conversation",
      targetId: conversationId,
      reason: "Consultation admin en lecture seule",
      metadata: {
        clientName: conversation.client_name,
        providerName: conversation.provider_name,
        serviceTitle: conversation.service_title,
      },
    });

    return {
      ...conversation,
      messages: messagesResult.rows,
    };
  }

  async listBookings({ q = "", status = "" } = {}) {
    await BookingMaintenanceService.expirePendingBookings();

    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(client.full_name ILIKE $${values.length} OR provider.full_name ILIKE $${values.length} OR s.title ILIKE $${values.length} OR COALESCE(b.city, '') ILIKE $${values.length})`
      );
    }

    if (status) {
      values.push(status);
      where.push(`b.status = $${values.length}`);
    }

    const result = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_price,
        b.created_at,
        b.city,
        b.address,
        client.id_user::text AS client_id,
        client.full_name AS client_name,
        client.email AS client_email,
        client.profile_photo_path AS client_profile_photo,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.profile_photo_path AS provider_profile_photo,
        s.id_service::text AS service_id,
        s.title AS service_title,
        c.name AS category_name,
        bc.id_conversation::text AS conversation_id,
        p.id_payment::text AS payment_id,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        COALESCE(p.payment_method::text, 'non renseigne') AS payment_method
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.categories c ON c.id_category = s.category_id
      JOIN public.users client ON client.id_user = b.client_id
      JOIN public.users provider ON provider.id_user = s.provider_id
      LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY b.created_at DESC
      `
      ,
      values
    );

    return result.rows;
  }

  async getBookingById({ bookingId, adminId }) {
    await BookingMaintenanceService.expirePendingBookings();

    const bookingResult = await db.query(
      `
      SELECT
        b.id_booking::text AS id,
        b.booking_date,
        b.booking_time,
        b.status,
        b.total_price,
        b.first_name,
        b.last_name,
        b.city,
        b.address,
        b.created_at,
        b.updated_at,
        client.id_user::text AS client_id,
        client.full_name AS client_name,
        client.email AS client_email,
        client.phone AS client_phone,
        client.profile_photo_path AS client_profile_photo,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.phone AS provider_phone,
        provider.profile_photo_path AS provider_profile_photo,
        s.id_service::text AS service_id,
        s.title AS service_title,
        s.admin_status AS service_admin_status,
        c.name AS category_name,
        bc.id_conversation::text AS conversation_id,
        p.id_payment::text AS payment_id,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        COALESCE(p.payment_method::text, 'non renseigne') AS payment_method,
        p.payment_details,
        p.payment_date,
        r.id_review::text AS review_id,
        r.rating AS review_rating,
        r.comment AS review_comment
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.categories c ON c.id_category = s.category_id
      JOIN public.users client ON client.id_user = b.client_id
      JOIN public.users provider ON provider.id_user = s.provider_id
      LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      WHERE b.id_booking::text = $1
      LIMIT 1
      `,
      [bookingId]
    );

    const booking = bookingResult.rows[0];
    if (!booking) {
      throw new Error("Reservation introuvable.");
    }

    const [messagesResult, logs] = await Promise.all([
      booking.conversation_id
        ? db.query(
            `
            SELECT
              cm.id_message::text AS id,
              u.full_name AS sender_name,
              cm.content,
              cm.created_at
            FROM public.conversation_messages cm
            JOIN public.users u ON u.id_user = cm.sender_id
            WHERE cm.conversation_id::text = $1
            ORDER BY cm.created_at DESC
            LIMIT 6
            `,
            [booking.conversation_id]
          )
        : Promise.resolve({ rows: [] }),
      this.queryActionLogs({ targetType: "booking", targetId: bookingId, limit: 8 }),
    ]);

    await this.logAction({
      adminId,
      actionType: "read_booking",
      targetType: "booking",
      targetId: bookingId,
      reason: "Consultation admin du detail de reservation",
      metadata: {
        serviceTitle: booking.service_title,
        clientName: booking.client_name,
        providerName: booking.provider_name,
      },
    });

    return {
      ...booking,
      recentMessages: messagesResult.rows.reverse(),
      adminLogs: logs,
    };
  }

  async listPayments({ q = "", status = "", method = "" } = {}) {
    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(client.full_name ILIKE $${values.length} OR provider.full_name ILIKE $${values.length} OR s.title ILIKE $${values.length})`
      );
    }

    if (status) {
      values.push(status);
      where.push(`p.payment_status = $${values.length}`);
    }

    if (method) {
      values.push(method);
      where.push(`p.payment_method = $${values.length}`);
    }

    const result = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        p.created_at,
        b.id_booking::text AS booking_id,
        b.status AS booking_status,
        client.id_user::text AS client_id,
        client.full_name AS client_name,
        client.email AS client_email,
        client.profile_photo_path AS client_profile_photo,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.profile_photo_path AS provider_profile_photo,
        s.id_service::text AS service_id,
        s.title AS service_title
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users client ON client.id_user = b.client_id
      JOIN public.users provider ON provider.id_user = s.provider_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY COALESCE(p.payment_date, p.created_at) DESC
      `,
      values
    );

    return result.rows;
  }

  async getPaymentById({ paymentId, adminId }) {
    const paymentResult = await db.query(
      `
      SELECT
        p.id_payment::text AS id,
        p.amount,
        p.payment_method,
        p.payment_status,
        p.payment_date,
        p.payment_details,
        p.created_at,
        b.id_booking::text AS booking_id,
        b.status AS booking_status,
        b.booking_date,
        b.booking_time,
        client.id_user::text AS client_id,
        client.full_name AS client_name,
        client.email AS client_email,
        client.phone AS client_phone,
        client.profile_photo_path AS client_profile_photo,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.phone AS provider_phone,
        provider.profile_photo_path AS provider_profile_photo,
        s.id_service::text AS service_id,
        s.title AS service_title,
        c.name AS category_name,
        bc.id_conversation::text AS conversation_id,
        r.id_review::text AS review_id,
        r.rating AS review_rating
      FROM public.payments p
      JOIN public.bookings b ON b.id_booking = p.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.categories c ON c.id_category = s.category_id
      JOIN public.users client ON client.id_user = b.client_id
      JOIN public.users provider ON provider.id_user = s.provider_id
      LEFT JOIN public.booking_conversations bc ON bc.booking_id = b.id_booking
      LEFT JOIN public.reviews r ON r.booking_id = b.id_booking
      WHERE p.id_payment::text = $1
      LIMIT 1
      `,
      [paymentId]
    );

    const payment = paymentResult.rows[0];
    if (!payment) {
      throw new Error("Paiement introuvable.");
    }

    const logs = await this.queryActionLogs({
      targetType: "payment",
      targetId: paymentId,
      limit: 8,
    });

    await this.logAction({
      adminId,
      actionType: "read_payment",
      targetType: "payment",
      targetId: paymentId,
      reason: "Consultation admin du detail de paiement",
      metadata: {
        serviceTitle: payment.service_title,
        clientName: payment.client_name,
      },
    });

    return {
      ...payment,
      adminLogs: logs,
    };
  }

  async getUserById({ userId, adminId }) {
    const userResult = await db.query(
      `
      SELECT
        u.id_user::text AS id,
        u.full_name,
        u.email,
        u.phone,
        u.address,
        u.role,
        u.profile_photo_path,
        u.provider_status,
        u.experience_years,
        u.trainings,
        u.has_driving_license,
        u.service_area,
        u.warning_count,
        u.suspended_at,
        u.suspended_reason,
        u.banned_at,
        u.banned_reason,
        u.can_message,
        u.can_publish_services,
        u.deleted_by_admin_at,
        u.created_at,
        (
          SELECT COUNT(*)
          FROM public.services s
          WHERE s.provider_id = u.id_user
        )::int AS service_count,
        (
          SELECT COUNT(*)
          FROM public.bookings b
          WHERE b.client_id = u.id_user
        )::int AS client_booking_count,
        (
          SELECT COUNT(*)
          FROM public.bookings b
          JOIN public.services s ON s.id_service = b.service_id
          WHERE s.provider_id = u.id_user
        )::int AS provider_booking_count,
        (
          SELECT COUNT(*)
          FROM public.reviews r
          WHERE r.client_id = u.id_user
            AND r.deleted_by_admin_at IS NULL
        )::int AS reviews_given_count,
        (
          SELECT COUNT(*)
          FROM public.reviews r
          WHERE r.provider_id = u.id_user
            AND r.deleted_by_admin_at IS NULL
        )::int AS reviews_received_count,
        (
          SELECT COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paid'), 0)
          FROM public.payments p
          JOIN public.bookings b ON b.id_booking = p.booking_id
          JOIN public.services s ON s.id_service = b.service_id
          WHERE s.provider_id = u.id_user
        )::numeric(12,2) AS revenue_received
      FROM public.users u
      WHERE u.id_user::text = $1
      LIMIT 1
      `,
      [userId]
    );

    const user = userResult.rows[0];
    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    const [
      recentServices,
      recentClientBookings,
      recentProviderBookings,
      recentPayments,
      warnings,
      adminLogs,
    ] = await Promise.all([
      db.query(
        `
        SELECT
          s.id_service::text AS id,
          s.title,
          s.admin_status,
          s.price,
          s.created_at
        FROM public.services s
        WHERE s.provider_id::text = $1
        ORDER BY s.created_at DESC
        LIMIT 6
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          b.id_booking::text AS id,
          s.title AS service_title,
          b.status,
          b.booking_date,
          b.booking_time,
          provider.full_name AS provider_name
        FROM public.bookings b
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users provider ON provider.id_user = s.provider_id
        WHERE b.client_id::text = $1
        ORDER BY b.created_at DESC
        LIMIT 6
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          b.id_booking::text AS id,
          s.title AS service_title,
          b.status,
          b.booking_date,
          b.booking_time,
          client.full_name AS client_name
        FROM public.bookings b
        JOIN public.services s ON s.id_service = b.service_id
        JOIN public.users client ON client.id_user = b.client_id
        WHERE s.provider_id::text = $1
        ORDER BY b.created_at DESC
        LIMIT 6
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          p.id_payment::text AS id,
          p.amount,
          p.payment_status,
          p.payment_method,
          p.payment_date,
          s.title AS service_title
        FROM public.payments p
        JOIN public.bookings b ON b.id_booking = p.booking_id
        JOIN public.services s ON s.id_service = b.service_id
        WHERE b.client_id::text = $1
           OR s.provider_id::text = $1
        ORDER BY COALESCE(p.payment_date, p.created_at) DESC
        LIMIT 6
        `,
        [userId]
      ),
      db.query(
        `
        SELECT
          w.warning_level,
          w.reason,
          w.created_at,
          admin.full_name AS admin_name
        FROM public.admin_user_warnings w
        JOIN public.users admin ON admin.id_user = w.admin_id
        WHERE w.user_id::text = $1
        ORDER BY w.created_at DESC
        LIMIT 6
        `,
        [userId]
      ),
      this.queryActionLogs({ targetType: "user", targetId: userId, limit: 8 }),
    ]);

    await this.logAction({
      adminId,
      actionType: "read_user",
      targetType: "user",
      targetId: userId,
      reason: "Consultation admin du compte",
      metadata: { userName: user.full_name },
    });

    return {
      ...user,
      recentServices: recentServices.rows,
      recentClientBookings: recentClientBookings.rows,
      recentProviderBookings: recentProviderBookings.rows,
      recentPayments: recentPayments.rows,
      warnings: warnings.rows,
      adminLogs,
    };
  }

  async getServiceById({ serviceId, adminId }) {
    const serviceResult = await db.query(
      `
      SELECT
        s.id_service::text AS id,
        s.title,
        s.description,
        s.price,
        s.admin_status,
        s.admin_status_reason,
        s.admin_status_updated_at,
        s.created_at,
        c.name AS category_name,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.phone AS provider_phone,
        provider.profile_photo_path AS provider_profile_photo,
        (
          SELECT COUNT(*)
          FROM public.bookings b
          WHERE b.service_id = s.id_service
        )::int AS booking_count,
        (
          SELECT COUNT(*)
          FROM public.payments p
          JOIN public.bookings b ON b.id_booking = p.booking_id
          WHERE b.service_id = s.id_service
            AND p.payment_status = 'paid'
        )::int AS paid_count,
        (
          SELECT COALESCE(SUM(p.amount) FILTER (WHERE p.payment_status = 'paid'), 0)
          FROM public.payments p
          JOIN public.bookings b ON b.id_booking = p.booking_id
          WHERE b.service_id = s.id_service
        )::numeric(12,2) AS paid_amount,
        (
          SELECT COUNT(*)
          FROM public.reviews r
          JOIN public.bookings b ON b.id_booking = r.booking_id
          WHERE b.service_id = s.id_service
            AND r.deleted_by_admin_at IS NULL
        )::int AS review_count,
        (
          SELECT COALESCE(AVG(r.rating), 0)
          FROM public.reviews r
          JOIN public.bookings b ON b.id_booking = r.booking_id
          WHERE b.service_id = s.id_service
            AND r.deleted_by_admin_at IS NULL
        )::numeric(10,2) AS average_rating
      FROM public.services s
      JOIN public.categories c ON c.id_category = s.category_id
      JOIN public.users provider ON provider.id_user = s.provider_id
      WHERE s.id_service::text = $1
      LIMIT 1
      `,
      [serviceId]
    );

    const service = serviceResult.rows[0];
    if (!service) {
      throw new Error("Service introuvable.");
    }

    const [photos, bookings, reviews, adminLogs] = await Promise.all([
      db.query(
        `
        SELECT
          id_service_photo::text AS id,
          image_path,
          display_order
        FROM public.service_photos
        WHERE service_id::text = $1
        ORDER BY display_order ASC, created_at ASC
        `,
        [serviceId]
      ),
      db.query(
        `
        SELECT
          b.id_booking::text AS id,
          b.status,
          b.booking_date,
          b.booking_time,
          b.total_price,
          client.full_name AS client_name,
          p.id_payment::text AS payment_id,
          COALESCE(p.payment_status::text, 'unpaid') AS payment_status
        FROM public.bookings b
        JOIN public.users client ON client.id_user = b.client_id
        LEFT JOIN public.payments p ON p.booking_id = b.id_booking
        WHERE b.service_id::text = $1
        ORDER BY b.created_at DESC
        LIMIT 6
        `,
        [serviceId]
      ),
      db.query(
        `
        SELECT
          r.id_review::text AS id,
          r.rating,
          r.comment,
          r.provider_reply,
          r.hidden_by_admin,
          r.deleted_by_admin_at,
          r.created_at,
          client.full_name AS client_name
        FROM public.reviews r
        JOIN public.bookings b ON b.id_booking = r.booking_id
        JOIN public.users client ON client.id_user = r.client_id
        WHERE b.service_id::text = $1
        ORDER BY r.created_at DESC
        LIMIT 6
        `,
        [serviceId]
      ),
      this.queryActionLogs({ targetType: "service", targetId: serviceId, limit: 8 }),
    ]);

    await this.logAction({
      adminId,
      actionType: "read_service",
      targetType: "service",
      targetId: serviceId,
      reason: "Consultation admin du service",
      metadata: { serviceTitle: service.title },
    });

    return {
      ...service,
      photos: photos.rows,
      recentBookings: bookings.rows,
      recentReviews: reviews.rows,
      adminLogs,
    };
  }

  async getReviewById({ reviewId, adminId }) {
    const reviewResult = await db.query(
      `
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.provider_reply,
        r.provider_reply_created_at,
        r.provider_reply_updated_at,
        r.hidden_by_admin,
        r.admin_hidden_reason,
        r.deleted_by_admin_at,
        r.created_at,
        r.updated_at,
        b.id_booking::text AS booking_id,
        b.status AS booking_status,
        b.booking_date,
        b.booking_time,
        p.id_payment::text AS payment_id,
        COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
        COALESCE(p.payment_method::text, 'non renseigne') AS payment_method,
        s.id_service::text AS service_id,
        s.title AS service_title,
        client.id_user::text AS client_id,
        client.full_name AS client_name,
        client.email AS client_email,
        client.profile_photo_path AS client_profile_photo,
        provider.id_user::text AS provider_id,
        provider.full_name AS provider_name,
        provider.email AS provider_email,
        provider.profile_photo_path AS provider_profile_photo
      FROM public.reviews r
      JOIN public.bookings b ON b.id_booking = r.booking_id
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users client ON client.id_user = r.client_id
      JOIN public.users provider ON provider.id_user = r.provider_id
      LEFT JOIN public.payments p ON p.booking_id = b.id_booking
      WHERE r.id_review::text = $1
      LIMIT 1
      `,
      [reviewId]
    );

    const review = reviewResult.rows[0];
    if (!review) {
      throw new Error("Avis introuvable.");
    }

    const adminLogs = await this.queryActionLogs({
      targetType: "review",
      targetId: reviewId,
      limit: 8,
    });

    await this.logAction({
      adminId,
      actionType: "read_review",
      targetType: "review",
      targetId: reviewId,
      reason: "Consultation admin du detail d'avis",
      metadata: { serviceTitle: review.service_title },
    });

    return {
      ...review,
      adminLogs,
    };
  }

  async listActionLogs(filters = {}) {
    return this.queryActionLogs(filters);
  }

  async searchAll({ q = "" } = {}) {
    const searchPattern = buildSearchPattern(q);
    if (!searchPattern) {
      return {
        query: "",
        users: [],
        services: [],
        bookings: [],
        payments: [],
        reviews: [],
        conversations: [],
      };
    }

    const [users, services, bookings, payments, reviews, conversations] =
      await Promise.all([
        db.query(
          `
          SELECT
            id_user::text AS id,
            full_name,
            email,
            role
          FROM public.users
          WHERE role <> 'admin'
            AND (full_name ILIKE $1 OR email ILIKE $1)
          ORDER BY created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
        db.query(
          `
          SELECT
            s.id_service::text AS id,
            s.title,
            s.admin_status,
            u.full_name AS provider_name
          FROM public.services s
          JOIN public.users u ON u.id_user = s.provider_id
          WHERE s.title ILIKE $1
             OR u.full_name ILIKE $1
          ORDER BY s.created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
        db.query(
          `
          SELECT
            b.id_booking::text AS id,
            s.title AS service_title,
            client.full_name AS client_name,
            provider.full_name AS provider_name,
            b.status
          FROM public.bookings b
          JOIN public.services s ON s.id_service = b.service_id
          JOIN public.users client ON client.id_user = b.client_id
          JOIN public.users provider ON provider.id_user = s.provider_id
          WHERE s.title ILIKE $1
             OR client.full_name ILIKE $1
             OR provider.full_name ILIKE $1
          ORDER BY b.created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
        db.query(
          `
          SELECT
            p.id_payment::text AS id,
            s.title AS service_title,
            client.full_name AS client_name,
            p.amount,
            p.payment_status
          FROM public.payments p
          JOIN public.bookings b ON b.id_booking = p.booking_id
          JOIN public.services s ON s.id_service = b.service_id
          JOIN public.users client ON client.id_user = b.client_id
          WHERE s.title ILIKE $1
             OR client.full_name ILIKE $1
          ORDER BY p.created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
        db.query(
          `
          SELECT
            r.id_review::text AS id,
            s.title AS service_title,
            client.full_name AS client_name,
            provider.full_name AS provider_name,
            r.rating
          FROM public.reviews r
          JOIN public.bookings b ON b.id_booking = r.booking_id
          JOIN public.services s ON s.id_service = b.service_id
          JOIN public.users client ON client.id_user = r.client_id
          JOIN public.users provider ON provider.id_user = r.provider_id
          WHERE COALESCE(r.comment, '') ILIKE $1
             OR s.title ILIKE $1
             OR client.full_name ILIKE $1
             OR provider.full_name ILIKE $1
          ORDER BY r.created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
        db.query(
          `
          SELECT
            bc.id_conversation::text AS id,
            s.title AS service_title,
            client.full_name AS client_name,
            provider.full_name AS provider_name
          FROM public.booking_conversations bc
          JOIN public.bookings b ON b.id_booking = bc.booking_id
          JOIN public.services s ON s.id_service = b.service_id
          JOIN public.users client ON client.id_user = bc.client_id
          JOIN public.users provider ON provider.id_user = bc.provider_id
          WHERE s.title ILIKE $1
             OR client.full_name ILIKE $1
             OR provider.full_name ILIKE $1
          ORDER BY bc.created_at DESC
          LIMIT 6
          `,
          [searchPattern]
        ),
      ]);

    return {
      query: q,
      users: users.rows,
      services: services.rows,
      bookings: bookings.rows,
      payments: payments.rows,
      reviews: reviews.rows,
      conversations: conversations.rows,
    };
  }

  async listReports({ q = "", status = "", priority = "" } = {}) {
    const hasReportsTable = await this.hasReportsTable();
    if (!hasReportsTable) {
      return [];
    }

    const values = [];
    const where = [];
    const searchPattern = buildSearchPattern(q);

    if (searchPattern) {
      values.push(searchPattern);
      where.push(
        `(r.title ILIKE $${values.length} OR r.description ILIKE $${values.length} OR r.target_type ILIKE $${values.length})`
      );
    }

    if (status) {
      values.push(status);
      where.push(`r.status = $${values.length}`);
    }

    if (priority) {
      values.push(priority);
      where.push(`r.priority = $${values.length}`);
    }

    const result = await db.query(
      `
      SELECT
        r.id_admin_report::text AS id,
        r.target_type,
        r.target_id,
        r.title,
        r.description,
        r.priority,
        r.status,
        r.resolution_note,
        r.created_at,
        r.updated_at,
        r.resolved_at,
        creator.full_name AS created_by_name,
        assignee.full_name AS assigned_admin_name
      FROM public.admin_reports r
      JOIN public.users creator ON creator.id_user = r.created_by_admin_id
      LEFT JOIN public.users assignee ON assignee.id_user = r.assigned_admin_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY r.created_at DESC
      `
      ,
      values
    );

    return result.rows;
  }

  async createReport({
    adminId,
    targetType,
    targetId,
    title,
    description,
    priority = "moyenne",
  }) {
    const hasReportsTable = await this.hasReportsTable();
    if (!hasReportsTable) {
      throw new Error("Les signalements admin ne sont pas encore disponibles.");
    }

    const cleanTargetType = String(targetType || "").trim();
    const cleanTargetId = String(targetId || "").trim();
    const cleanTitle = String(title || "").trim();
    const cleanDescription = String(description || "").trim();
    const cleanPriority = String(priority || "moyenne").trim();

    if (!cleanTargetType || !cleanTargetId || !cleanTitle || !cleanDescription) {
      throw new Error("Tous les champs du signalement sont obligatoires.");
    }

    const result = await db.query(
      `
      INSERT INTO public.admin_reports (
        created_by_admin_id,
        target_type,
        target_id,
        title,
        description,
        priority,
        status
      )
      VALUES ($1::uuid, $2, $3, $4, $5, $6, 'ouvert')
      RETURNING id_admin_report::text AS id, title
      `,
      [adminId, cleanTargetType, cleanTargetId, cleanTitle, cleanDescription, cleanPriority]
    );

    await this.logAction({
      adminId,
      actionType: "create_report",
      targetType: "report",
      targetId: result.rows[0].id,
      reason: cleanDescription,
      metadata: {
        reportTitle: result.rows[0].title,
        priority: cleanPriority,
      },
    });

    return result.rows[0];
  }

  async updateReportStatus({
    adminId,
    reportId,
    status,
    resolutionNote,
  }) {
    const hasReportsTable = await this.hasReportsTable();
    if (!hasReportsTable) {
      throw new Error("Les signalements admin ne sont pas encore disponibles.");
    }

    const cleanStatus = String(status || "").trim();
    const cleanNote = normalizeReason(resolutionNote);
    if (!cleanStatus) {
      throw new Error("Le nouveau statut du signalement est obligatoire.");
    }

    const result = await db.query(
      `
      UPDATE public.admin_reports
      SET
        status = $2,
        resolution_note = $3,
        assigned_admin_id = $4::uuid,
        resolved_at = CASE WHEN $2 = 'resolu' THEN NOW() ELSE NULL END,
        updated_at = NOW()
      WHERE id_admin_report::text = $1
      RETURNING id_admin_report::text AS id, title
      `,
      [reportId, cleanStatus, cleanNote, adminId]
    );

    if (!result.rows[0]) {
      throw new Error("Signalement introuvable.");
    }

    await this.logAction({
      adminId,
      actionType: "update_report_status",
      targetType: "report",
      targetId: reportId,
      reason: cleanNote || cleanStatus,
      metadata: {
        reportTitle: result.rows[0].title,
        status: cleanStatus,
      },
    });

    return result.rows[0];
  }
}

export default new AdminService();
