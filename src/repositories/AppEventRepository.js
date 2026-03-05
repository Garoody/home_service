"use strict";

import db from "../config/database.js";
import AppEvent from "../entities/AppEventEntity.js";

/**
 * AppEventRepository
 *
 * Regles:
 * - Append-only (INSERT + READ)
 * - Aucune mise a jour
 * - Aucune suppression directe
 * - Lecture uniquement via vues SQL
 */
class AppEventRepository {
  /**
   * Enregistre un evenement applicatif
   * @returns {Promise<AppEvent>}
   */
  static async create(data) {
    const query = /*sql*/`
      INSERT INTO app_events (
        user_id,
        event_category,
        event_type,
        severity,
        message,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id_event,
        user_id,
        event_category,
        event_type,
        severity,
        message,
        metadata,
        created_at;
    `;

    const values = [
      data.userId ?? null,
      data.eventCategory,
      data.eventType,
      data.severity,
      data.message,
      data.metadata ?? {},
    ];

    const { rows } = await db.query(query, values);
    return AppEvent.fromDatabase(rows[0]);
  }

  /**
   * Historique des evenements d'un utilisateur
   */
  static async findByUserId(userId, limit = 50) {
    const query = /*sql*/ `
      SELECT *
      FROM v_user_app_events
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2;
    `;

    const { rows } = await db.query(query, [userId, limit]);
    return AppEvent.fromDatabaseList(rows);
  }

  /**
   * Evenements critiques (admin / monitoring)
   */
  static async findCritical(limit = 100) {
    const query = /*sql*/ `
      SELECT *
      FROM v_app_events_critical
      ORDER BY created_at DESC
      LIMIT $1;
    `;

    const { rows } = await db.query(query, [limit]);
    return AppEvent.fromDatabaseList(rows);
  }
}

export default AppEventRepository;
