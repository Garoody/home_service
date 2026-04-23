"use strict";

import ConversationMessage from "./ConversationMessage.js";

/**
 * @fileoverview Conversation entity
 */
class Conversation {
  constructor(data = {}) {
    this.id = data.id_conversation || data.id || null;
    this.id_conversation = this.id;

    this.bookingId = data.booking_id || data.bookingId || null;
    this.booking_id = this.bookingId;

    this.clientId = data.client_id || data.clientId || null;
    this.client_id = this.clientId;

    this.providerId = data.provider_id || data.providerId || null;
    this.provider_id = this.providerId;

    this.serviceSlug = data.service_slug || data.serviceSlug || null;
    this.service_slug = this.serviceSlug;

    this.serviceTitle = data.service_title || data.serviceTitle || null;
    this.service_title = this.serviceTitle;

    this.bookingDate = data.booking_date || data.bookingDate || null;
    this.booking_date = this.bookingDate;

    this.bookingTime = data.booking_time || data.bookingTime || null;
    this.booking_time = this.bookingTime;

    this.bookingStatus = data.booking_status || data.bookingStatus || null;
    this.booking_status = this.bookingStatus;

    this.paymentStatus = data.payment_status || data.paymentStatus || null;
    this.payment_status = this.paymentStatus;

    this.totalPrice = data.total_price ?? data.totalPrice ?? null;
    this.total_price = this.totalPrice;

    this.counterpartId = data.counterpart_id || data.counterpartId || null;
    this.counterpart_id = this.counterpartId;

    this.counterpartName =
      data.counterpart_name || data.counterpartName || null;
    this.counterpart_name = this.counterpartName;

    this.counterpartProfilePhoto =
      data.counterpart_profile_photo || data.counterpartProfilePhoto || null;
    this.counterpart_profile_photo = this.counterpartProfilePhoto;

    this.archivedAt = data.archived_at || data.archivedAt || null;
    this.archived_at = this.archivedAt;

    this.blockedByMeAt =
      data.blocked_by_me_at || data.blockedByMeAt || null;
    this.blocked_by_me_at = this.blockedByMeAt;

    this.blockedByOtherAt =
      data.blocked_by_other_at || data.blockedByOtherAt || null;
    this.blocked_by_other_at = this.blockedByOtherAt;

    this.lastMessage = data.last_message || data.lastMessage || null;
    this.last_message = this.lastMessage;

    this.lastMessageAt = data.last_message_at || data.lastMessageAt || null;
    this.last_message_at = this.lastMessageAt;

    this.lastMessageSenderId =
      data.last_message_sender_id || data.lastMessageSenderId || null;
    this.last_message_sender_id = this.lastMessageSenderId;

    this.unreadCount = Number(data.unread_count ?? data.unreadCount ?? 0);
    this.unread_count = this.unreadCount;

    this.isBlocked = Boolean(data.is_blocked ?? data.isBlocked ?? false);
    this.is_blocked = this.isBlocked;

    this.blockedByMe = Boolean(data.blocked_by_me ?? data.blockedByMe ?? false);
    this.blocked_by_me = this.blockedByMe;

    this.blockedByOther = Boolean(
      data.blocked_by_other ?? data.blockedByOther ?? false
    );
    this.blocked_by_other = this.blockedByOther;

    this.hasUnread = Boolean(data.has_unread ?? data.hasUnread ?? false);
    this.has_unread = this.hasUnread;

    this.messages = Array.isArray(data.messages)
      ? data.messages.map((message) =>
          message instanceof ConversationMessage
            ? message
            : ConversationMessage.fromDatabase(message)
        )
      : [];
  }

  static fromDatabase(row) {
    return row ? new Conversation(row) : null;
  }

  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Conversation(row));
  }

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      clientId: this.clientId,
      providerId: this.providerId,
      serviceSlug: this.serviceSlug,
      serviceTitle: this.serviceTitle,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      bookingStatus: this.bookingStatus,
      paymentStatus: this.paymentStatus,
      totalPrice: this.totalPrice,
      counterpartId: this.counterpartId,
      counterpartName: this.counterpartName,
      counterpartProfilePhoto: this.counterpartProfilePhoto,
      archivedAt: this.archivedAt,
      blockedByMeAt: this.blockedByMeAt,
      blockedByOtherAt: this.blockedByOtherAt,
      lastMessage: this.lastMessage,
      lastMessageAt: this.lastMessageAt,
      lastMessageSenderId: this.lastMessageSenderId,
      unreadCount: this.unreadCount,
      isBlocked: this.isBlocked,
      blockedByMe: this.blockedByMe,
      blockedByOther: this.blockedByOther,
      hasUnread: this.hasUnread,
      messages: this.messages.map((message) => message.toJSON()),
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Conversation;
