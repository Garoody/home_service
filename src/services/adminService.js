"use strict";

import db, { pool } from "../config/database.js";
import DashboardService from "./DashboardService.js";
import UserService from "./UserService.js";

/**
 * Service d'administration et de moderation.
 * Il centralise le dashboard admin et les actions realisees apres publication :
 * signalements, avertissements, sanctions et suppressions de contenus.
 */
class AdminService {
  constructor() {
    this._hasModerationSchema = null;
  }

  async hasModerationSchema() {
    if (this._hasModerationSchema !== null) {
      return this._hasModerationSchema;
    }

    const query = /*sql*/`
      SELECT
        (
          SELECT COUNT(*)::int
          FROM information_schema.tables
          WHERE table_schema = 'public'
            AND table_name IN ('reports', 'warnings', 'admin_action_logs')
        ) AS table_count,
        (
          SELECT COUNT(*)::int
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = 'users'
            AND column_name IN ('account_status', 'status_reason', 'status_changed_at', 'warning_count')
        ) AS column_count;
    `;

    const { rows } = await db.query(query);
    this._hasModerationSchema =
      rows[0]?.table_count === 3 && rows[0]?.column_count === 4;
    return this._hasModerationSchema;
  }

  async getDashboard(filters = {}) {
    const moderationEnabled = await this.hasModerationSchema();
    const safeFilters = {
      q: String(filters.q || "").trim(),
      role: String(filters.role || "").trim(),
      userStatus: String(filters.userStatus || "").trim(),
      warnedOnly: String(filters.warnedOnly || "").trim(),
      reportStatus: String(filters.reportStatus || "").trim(),
      targetType: String(filters.targetType || "").trim(),
    };

    const [
      totalClients,
      totalProviders,
      totalServices,
      totalBookings,
      totalReviews,
      totalWarnings,
      pendingReports,
      warnedUsers,
      users,
      reports,
      warnings,
      recentServices,
      recentReviews,
      actionLogs,
    ] = await Promise.all([
      this.countUsersByRole("client"),
      this.countUsersByRole("provider"),
      this.countTable("services"),
      this.countTable("bookings"),
      this.countTable("reviews"),
      moderationEnabled ? this.countTable("warnings") : Promise.resolve(0),
      moderationEnabled ? this.countPendingReports() : Promise.resolve(0),
      moderationEnabled ? this.countWarnedUsers() : Promise.resolve(0),
      this.listUsers(safeFilters, moderationEnabled),
      moderationEnabled ? this.listReports(safeFilters) : Promise.resolve([]),
      moderationEnabled ? this.listWarnings() : Promise.resolve([]),
      this.listRecentServices(moderationEnabled),
      this.listRecentReviews(moderationEnabled),
      moderationEnabled ? this.listActionLogs() : Promise.resolve([]),
    ]);

    return {
      moderationEnabled,
      filters: safeFilters,
      stats: {
        clients: totalClients,
        providers: totalProviders,
        services: totalServices,
        bookings: totalBookings,
        reviews: totalReviews,
        pendingReports,
        warnedUsers,
        warnings: totalWarnings,
      },
      users,
      reports,
      warnings,
      recentServices,
      recentReviews,
      actionLogs,
    };
  }

  async getUsersPage(filters = {}) {
    const moderationEnabled = await this.hasModerationSchema();
    const safeFilters = {
      q: String(filters.q || "").trim(),
      role: String(filters.role || "").trim(),
      userStatus: String(filters.userStatus || "").trim(),
      warnedOnly: String(filters.warnedOnly || "").trim(),
    };

    return {
      moderationEnabled,
      filters: safeFilters,
      users: await this.listUsers(safeFilters, moderationEnabled),
    };
  }

  async getReportsPage(filters = {}) {
    const moderationEnabled = await this.hasModerationSchema();
    const safeFilters = {
      reportStatus: String(filters.reportStatus || "").trim(),
      targetType: String(filters.targetType || "").trim(),
    };

    return {
      moderationEnabled,
      filters: safeFilters,
      reports: moderationEnabled ? await this.listReports(safeFilters) : [],
    };
  }

  async getWarningsPage() {
    const moderationEnabled = await this.hasModerationSchema();
    return {
      moderationEnabled,
      warnings: moderationEnabled ? await this.listWarnings() : [],
    };
  }

  async getServicesPage() {
    const moderationEnabled = await this.hasModerationSchema();
    return {
      moderationEnabled,
      services: await this.listServicesPage(moderationEnabled),
    };
  }

  async getReviewsPage() {
    const moderationEnabled = await this.hasModerationSchema();
    return {
      moderationEnabled,
      reviews: await this.listReviewsPage(moderationEnabled),
    };
  }

  async getBookingsPage() {
    return {
      bookings: await this.listBookingsPage(),
    };
  }

  async getUserProfilePage(userId) {
    const moderationEnabled = await this.hasModerationSchema();
    const user = await UserService.getById(userId);

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    if (user.role === "admin") {
      throw new Error("Cette fiche profil est reservee aux clients et prestataires.");
    }

    const dashboard =
      user.role === "provider"
        ? await DashboardService.getProviderDashboard(userId)
        : await DashboardService.getClientDashboard(userId);

    const warnings = moderationEnabled
      ? await db.query(
          `
          SELECT
            id_warning::text AS id,
            message,
            sanction_applied,
            created_at
          FROM public.warnings
          WHERE user_id::text = $1
          ORDER BY created_at DESC
          LIMIT 10
          `,
          [userId]
        )
      : { rows: [] };

    const reports = moderationEnabled
      ? await db.query(
          `
          SELECT
            id_report::text AS id,
            target_type,
            reason,
            status,
            created_at
          FROM public.reports
          WHERE target_type = 'user'
            AND target_id::text = $1
          ORDER BY created_at DESC
          LIMIT 10
          `,
          [userId]
        )
      : { rows: [] };

    return {
      moderationEnabled,
      user,
      dashboard,
      warnings: warnings.rows,
      reports: reports.rows,
    };
  }

  async countTable(tableName) {
    const query = `SELECT COUNT(*)::int AS count FROM public.${tableName};`;
    const { rows } = await db.query(query);
    return rows[0]?.count || 0;
  }

  async countUsersByRole(role) {
    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM public.users
      WHERE role = $1;
    `;

    const { rows } = await db.query(query, [role]);
    return rows[0]?.count || 0;
  }

  async countPendingReports() {
    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM public.reports
      WHERE status = 'pending';
    `;

    const { rows } = await db.query(query);
    return rows[0]?.count || 0;
  }

  async countWarnedUsers() {
    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM public.users
      WHERE warning_count > 0;
    `;

    const { rows } = await db.query(query);
    return rows[0]?.count || 0;
  }

  async listUsers({ q, role, userStatus, warnedOnly }, moderationEnabled = true) {
    const values = [];
    const where = [`u.role IN ('client', 'provider')`];

    if (q) {
      values.push(`%${q}%`);
      where.push(`(u.full_name ILIKE $${values.length} OR u.email ILIKE $${values.length})`);
    }

    if (role) {
      values.push(role);
      where.push(`u.role = $${values.length}`);
    }

    if (moderationEnabled && userStatus) {
      values.push(userStatus);
      where.push(`u.account_status = $${values.length}`);
    }

    if (moderationEnabled && warnedOnly === "1") {
      where.push(`u.warning_count > 0`);
    }

    const query = /*sql*/`
      SELECT
        u.id_user::text AS id,
        u.full_name,
        u.email,
        u.role,
        ${moderationEnabled ? "u.account_status" : "'active'::varchar AS account_status"},
        ${moderationEnabled ? "u.status_reason" : "NULL::text AS status_reason"},
        ${moderationEnabled ? "u.warning_count" : "0::int AS warning_count"},
        u.created_at
      FROM public.users u
      WHERE ${where.join(" AND ")}
      ORDER BY u.created_at DESC
      LIMIT 30;
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  async listReports({ reportStatus, targetType }) {
    const values = [];
    const where = [];

    if (reportStatus) {
      values.push(reportStatus);
      where.push(`r.status = $${values.length}`);
    }

    if (targetType) {
      values.push(targetType);
      where.push(`r.target_type = $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const query = /*sql*/`
      SELECT
        r.id_report::text AS id,
        r.target_type,
        r.target_id::text AS target_id,
        r.reason,
        r.details,
        r.status,
        r.resolution_note,
        r.created_at,
        reporter.full_name AS reporter_name,
        reviewer.full_name AS reviewed_by_name,
        CASE
          WHEN r.target_type = 'service' THEN s.title
          WHEN r.target_type = 'review' THEN COALESCE(NULLIF(LEFT(rv.comment, 80), ''), CONCAT('Avis ', rv.rating, '/5'))
          WHEN r.target_type = 'user' THEN target_user.full_name
          ELSE 'Contenu indisponible'
        END AS target_label
      FROM public.reports r
      LEFT JOIN public.users reporter ON reporter.id_user = r.reporter_id
      LEFT JOIN public.users reviewer ON reviewer.id_user = r.reviewed_by
      LEFT JOIN public.services s ON r.target_type = 'service' AND s.id_service = r.target_id
      LEFT JOIN public.reviews rv ON r.target_type = 'review' AND rv.id_review = r.target_id
      LEFT JOIN public.users target_user ON r.target_type = 'user' AND target_user.id_user = r.target_id
      ${whereSql}
      ORDER BY
        CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END,
        r.created_at DESC
      LIMIT 30;
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  async listWarnings() {
    const query = /*sql*/`
      SELECT
        w.id_warning::text AS id,
        w.message,
        w.sanction_applied,
        w.created_at,
        target_user.id_user::text AS user_id,
        target_user.full_name AS user_name,
        admin_user.full_name AS admin_name
      FROM public.warnings w
      JOIN public.users target_user ON target_user.id_user = w.user_id
      LEFT JOIN public.users admin_user ON admin_user.id_user = w.admin_id
      ORDER BY w.created_at DESC
      LIMIT 20;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listServicesPage(moderationEnabled) {
    const reportCountSelect = moderationEnabled
      ? `COALESCE(SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_reports`
      : `0::int AS pending_reports`;
    const reportJoin = moderationEnabled
      ? `LEFT JOIN public.reports r ON r.target_type = 'service' AND r.target_id = s.id_service`
      : "";

    const query = /*sql*/`
      SELECT
        s.id_service::text AS id,
        s.title,
        s.description,
        s.price,
        s.created_at,
        u.full_name AS provider_name,
        ${reportCountSelect}
      FROM public.services s
      JOIN public.users u ON u.id_user = s.provider_id
      ${reportJoin}
      GROUP BY s.id_service, u.full_name, s.created_at
      ORDER BY pending_reports DESC, s.created_at DESC
      LIMIT 30;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listReviewsPage(moderationEnabled) {
    const reportCountSelect = moderationEnabled
      ? `COALESCE(SUM(CASE WHEN rpt.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_reports`
      : `0::int AS pending_reports`;
    const reportJoin = moderationEnabled
      ? `LEFT JOIN public.reports rpt ON rpt.target_type = 'review' AND rpt.target_id = r.id_review`
      : "";

    const query = /*sql*/`
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS client_name,
        ${reportCountSelect}
      FROM public.reviews r
      JOIN public.users u ON u.id_user = r.client_id
      ${reportJoin}
      GROUP BY r.id_review, u.full_name, r.created_at
      ORDER BY pending_reports DESC, r.created_at DESC
      LIMIT 30;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listBookingsPage() {
    const query = /*sql*/`
      SELECT
        b.id_booking::text AS id,
        b.status,
        b.booking_date,
        b.booking_time,
        b.total_price,
        b.created_at,
        s.title AS service_title,
        u.full_name AS client_name
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      JOIN public.users u ON u.id_user = b.client_id
      ORDER BY b.created_at DESC
      LIMIT 30;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listRecentServices(moderationEnabled) {
    const reportCountSelect = moderationEnabled
      ? `COALESCE(SUM(CASE WHEN r.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_reports`
      : `0::int AS pending_reports`;
    const reportJoin = moderationEnabled
      ? `LEFT JOIN public.reports r ON r.target_type = 'service' AND r.target_id = s.id_service`
      : "";

    const query = /*sql*/`
      SELECT
        s.id_service::text AS id,
        s.title,
        u.full_name AS provider_name,
        s.created_at,
        ${reportCountSelect}
      FROM public.services s
      JOIN public.users u ON u.id_user = s.provider_id
      ${reportJoin}
      GROUP BY s.id_service, u.full_name, s.created_at
      ORDER BY pending_reports DESC, s.created_at DESC
      LIMIT 10;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listRecentReviews(moderationEnabled) {
    const reportCountSelect = moderationEnabled
      ? `COALESCE(SUM(CASE WHEN rpt.status = 'pending' THEN 1 ELSE 0 END), 0)::int AS pending_reports`
      : `0::int AS pending_reports`;
    const reportJoin = moderationEnabled
      ? `LEFT JOIN public.reports rpt ON rpt.target_type = 'review' AND rpt.target_id = r.id_review`
      : "";

    const query = /*sql*/`
      SELECT
        r.id_review::text AS id,
        r.rating,
        r.comment,
        r.created_at,
        u.full_name AS client_name,
        ${reportCountSelect}
      FROM public.reviews r
      JOIN public.users u ON u.id_user = r.client_id
      ${reportJoin}
      GROUP BY r.id_review, u.full_name, r.created_at
      ORDER BY pending_reports DESC, r.created_at DESC
      LIMIT 10;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async listActionLogs() {
    const query = /*sql*/`
      SELECT
        l.id_log::text AS id,
        l.action_type,
        l.target_type,
        l.target_id::text AS target_id,
        l.details,
        l.created_at,
        u.full_name AS admin_name
      FROM public.admin_action_logs l
      LEFT JOIN public.users u ON u.id_user = l.admin_id
      ORDER BY l.created_at DESC
      LIMIT 20;
    `;

    const { rows } = await db.query(query);
    return rows;
  }

  async updateUserStatus({ adminId, userId, status, reason, reportId = null }) {
    await this.ensureModerationReady();
    const user = await this.getModeratableUser(userId);

    if (String(adminId) === String(userId)) {
      throw new Error("Vous ne pouvez pas modifier votre propre statut admin.");
    }

    await db.query(
      `
      UPDATE public.users
      SET
        account_status = $1,
        status_reason = $2,
        status_changed_at = NOW(),
        updated_at = NOW()
      WHERE id_user = $3
      `,
      [status, reason || null, userId]
    );

    if (reportId) {
      await this.markReportReviewed({
        adminId,
        reportId,
        status: "resolved",
        resolutionNote: reason || `Statut utilisateur mis a jour vers ${status}.`,
      });
    }

    await this.logAction({
      adminId,
      actionType: "user_status_updated",
      targetType: "user",
      targetId: userId,
      details: `Statut passe a ${status} pour ${user.full_name}.`,
    });
  }

  async createWarning({ adminId, userId, message, reportId = null }) {
    await this.ensureModerationReady();
    const user = await this.getModeratableUser(userId);

    if (String(adminId) === String(userId)) {
      throw new Error("Vous ne pouvez pas vous envoyer un avertissement.");
    }

    const nextWarningCount = Number(user.warning_count || 0) + 1;
    let sanctionApplied = "alert";
    let accountStatus = null;
    let statusReason = null;

    if (nextWarningCount === 2) {
      sanctionApplied = "restriction";
    } else if (nextWarningCount === 3) {
      sanctionApplied = "temporary_suspension";
      accountStatus = "suspended";
      statusReason = "Suspension automatique apres 3 avertissements.";
    } else if (nextWarningCount >= 4) {
      sanctionApplied = "ban";
      accountStatus = "banned";
      statusReason = "Bannissement automatique apres avertissements repetes.";
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `
        INSERT INTO public.warnings (user_id, admin_id, report_id, message, sanction_applied)
        VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5)
        `,
        [userId, adminId, reportId, message, sanctionApplied]
      );

      await client.query(
        `
        UPDATE public.users
        SET
          warning_count = $1,
          account_status = COALESCE($2, account_status),
          status_reason = CASE WHEN $2 IS NULL THEN status_reason ELSE $3 END,
          status_changed_at = CASE WHEN $2 IS NULL THEN status_changed_at ELSE NOW() END,
          updated_at = NOW()
        WHERE id_user = $4::uuid
        `,
        [nextWarningCount, accountStatus, statusReason, userId]
      );

      if (reportId) {
        await this.markReportReviewedWithClient(client, {
          adminId,
          reportId,
          status: "resolved",
          resolutionNote: `Avertissement envoye (${sanctionApplied}).`,
        });
      }

      await this.logActionWithClient(client, {
        adminId,
        actionType: "warning_sent",
        targetType: "user",
        targetId: userId,
        details: `Avertissement ${nextWarningCount} envoye a ${user.full_name} (${sanctionApplied}).`,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async reviewReport({ adminId, reportId, status, resolutionNote }) {
    await this.ensureModerationReady();
    await this.markReportReviewed({
      adminId,
      reportId,
      status,
      resolutionNote,
    });

    await this.logAction({
      adminId,
      actionType: "report_reviewed",
      targetType: "report",
      targetId: reportId,
      details: `Signalement passe a ${status}.`,
    });
  }

  async deleteServiceByAdmin({ adminId, serviceId, reportId = null }) {
    await this.ensureModerationReady();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const serviceResult = await client.query(
        `
        SELECT id_service::text AS id, title
        FROM public.services
        WHERE id_service::text = $1
        LIMIT 1
        `,
        [serviceId]
      );

      const service = serviceResult.rows[0];
      if (!service) {
        throw new Error("Service introuvable.");
      }

      await client.query(
        `
        DELETE FROM public.bookings
        WHERE service_id::text = $1
        `,
        [serviceId]
      );

      await client.query(
        `
        DELETE FROM public.services
        WHERE id_service::text = $1
        `,
        [serviceId]
      );

      if (reportId) {
        await this.markReportReviewedWithClient(client, {
          adminId,
          reportId,
          status: "resolved",
          resolutionNote: "Service supprime par l'administration.",
        });
      }

      await this.logActionWithClient(client, {
        adminId,
        actionType: "service_deleted",
        targetType: "service",
        targetId: serviceId,
        details: `Service supprime : ${service.title}.`,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteReviewByAdmin({ adminId, reviewId, reportId = null }) {
    await this.ensureModerationReady();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const reviewResult = await client.query(
        `
        SELECT id_review::text AS id, COALESCE(comment, CONCAT('Avis ', rating, '/5')) AS label
        FROM public.reviews
        WHERE id_review::text = $1
        LIMIT 1
        `,
        [reviewId]
      );

      const review = reviewResult.rows[0];
      if (!review) {
        throw new Error("Avis introuvable.");
      }

      await client.query(
        `
        DELETE FROM public.reviews
        WHERE id_review::text = $1
        `,
        [reviewId]
      );

      if (reportId) {
        await this.markReportReviewedWithClient(client, {
          adminId,
          reportId,
          status: "resolved",
          resolutionNote: "Avis supprime par l'administration.",
        });
      }

      await this.logActionWithClient(client, {
        adminId,
        actionType: "review_deleted",
        targetType: "review",
        targetId: reviewId,
        details: `Avis supprime : ${review.label}.`,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteUserByAdmin({ adminId, userId, reportId = null }) {
    await this.ensureModerationReady();

    if (String(adminId) === String(userId)) {
      throw new Error("Vous ne pouvez pas supprimer votre propre compte admin.");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const userResult = await client.query(
        `
        SELECT id_user::text AS id, full_name, role
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

      if (user.role === "admin") {
        throw new Error("La suppression d'un compte admin n'est pas autorisee ici.");
      }

      await client.query(
        `
        DELETE FROM public.reviews
        WHERE client_id::text = $1
           OR provider_id::text = $1
        `,
        [userId]
      );

      await client.query(
        `
        DELETE FROM public.bookings
        WHERE client_id::text = $1
           OR service_id IN (
             SELECT id_service
             FROM public.services
             WHERE provider_id::text = $1
           )
        `,
        [userId]
      );

      await client.query(
        `
        DELETE FROM public.services
        WHERE provider_id::text = $1
        `,
        [userId]
      );

      await client.query(
        `
        DELETE FROM public.users
        WHERE id_user::text = $1
        `,
        [userId]
      );

      if (reportId) {
        await this.markReportReviewedWithClient(client, {
          adminId,
          reportId,
          status: "resolved",
          resolutionNote: "Compte supprime par l'administration.",
        });
      }

      await this.logActionWithClient(client, {
        adminId,
        actionType: "user_deleted",
        targetType: "user",
        targetId: userId,
        details: `Compte supprime : ${user.full_name}.`,
      });

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async ensureModerationReady() {
    const ready = await this.hasModerationSchema();
    if (!ready) {
      throw new Error("La moderation admin n'est pas encore disponible en base. Lancez la migration correspondante.");
    }
  }

  async getModeratableUser(userId) {
    const query = /*sql*/`
      SELECT
        id_user::text AS id,
        full_name,
        role,
        warning_count
      FROM public.users
      WHERE id_user::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [userId]);
    const user = rows[0];

    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    if (user.role === "admin") {
      throw new Error("Cette action n'est pas autorisee sur un compte admin.");
    }

    return user;
  }

  async markReportReviewed({ adminId, reportId, status, resolutionNote }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await this.markReportReviewedWithClient(client, {
        adminId,
        reportId,
        status,
        resolutionNote,
      });
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markReportReviewedWithClient(client, { adminId, reportId, status, resolutionNote }) {
    await client.query(
      `
      UPDATE public.reports
      SET
        status = $1,
        reviewed_by = $2::uuid,
        reviewed_at = NOW(),
        resolution_note = $3,
        updated_at = NOW()
      WHERE id_report::text = $4
      `,
      [status, adminId, resolutionNote || null, reportId]
    );
  }

  async logAction({ adminId, actionType, targetType, targetId, details }) {
    await db.query(
      `
      INSERT INTO public.admin_action_logs (admin_id, action_type, target_type, target_id, details)
      VALUES ($1::uuid, $2, $3, $4::uuid, $5)
      `,
      [adminId, actionType, targetType, targetId || null, details || null]
    );
  }

  async logActionWithClient(client, { adminId, actionType, targetType, targetId, details }) {
    await client.query(
      `
      INSERT INTO public.admin_action_logs (admin_id, action_type, target_type, target_id, details)
      VALUES ($1::uuid, $2, $3, $4::uuid, $5)
      `,
      [adminId, actionType, targetType, targetId || null, details || null]
    );
  }
}

export default new AdminService();
