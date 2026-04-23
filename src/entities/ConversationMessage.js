"use strict";
/**
 * @fileoverview Conversation message entity
 */
class ConversationMessage {
  constructor(data = {}) {
    this.id = data.id_message || data.id || null;
    this.id_message = this.id;

    this.senderId = data.sender_id || data.senderId || null;
    this.sender_id = this.senderId;

    this.senderName = data.sender_name || data.senderName || null;
    this.sender_name = this.senderName;

    this.senderProfilePhoto =
      data.sender_profile_photo || data.senderProfilePhoto || null;
    this.sender_profile_photo = this.senderProfilePhoto;

    this.content = data.content || "";

    this.createdAt = data.created_at || data.createdAt || null;
    this.created_at = this.createdAt;
  }

  static fromDatabase(row) {
    return row ? new ConversationMessage(row) : null;
  }

  static fromDatabaseList(rows = []) {
    return rows.map((row) => new ConversationMessage(row));
  }

  toJSON() {
    return {
      id: this.id,
      senderId: this.senderId,
      senderName: this.senderName,
      senderProfilePhoto: this.senderProfilePhoto,
      content: this.content,
      createdAt: this.createdAt,
    };
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default ConversationMessage;
