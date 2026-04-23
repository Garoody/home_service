"use strict";
/**
 * @fileoverview Review entity - review domain data
 */
class Review {
  constructor(data = {}) {
    this.id = data.id_review || data.id || null;
    this.id_review = this.id;

    this.bookingId = data.booking_id || data.bookingId || null;
    this.booking_id = this.bookingId;

    this.clientId = data.client_id || data.clientId || null;
    this.client_id = this.clientId;

    this.providerId = data.provider_id || data.providerId || null;
    this.provider_id = this.providerId;

    this.serviceId = data.service_id || data.serviceId || null;
    this.service_id = this.serviceId;

    this.serviceSlug = data.service_slug || data.serviceSlug || null;
    this.service_slug = this.serviceSlug;

    this.serviceTitle = data.service_title || data.serviceTitle || null;
    this.service_title = this.serviceTitle;

    this.providerName = data.provider_name || data.providerName || null;
    this.provider_name = this.providerName;

    this.clientName = data.client_name || data.clientName || null;
    this.client_name = this.clientName;

    this.rating = data.rating ?? null;
    this.comment = data.comment || null;

    this.providerReply = data.provider_reply || data.providerReply || null;
    this.provider_reply = this.providerReply;

    this.providerReplyCreatedAt =
      data.provider_reply_created_at || data.providerReplyCreatedAt || null;
    this.provider_reply_created_at = this.providerReplyCreatedAt;

    this.providerReplyUpdatedAt =
      data.provider_reply_updated_at || data.providerReplyUpdatedAt || null;
    this.provider_reply_updated_at = this.providerReplyUpdatedAt;

    this.paymentStatus = data.payment_status || data.paymentStatus || null;
    this.payment_status = this.paymentStatus;

    this.bookingStatus = data.booking_status || data.bookingStatus || null;
    this.booking_status = this.bookingStatus;

    this.bookingDate = data.booking_date || data.bookingDate || null;
    this.booking_date = this.bookingDate;

    this.bookingTime = data.booking_time || data.bookingTime || null;
    this.booking_time = this.bookingTime;

    this.hiddenByAdmin = data.hidden_by_admin ?? data.hiddenByAdmin ?? false;
    this.hidden_by_admin = this.hiddenByAdmin;

    this.deletedByAdminAt =
      data.deleted_by_admin_at || data.deletedByAdminAt || null;
    this.deleted_by_admin_at = this.deletedByAdminAt;

    this.adminHiddenReason =
      data.admin_hidden_reason || data.adminHiddenReason || null;
    this.admin_hidden_reason = this.adminHiddenReason;

    this.createdAt = data.created_at || data.createdAt || null;
    this.created_at = this.createdAt;

    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.updated_at = this.updatedAt;
  }

  static fromDatabase(row) {
    return row ? new Review(row) : null;
  }

  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Review(row));
  }

  toJSON() {
    return {
      id: this.id,
      bookingId: this.bookingId,
      clientId: this.clientId,
      providerId: this.providerId,
      serviceId: this.serviceId,
      serviceSlug: this.serviceSlug,
      serviceTitle: this.serviceTitle,
      providerName: this.providerName,
      clientName: this.clientName,
      rating: this.rating,
      comment: this.comment,
      providerReply: this.providerReply,
      providerReplyCreatedAt: this.providerReplyCreatedAt,
      providerReplyUpdatedAt: this.providerReplyUpdatedAt,
      paymentStatus: this.paymentStatus,
      bookingStatus: this.bookingStatus,
      bookingDate: this.bookingDate,
      bookingTime: this.bookingTime,
      hiddenByAdmin: this.hiddenByAdmin,
      deletedByAdminAt: this.deletedByAdminAt,
      adminHiddenReason: this.adminHiddenReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Review;
