"use strict";

import db from "../config/database.js";

/**
 * Service de signalement.
 * Il gere la creation des signalements et la recuperation d'un apercu
 * de l'element cible avant affichage du formulaire.
 */
class ReportService {
  static _hasReportsTable = null;

  static async hasReportsTable() {
    if (this._hasReportsTable !== null) {
      return this._hasReportsTable;
    }

    const query = /*sql*/`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'reports'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasReportsTable = !!rows[0]?.exists;
    return this._hasReportsTable;
  }

  static async getTargetPreview({ targetType, targetId }) {
    switch (targetType) {
      case "service":
        return this.getServicePreview(targetId);
      case "review":
        return this.getReviewPreview(targetId);
      case "user":
        return this.getUserPreview(targetId);
      default:
        throw new Error("Type de signalement invalide.");
    }
  }

  static async getServicePreview(targetId) {
    const query = /*sql*/`
      SELECT
        s.id_service::text AS id,
        'service' AS target_type,
        s.title AS title,
        s.description AS subtitle,
        u.full_name AS owner_name
      FROM public.services s
      JOIN public.users u ON u.id_user = s.provider_id
      WHERE s.id_service::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [targetId]);
    if (!rows[0]) {
      throw new Error("Service introuvable.");
    }

    return rows[0];
  }

  static async getReviewPreview(targetId) {
    const query = /*sql*/`
      SELECT
        r.id_review::text AS id,
        'review' AS target_type,
        CONCAT('Avis de ', u.full_name) AS title,
        COALESCE(r.comment, 'Avis sans commentaire.') AS subtitle,
        u.full_name AS owner_name
      FROM public.reviews r
      JOIN public.users u ON u.id_user = r.client_id
      WHERE r.id_review::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [targetId]);
    if (!rows[0]) {
      throw new Error("Avis introuvable.");
    }

    return rows[0];
  }

  static async getUserPreview(targetId) {
    const query = /*sql*/`
      SELECT
        u.id_user::text AS id,
        'user' AS target_type,
        u.full_name AS title,
        u.email AS subtitle,
        u.full_name AS owner_name
      FROM public.users u
      WHERE u.id_user::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [targetId]);
    if (!rows[0]) {
      throw new Error("Utilisateur introuvable.");
    }

    return rows[0];
  }

  static async create({ reporterId, targetType, targetId, reason, details }) {
    const hasReportsTable = await this.hasReportsTable();
    if (!hasReportsTable) {
      throw new Error("Le module de signalement n'est pas encore disponible en base.");
    }

    const target = await this.getTargetPreview({ targetType, targetId });
    if (targetType === "user" && String(target.id) === String(reporterId)) {
      throw new Error("Vous ne pouvez pas vous signaler vous-meme.");
    }

    try {
      const query = /*sql*/`
        INSERT INTO public.reports (
          reporter_id,
          target_type,
          target_id,
          reason,
          details
        )
        VALUES ($1::uuid, $2, $3::uuid, $4, $5)
        RETURNING id_report::text AS id;
      `;

      const { rows } = await db.query(query, [
        reporterId,
        targetType,
        targetId,
        reason,
        details || null,
      ]);

      return rows[0];
    } catch (error) {
      if (error?.code === "23505") {
        throw new Error("Vous avez deja signale cet element.");
      }

      throw error;
    }
  }
}

export default ReportService;
