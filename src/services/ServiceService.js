"use strict";

import PgServiceRepository from "../repositories/PgServiceRepository.js";

class ServiceService {
  static async hasProviderDetailsColumns() {
    return PgServiceRepository.hasProviderDetailsColumns();
  }

  static async hasProviderPhotoColumn() {
    return PgServiceRepository.hasProviderPhotoColumn();
  }

  static async hasProviderStatusColumn() {
    return PgServiceRepository.hasProviderStatusColumn();
  }

  static async hasServicePhotosTable() {
    return PgServiceRepository.hasServicePhotosTable();
  }

  static async hasAdminStatusColumn() {
    return PgServiceRepository.hasAdminStatusColumn();
  }

  static async listPhotosByServiceId(serviceId) {
    return PgServiceRepository.listPhotosByServiceId(serviceId);
  }

  static async getPhotoCountByServiceId(serviceId) {
    return PgServiceRepository.getPhotoCountByServiceId(serviceId);
  }

  static async addPhotos(serviceId, photoPaths = []) {
    return PgServiceRepository.addPhotos(serviceId, photoPaths);
  }

  static async search({ q, category_id, city } = {}) {
    return PgServiceRepository.search({
      q,
      categoryId: category_id,
      city,
    });
  }

  static async getOwnerIdBySlug(slug) {
    return PgServiceRepository.getOwnerIdBySlug(slug);
  }

  static async getBySlug(slug) {
    const service = await PgServiceRepository.findBySlug(slug);

    if (!service) {
      throw new Error("Service introuvable.");
    }

    service.photos = await this.listPhotosByServiceId(service.id);
    return service;
  }

  static async create(payload) {
    return PgServiceRepository.create(payload);
  }

  static async updateBySlug(slug, payload) {
    const service = await PgServiceRepository.updateBySlug(slug, payload);

    if (!service) {
      throw new Error("Service introuvable.");
    }

    return service;
  }

  static async deleteBySlug({ slug, providerId }) {
    if (!providerId) {
      throw new Error("Utilisateur non connecte.");
    }

    const hasAdminStatusColumn = await this.hasAdminStatusColumn();
    if (!hasAdminStatusColumn) {
      throw new Error(
        "La suppression du service n'est pas disponible sur cette version de la base."
      );
    }

    const deletedService = await PgServiceRepository.softDeleteBySlug({
      slug,
      providerId,
    });

    if (deletedService) {
      return deletedService;
    }

    const existingService = await PgServiceRepository.findDeletionContextBySlug(
      slug
    );

    if (!existingService) {
      throw new Error("Service introuvable.");
    }

    if (String(existingService.provider_id) !== String(providerId)) {
      throw new Error("Action non autorisée sur ce service.");
    }

    if (existingService.admin_status === "deleted") {
      throw new Error("Ce service est deja supprime.");
    }

    throw new Error("Impossible de supprimer ce service.");
  }
}

export default ServiceService;
