"use strict";

import PgConversationRepository from "../repositories/PgConversationRepository.js";

class ConversationService {
  static async assertUserCanMessage(...args) {
    return PgConversationRepository.assertUserCanMessage(...args);
  }

  static async hasConversationTables(...args) {
    return PgConversationRepository.hasConversationTables(...args);
  }

  static async ensureBookingConversation(...args) {
    return PgConversationRepository.ensureBookingConversation(...args);
  }

  static async addBookingIntroMessage(...args) {
    return PgConversationRepository.addBookingIntroMessage(...args);
  }

  static async listForUser(...args) {
    return PgConversationRepository.listForUser(...args);
  }

  static async getUnreadCountForUser(...args) {
    return PgConversationRepository.getUnreadCountForUser(...args);
  }

  static async getByIdForUser(...args) {
    return PgConversationRepository.getByIdForUser(...args);
  }

  static async sendMessage(...args) {
    return PgConversationRepository.sendMessage(...args);
  }

  static async archiveForUser(...args) {
    return PgConversationRepository.archiveForUser(...args);
  }

  static async unarchiveForUser(...args) {
    return PgConversationRepository.unarchiveForUser(...args);
  }

  static async deleteForUser(...args) {
    return PgConversationRepository.deleteForUser(...args);
  }

  static async blockForUser(...args) {
    return PgConversationRepository.blockForUser(...args);
  }

  static async _updateParticipantState(...args) {
    return PgConversationRepository._updateParticipantState(...args);
  }
}

export default ConversationService;
