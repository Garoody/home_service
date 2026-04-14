"use strict";

import db from "../config/database.js";
import BookingMaintenanceService from "./BookingMaintenanceService.js";

class ConversationService {
  static _hasConversationTables = null;

  static async assertUserCanMessage({ userId, dbClient = db }) {
    const result = await dbClient.query(
      `
      SELECT
        can_message,
        suspended_at,
        banned_at,
        deleted_by_admin_at
      FROM public.users
      WHERE id_user::text = $1
      LIMIT 1
      `,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new Error("Utilisateur introuvable.");
    }

    if (user.deleted_by_admin_at) {
      throw new Error("Ce compte n'est plus disponible.");
    }

    if (user.banned_at) {
      throw new Error("Ce compte a été banni par l'administration.");
    }

    if (user.suspended_at) {
      throw new Error("Ce compte est temporairement suspendu par l'administration.");
    }

    if (!user.can_message) {
      throw new Error("La messagerie de ce compte est suspendue par l'administration.");
    }
  }

  static async hasConversationTables() {
    if (this._hasConversationTables !== null) {
      return this._hasConversationTables;
    }

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (
          'booking_conversations',
          'conversation_participants',
          'conversation_messages'
        )
      `
    );

    this._hasConversationTables = result.rows[0]?.count === 3;
    return this._hasConversationTables;
  }

  static async ensureBookingConversation({ bookingId, dbClient = db }) {
    if (!(await this.hasConversationTables())) {
      return null;
    }

    const contextResult = await dbClient.query(
      `
      SELECT
        b.id_booking::text AS booking_id,
        b.client_id::text AS client_id,
        s.provider_id::text AS provider_id
      FROM public.bookings b
      JOIN public.services s ON s.id_service = b.service_id
      WHERE b.id_booking::text = $1
      LIMIT 1
      `,
      [bookingId]
    );

    const context = contextResult.rows[0];
    if (!context) {
      throw new Error("Réservation introuvable pour la conversation.");
    }

    const conversationResult = await dbClient.query(
      `
      INSERT INTO public.booking_conversations (booking_id, client_id, provider_id)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (booking_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING id_conversation::text AS id
      `,
      [context.booking_id, context.client_id, context.provider_id]
    );

    const conversationId = conversationResult.rows[0]?.id;
    if (!conversationId) {
      throw new Error("Impossible d'ouvrir la conversation de réservation.");
    }

    const participantIds = [context.client_id, context.provider_id];

    await Promise.all(
      participantIds.map((userId) =>
        dbClient.query(
          `
          INSERT INTO public.conversation_participants (
            conversation_id,
            user_id
          )
          VALUES ($1::uuid, $2::uuid)
          ON CONFLICT (conversation_id, user_id)
          DO NOTHING
          `,
          [conversationId, userId]
        )
      )
    );

    return {
      id: conversationId,
      bookingId: context.booking_id,
      clientId: context.client_id,
      providerId: context.provider_id,
    };
  }

  static buildBookingIntroMessage({
    bookingDate,
    bookingTime,
    firstName,
    lastName,
    address,
    city,
  }) {
    const dateLabel = bookingDate
      ? new Date(bookingDate).toLocaleDateString("fr-FR")
      : "date a definir";
    const timeLabel = bookingTime ? String(bookingTime).slice(0, 5) : "heure a definir";
    const fullName = [firstName, lastName].filter(Boolean).join(" ").trim() || "Le client";
    const location = [address, city].filter(Boolean).join(", ");

    return [
      `${fullName} a envoye une nouvelle demande de réservation.`,
      `Creneau propose : ${dateLabel} a ${timeLabel}.`,
      location ? `Adresse indiquee : ${location}.` : null,
      "Vous pouvez repondre ici pour échanger avant la confirmation.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  static async addBookingIntroMessage({
    conversationId,
    senderId,
    bookingDate,
    bookingTime,
    firstName,
    lastName,
    address,
    city,
    dbClient = db,
  }) {
    if (!(await this.hasConversationTables())) {
      return null;
    }

    const content = this.buildBookingIntroMessage({
      bookingDate,
      bookingTime,
      firstName,
      lastName,
      address,
      city,
    });

    const existingMessage = await dbClient.query(
      `
      SELECT id_message::text AS id
      FROM public.conversation_messages
      WHERE conversation_id::text = $1
      LIMIT 1
      `,
      [conversationId]
    );

    if (existingMessage.rows[0]) {
      return existingMessage.rows[0];
    }

    const messageResult = await dbClient.query(
      `
      INSERT INTO public.conversation_messages (conversation_id, sender_id, content)
      VALUES ($1::uuid, $2::uuid, $3)
      RETURNING id_message::text AS id
      `,
      [conversationId, senderId, content]
    );

    await dbClient.query(
      `
      UPDATE public.booking_conversations
      SET updated_at = NOW()
      WHERE id_conversation::text = $1
      `,
      [conversationId]
    );

    await dbClient.query(
      `
      UPDATE public.conversation_participants
      SET
        archived_at = NULL,
        deleted_at = NULL,
        last_read_at = CASE WHEN user_id::text = $2 THEN NOW() ELSE last_read_at END,
        updated_at = NOW()
      WHERE conversation_id::text = $1
      `,
      [conversationId, senderId]
    );

    return messageResult.rows[0];
  }

  static async listForUser(userId, { scope = "active" } = {}) {
    if (!(await this.hasConversationTables())) {
      return [];
    }

    await BookingMaintenanceService.expirePendingBookings();

    const isArchivedScope = scope === "archived";

    const result = await db.query(
      `
      SELECT
        bc.id_conversation::text AS id,
        bc.booking_id::text AS booking_id,
        s.id_service::text AS service_slug,
        s.title AS service_title,
        b.booking_date,
        b.booking_time,
        b.status AS booking_status,
        counterpart.id_user::text AS counterpart_id,
        counterpart.full_name AS counterpart_name,
        counterpart.profile_photo_path AS counterpart_profile_photo,
        cp.archived_at,
        cp.blocked_at AS blocked_by_me_at,
        other_cp.blocked_at AS blocked_by_other_at,
        last_message.content AS last_message,
        last_message.created_at AS last_message_at,
        last_message.sender_id::text AS last_message_sender_id,
        COALESCE(unread.unread_count, 0)::int AS unread_count
      FROM public.booking_conversations bc
      JOIN public.conversation_participants cp
        ON cp.conversation_id = bc.id_conversation
       AND cp.user_id::text = $1
       AND cp.deleted_at IS NULL
      JOIN public.conversation_participants other_cp
        ON other_cp.conversation_id = bc.id_conversation
       AND other_cp.user_id <> cp.user_id
      JOIN public.users counterpart
        ON counterpart.id_user = other_cp.user_id
      JOIN public.bookings b
        ON b.id_booking = bc.booking_id
      JOIN public.services s
        ON s.id_service = b.service_id
      LEFT JOIN LATERAL (
        SELECT
          cm.content,
          cm.created_at,
          cm.sender_id
        FROM public.conversation_messages cm
        WHERE cm.conversation_id = bc.id_conversation
        ORDER BY cm.created_at DESC
        LIMIT 1
      ) AS last_message ON TRUE
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM public.conversation_messages cm
        WHERE cm.conversation_id = bc.id_conversation
          AND cm.sender_id <> cp.user_id
          AND cm.created_at > COALESCE(cp.last_read_at, to_timestamp(0))
      ) AS unread ON TRUE
      WHERE ${isArchivedScope ? "cp.archived_at IS NOT NULL" : "cp.archived_at IS NULL"}
      ORDER BY COALESCE(last_message.created_at, bc.updated_at, bc.created_at) DESC
      `,
      [userId]
    );

    return result.rows.map((row) => ({
      ...row,
      is_blocked: Boolean(row.blocked_by_me_at || row.blocked_by_other_at),
      has_unread: Number(row.unread_count || 0) > 0,
    }));
  }

  static async getUnreadCountForUser(userId) {
    if (!userId || !(await this.hasConversationTables())) {
      return 0;
    }

    const result = await db.query(
      `
      SELECT COALESCE(SUM(unread.unread_count), 0)::int AS unread_count
      FROM public.booking_conversations bc
      JOIN public.conversation_participants cp
        ON cp.conversation_id = bc.id_conversation
       AND cp.user_id::text = $1
       AND cp.deleted_at IS NULL
       AND cp.archived_at IS NULL
      LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS unread_count
        FROM public.conversation_messages cm
        WHERE cm.conversation_id = bc.id_conversation
          AND cm.sender_id <> cp.user_id
          AND cm.created_at > COALESCE(cp.last_read_at, to_timestamp(0))
      ) AS unread ON TRUE
      `,
      [userId]
    );

    return Number(result.rows[0]?.unread_count || 0);
  }

  static async getByIdForUser({ conversationId, userId, markAsRead = true }) {
    if (!(await this.hasConversationTables())) {
      throw new Error("La messagerie n'est pas encore disponible.");
    }

    await BookingMaintenanceService.expirePendingBookings();

    const client = await db.connect();

    try {
      await client.query("BEGIN");

      const conversationResult = await client.query(
        `
        SELECT
          bc.id_conversation::text AS id,
          bc.booking_id::text AS booking_id,
          bc.client_id::text AS client_id,
          bc.provider_id::text AS provider_id,
          b.booking_date,
          b.booking_time,
          b.status AS booking_status,
          COALESCE(p.payment_status::text, 'unpaid') AS payment_status,
          b.total_price,
          s.id_service::text AS service_slug,
          s.title AS service_title,
          counterpart.id_user::text AS counterpart_id,
          counterpart.full_name AS counterpart_name,
          counterpart.profile_photo_path AS counterpart_profile_photo,
          cp.archived_at,
          cp.blocked_at AS blocked_by_me_at,
          other_cp.blocked_at AS blocked_by_other_at,
          COALESCE(unread.unread_count, 0)::int AS unread_count
        FROM public.booking_conversations bc
        JOIN public.conversation_participants cp
          ON cp.conversation_id = bc.id_conversation
         AND cp.user_id::text = $2
         AND cp.deleted_at IS NULL
        JOIN public.conversation_participants other_cp
          ON other_cp.conversation_id = bc.id_conversation
         AND other_cp.user_id <> cp.user_id
        JOIN public.users counterpart
          ON counterpart.id_user = other_cp.user_id
        JOIN public.bookings b
          ON b.id_booking = bc.booking_id
        LEFT JOIN public.payments p
          ON p.booking_id = b.id_booking
        JOIN public.services s
          ON s.id_service = b.service_id
        LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS unread_count
          FROM public.conversation_messages cm
          WHERE cm.conversation_id = bc.id_conversation
            AND cm.sender_id <> cp.user_id
            AND cm.created_at > COALESCE(cp.last_read_at, to_timestamp(0))
        ) AS unread ON TRUE
        WHERE bc.id_conversation::text = $1
        LIMIT 1
        `,
        [conversationId, userId]
      );

      const conversation = conversationResult.rows[0];
      if (!conversation) {
        throw new Error("Conversation introuvable.");
      }

      if (markAsRead) {
        await client.query(
          `
          UPDATE public.conversation_participants
          SET last_read_at = NOW(), updated_at = NOW()
          WHERE conversation_id::text = $1
            AND user_id::text = $2
          `,
          [conversationId, userId]
        );
      }

      const messagesResult = await client.query(
        `
        SELECT
          cm.id_message::text AS id,
          cm.sender_id::text AS sender_id,
          u.full_name AS sender_name,
          u.profile_photo_path AS sender_profile_photo,
          cm.content,
          cm.created_at
        FROM public.conversation_messages cm
        JOIN public.users u ON u.id_user = cm.sender_id
        WHERE cm.conversation_id::text = $1
        ORDER BY cm.created_at ASC
        `,
        [conversationId]
      );

      await client.query("COMMIT");

      return {
        ...conversation,
        unread_count: 0,
        is_blocked: Boolean(conversation.blocked_by_me_at || conversation.blocked_by_other_at),
        blocked_by_me: Boolean(conversation.blocked_by_me_at),
        blocked_by_other: Boolean(conversation.blocked_by_other_at),
        messages: messagesResult.rows,
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async sendMessage({ conversationId, userId, message }) {
    if (!(await this.hasConversationTables())) {
      throw new Error("La messagerie n'est pas encore disponible.");
    }

    const content = String(message || "").trim();
    if (!content) {
      throw new Error("Le message est vide.");
    }

    const client = await db.connect();

    try {
      await client.query("BEGIN");
      await this.assertUserCanMessage({ userId, dbClient: client });

      const accessResult = await client.query(
        `
        SELECT
          cp.user_id::text AS user_id,
          cp.blocked_at AS blocked_by_me_at,
          other_cp.user_id::text AS other_user_id,
          other_cp.blocked_at AS blocked_by_other_at
        FROM public.booking_conversations bc
        JOIN public.conversation_participants cp
          ON cp.conversation_id = bc.id_conversation
         AND cp.user_id::text = $2
         AND cp.deleted_at IS NULL
        JOIN public.conversation_participants other_cp
          ON other_cp.conversation_id = bc.id_conversation
         AND other_cp.user_id <> cp.user_id
        WHERE bc.id_conversation::text = $1
        LIMIT 1
        `,
        [conversationId, userId]
      );

      const access = accessResult.rows[0];
      if (!access) {
        throw new Error("Conversation introuvable.");
      }

      if (access.blocked_by_me_at || access.blocked_by_other_at) {
        throw new Error("Cette conversation est bloquée.");
      }

      const messageResult = await client.query(
        `
        INSERT INTO public.conversation_messages (conversation_id, sender_id, content)
        VALUES ($1::uuid, $2::uuid, $3)
        RETURNING
          id_message::text AS id,
          sender_id::text AS sender_id,
          content,
          created_at
        `,
        [conversationId, userId, content]
      );

      await client.query(
        `
        UPDATE public.booking_conversations
        SET updated_at = NOW()
        WHERE id_conversation::text = $1
        `,
        [conversationId]
      );

      await client.query(
        `
        UPDATE public.conversation_participants
        SET
          archived_at = NULL,
          deleted_at = NULL,
          last_read_at = CASE WHEN user_id::text = $2 THEN NOW() ELSE last_read_at END,
          updated_at = NOW()
        WHERE conversation_id::text = $1
        `,
        [conversationId, userId]
      );

      await client.query("COMMIT");

      return messageResult.rows[0];
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  static async archiveForUser({ conversationId, userId }) {
    await this._updateParticipantState({
      conversationId,
      userId,
      sql: `
        UPDATE public.conversation_participants
        SET archived_at = NOW(), updated_at = NOW()
        WHERE conversation_id::text = $1
          AND user_id::text = $2
          AND deleted_at IS NULL
      `,
      missingMessage: "Conversation introuvable.",
    });
  }

  static async unarchiveForUser({ conversationId, userId }) {
    await this._updateParticipantState({
      conversationId,
      userId,
      sql: `
        UPDATE public.conversation_participants
        SET archived_at = NULL, updated_at = NOW()
        WHERE conversation_id::text = $1
          AND user_id::text = $2
          AND deleted_at IS NULL
      `,
      missingMessage: "Conversation introuvable.",
    });
  }

  static async deleteForUser({ conversationId, userId }) {
    await this._updateParticipantState({
      conversationId,
      userId,
      sql: `
        UPDATE public.conversation_participants
        SET deleted_at = NOW(), archived_at = NOW(), updated_at = NOW()
        WHERE conversation_id::text = $1
          AND user_id::text = $2
          AND deleted_at IS NULL
      `,
      missingMessage: "Conversation introuvable.",
    });
  }

  static async blockForUser({ conversationId, userId }) {
    await this._updateParticipantState({
      conversationId,
      userId,
      sql: `
        UPDATE public.conversation_participants
        SET blocked_at = NOW(), archived_at = NULL, deleted_at = NULL, updated_at = NOW()
        WHERE conversation_id::text = $1
          AND user_id::text = $2
          AND deleted_at IS NULL
      `,
      missingMessage: "Conversation introuvable.",
    });
  }

  static async _updateParticipantState({ conversationId, userId, sql, missingMessage }) {
    if (!(await this.hasConversationTables())) {
      throw new Error("La messagerie n'est pas encore disponible.");
    }

    const result = await db.query(sql, [conversationId, userId]);
    if (result.rowCount === 0) {
      throw new Error(missingMessage || "Conversation introuvable.");
    }
  }
}

export default ConversationService;
