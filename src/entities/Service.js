"use strict";
/**
 * @fileoverview Modele Service - Gestion des services
 */
class Service {
  constructor(data = {}) {
    // Mapping SQL (snake_case) vers JS (camelCase)
    // tout en conservant les cles legacy attendues par les vues EJS.
    this.id = data.id_service || data.id || null;
    this.id_service = this.id;

    this.providerId = data.provider_id || data.providerId || null;
    this.provider_id = this.providerId;

    this.categoryId = data.category_id || data.categoryId || null;
    this.category_id = this.categoryId;

    this.title = data.title || "";
    this.description = data.description || "";
    this.price = data.price ?? null;
    this.slug = data.slug || (this.id ? String(this.id) : null);

    this.providerStatus = data.provider_status || data.providerStatus || null;
    this.provider_status = this.providerStatus;

    this.experienceYears = data.experience_years ?? data.experienceYears ?? null;
    this.experience_years = this.experienceYears;

    this.trainings = data.trainings || null;

    this.hasDrivingLicense =
      data.has_driving_license ?? data.hasDrivingLicense ?? null;
    this.has_driving_license = this.hasDrivingLicense;

    this.serviceArea = data.service_area || data.serviceArea || null;
    this.service_area = this.serviceArea;

    this.adminStatus = data.admin_status || data.adminStatus || null;
    this.admin_status = this.adminStatus;

    this.adminStatusReason =
      data.admin_status_reason || data.adminStatusReason || null;
    this.admin_status_reason = this.adminStatusReason;

    this.adminStatusUpdatedAt =
      data.admin_status_updated_at || data.adminStatusUpdatedAt || null;
    this.admin_status_updated_at = this.adminStatusUpdatedAt;

    this.providerName = data.provider_name || data.providerName || null;
    this.provider_name = this.providerName;

    this.providerPhotoPath =
      data.provider_photo_path || data.providerPhotoPath || null;
    this.provider_photo_path = this.providerPhotoPath;

    this.categoryName = data.category_name || data.categoryName || null;
    this.category_name = this.categoryName;

    this.photos = Array.isArray(data.photos) ? data.photos : [];
    this.viewerState = data.viewer_state || data.viewerState || null;
    this.viewer_state = this.viewerState;

    this.createdAt = data.created_at || data.createdAt || null;
    this.created_at = this.createdAt;

    this.updatedAt = data.updated_at || data.updatedAt || null;
    this.updated_at = this.updatedAt;
  }

  /**
   * Cree une entite depuis une ligne PostgreSQL
   */
  static fromDatabase(row) {
    return row ? new Service(row) : null;
  }

  /**
   * Cree une liste d'entites depuis des lignes PostgreSQL
   */
  static fromDatabaseList(rows = []) {
    return rows.map((row) => new Service(row));
  }

  /**
   * Filtre les données sensibles pour l'exposition en API/vue
   */
  toJSON() {
    return {
      id: this.id,
      providerId: this.providerId,
      categoryId: this.categoryId,
      title: this.title,
      description: this.description,
      price: this.price,
      slug: this.slug,
      providerStatus: this.providerStatus,
      experienceYears: this.experienceYears,
      trainings: this.trainings,
      hasDrivingLicense: this.hasDrivingLicense,
      serviceArea: this.serviceArea,
      adminStatus: this.adminStatus,
      adminStatusReason: this.adminStatusReason,
      adminStatusUpdatedAt: this.adminStatusUpdatedAt,
      providerName: this.providerName,
      providerPhotoPath: this.providerPhotoPath,
      categoryName: this.categoryName,
      photos: this.photos,
      viewerState: this.viewerState,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Convertit l'objet Service en chaine JSON
   */
  toString() {
    return JSON.stringify(this.toJSON());
  }
}

export default Service;
