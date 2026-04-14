"use strict";
/**
 * @fileoverview Modele User - Gestion des utilisateurs
 */
class User {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    this.id = data.id_user || data.id || null;
    this.fullName = data.full_name || data.name || "";
    this.email = data.email || "";
    this.role = data.role || data.role_name || "client";
    this.passwordHash = data.password_hash || data.password || null;
    this.phone = data.phone || null;
    this.address = data.address || null;
    this.gdprConsent = data.gdpr_consent ?? null;
    this.gdprConsentDate = data.gdpr_consent_date || null;
    this.experienceYears = data.experience_years ?? null;
    this.trainings = data.trainings || null;
    this.hasDrivingLicense = data.has_driving_license ?? null;
    this.serviceArea = data.service_area || null;
    this.providerStatus = data.provider_status || null;
    this.profilePhotoPath = data.profile_photo_path || data.profile_photo || null;
    this.warningCount = data.warning_count ?? 0;
    this.suspendedAt = data.suspended_at || null;
    this.suspendedReason = data.suspended_reason || null;
    this.bannedAt = data.banned_at || null;
    this.bannedReason = data.banned_reason || null;
    this.canMessage = data.can_message ?? true;
    this.canPublishServices = data.can_publish_services ?? true;
    this.deletedByAdminAt = data.deleted_by_admin_at || null;
    this.adminNote = data.admin_note || null;
    this.createdAt = data.created_at || null;
    this.updatedAt = data.updated_at || null;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new User(row) : null;
  }

  /**
   * Alias legacy pour compatibilite avec le code existant
   */
  static fromPersistence(row) {
    return User.fromDatabase(row);
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new User(row));
  }

  /**
   * Données minimales pour session utilisateur
   */
  toSession() {
    return {
      id: this.id,
      name: this.fullName,
      role: this.role,
      profilePhotoPath: this.profilePhotoPath,
      canMessage: this.canMessage,
      canPublishServices: this.canPublishServices,
    };
  }

  /**
   * Filtre les données sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      role: this.role,
      phone: this.phone,
      address: this.address,
      experienceYears: this.experienceYears,
      trainings: this.trainings,
      hasDrivingLicense: this.hasDrivingLicense,
      serviceArea: this.serviceArea,
      providerStatus: this.providerStatus,
      profilePhotoPath: this.profilePhotoPath,
      warningCount: this.warningCount,
      suspendedAt: this.suspendedAt,
      suspendedReason: this.suspendedReason,
      bannedAt: this.bannedAt,
      bannedReason: this.bannedReason,
      canMessage: this.canMessage,
      canPublishServices: this.canPublishServices,
      deletedByAdminAt: this.deletedByAdminAt,
      adminNote: this.adminNote,
      gdprConsent: this.gdprConsent,
      gdprConsentDate: this.gdprConsentDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet User en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default User;
