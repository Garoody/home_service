"use strict";

import db from "../config/database.js";

class ServiceService {
  static _hasProviderDetailsColumns = null;
  static _hasProviderStatusColumn = null;
  static _hasProviderPhotoColumn = null;
  static _hasServicePhotosTable = null;
  static _hasAdminStatusColumn = null;

  static async hasProviderDetailsColumns() {
    if (this._hasProviderDetailsColumns !== null) return this._hasProviderDetailsColumns;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'services'
        AND column_name IN ('experience_years', 'trainings', 'has_driving_license', 'service_area')
      `
    );

    this._hasProviderDetailsColumns = result.rows[0]?.count === 4;
    return this._hasProviderDetailsColumns;
  }

  static async hasProviderPhotoColumn() {
    if (this._hasProviderPhotoColumn !== null) return this._hasProviderPhotoColumn;

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'profile_photo_path'
      ) AS exists
      `
    );

    this._hasProviderPhotoColumn = result.rows[0]?.exists === true;
    return this._hasProviderPhotoColumn;
  }

  static async hasProviderStatusColumn() {
    if (this._hasProviderStatusColumn !== null) return this._hasProviderStatusColumn;

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'provider_status'
      ) AS exists
      `
    );

    this._hasProviderStatusColumn = result.rows[0]?.exists === true;
    return this._hasProviderStatusColumn;
  }

  static async hasServicePhotosTable() {
    if (this._hasServicePhotosTable !== null) return this._hasServicePhotosTable;

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'service_photos'
      ) AS exists
      `
    );

    this._hasServicePhotosTable = result.rows[0]?.exists === true;
    return this._hasServicePhotosTable;
  }

  static async hasAdminStatusColumn() {
    if (this._hasAdminStatusColumn !== null) return this._hasAdminStatusColumn;

    const result = await db.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'admin_status'
      ) AS exists
      `
    );

    this._hasAdminStatusColumn = result.rows[0]?.exists === true;
    return this._hasAdminStatusColumn;
  }

  static async listPhotosByServiceId(serviceId) {
    const hasServicePhotosTable = await this.hasServicePhotosTable();
    if (!hasServicePhotosTable || !serviceId) return [];

    const result = await db.query(
      `
      SELECT
        id_service_photo::text AS id,
        image_path,
        display_order
      FROM public.service_photos
      WHERE service_id = $1
      ORDER BY display_order ASC, created_at ASC
      `,
      [serviceId]
    );

    return result.rows;
  }

  static async getPhotoCountByServiceId(serviceId) {
    const hasServicePhotosTable = await this.hasServicePhotosTable();
    if (!hasServicePhotosTable || !serviceId) return 0;

    const result = await db.query(
      `
      SELECT COUNT(*)::int AS count
      FROM public.service_photos
      WHERE service_id = $1
      `,
      [serviceId]
    );

    return result.rows[0]?.count || 0;
  }

  static async addPhotos(serviceId, photoPaths = []) {
    const hasServicePhotosTable = await this.hasServicePhotosTable();
    if (!hasServicePhotosTable || !serviceId || photoPaths.length === 0) return [];

    const currentCount = await this.getPhotoCountByServiceId(serviceId);
    const values = [];
    const placeholders = photoPaths.map((photoPath, index) => {
      const position = currentCount + index + 1;
      values.push(serviceId, photoPath, position);
      const offset = index * 3;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
    });

    const result = await db.query(
      `
      INSERT INTO public.service_photos (
        service_id,
        image_path,
        display_order
      )
      VALUES ${placeholders.join(", ")}
      RETURNING id_service_photo::text AS id, image_path, display_order
      `,
      values
    );

    return result.rows;
  }

  static async search({ q, category_id, city } = {}) {
    const hasProviderDetailsColumns = await this.hasProviderDetailsColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const hasProviderPhotoColumn = await this.hasProviderPhotoColumn();
    const hasAdminStatusColumn = await this.hasAdminStatusColumn();
    const values = [];
    const where = [];

    if (hasAdminStatusColumn) {
      where.push(`COALESCE(s.admin_status, 'active') = 'active'`);
    }

    if (q) {
      values.push(`%${q}%`);
      where.push(
        `(s.title ILIKE $${values.length} OR s.description ILIKE $${values.length})`
      );
    }

    if (category_id) {
      values.push(category_id);
      where.push(`s.category_id = $${values.length}`);
    }

    if (city) {
      if (!hasProviderDetailsColumns) {
        return [];
      }

      values.push(`%${city}%`);
      where.push(`s.service_area ILIKE $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const result = await db.query(
      `
      SELECT
        s.id_service AS id,
        s.id_service::text AS slug,
        s.title,
        s.description,
        s.price,
        ${hasProviderDetailsColumns ? "s.experience_years" : "NULL::int AS experience_years"},
        ${hasProviderDetailsColumns ? "s.trainings" : "NULL::text AS trainings"},
        ${hasProviderDetailsColumns ? "s.has_driving_license" : "NULL::boolean AS has_driving_license"},
        ${hasProviderDetailsColumns ? "s.service_area" : "NULL::varchar AS service_area"},
        ${hasProviderStatusColumn ? "s.provider_status" : "NULL::varchar AS provider_status"},
        ${hasAdminStatusColumn ? "s.admin_status" : "'active'::varchar AS admin_status"},
        ${hasAdminStatusColumn ? "s.admin_status_reason" : "NULL::text AS admin_status_reason"},
        s.category_id,
        s.provider_id,
        s.created_at,
        u.full_name AS provider_name,
        ${hasProviderPhotoColumn ? "u.profile_photo_path AS provider_photo_path" : "NULL::varchar AS provider_photo_path"},
        c.name AS category_name
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      ${whereSql}
      ORDER BY s.created_at DESC
      `,
      values
    );

    return result.rows;
  }

  // Recupere l'id du prestataire proprietaire d'un service.
  static async getOwnerIdBySlug(slug) {
    const result = await db.query(
      `
      SELECT provider_id::text AS provider_id
      FROM public.services
      WHERE id_service::text = $1
      `,
      [slug]
    );

    return result.rows[0]?.provider_id || null;
  }

  static async getBySlug(slug) {
    const hasProviderDetailsColumns = await this.hasProviderDetailsColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const hasProviderPhotoColumn = await this.hasProviderPhotoColumn();
    const hasAdminStatusColumn = await this.hasAdminStatusColumn();
    // The route uses `:slug`, but the current DB schema has no `slug` column.
    // We use `id_service` (UUID) as URL identifier for now.
    const result = await db.query(
      `
      SELECT
        s.id_service AS id,
        s.id_service::text AS slug,
        s.provider_id,
        s.category_id,
        s.title,
        s.description,
        s.price,
        ${hasProviderDetailsColumns ? "s.experience_years" : "NULL::int AS experience_years"},
        ${hasProviderDetailsColumns ? "s.trainings" : "NULL::text AS trainings"},
        ${hasProviderDetailsColumns ? "s.has_driving_license" : "NULL::boolean AS has_driving_license"},
        ${hasProviderDetailsColumns ? "s.service_area" : "NULL::varchar AS service_area"},
        ${hasProviderStatusColumn ? "s.provider_status" : "NULL::varchar AS provider_status"},
        ${hasAdminStatusColumn ? "s.admin_status" : "'active'::varchar AS admin_status"},
        ${hasAdminStatusColumn ? "s.admin_status_reason" : "NULL::text AS admin_status_reason"},
        ${hasAdminStatusColumn ? "s.admin_status_updated_at" : "NULL::timestamptz AS admin_status_updated_at"},
        s.created_at,
        s.updated_at,
        u.full_name AS provider_name,
        ${hasProviderPhotoColumn ? "u.profile_photo_path AS provider_photo_path" : "NULL::varchar AS provider_photo_path"},
        c.name AS category_name
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      WHERE s.id_service::text = $1
      `,
      [slug]
    );

    if (!result.rows[0]) {
      throw new Error("Service introuvable.");
    }

    const service = result.rows[0];
    service.photos = await this.listPhotosByServiceId(service.id);
    return service;
  }

  static async create({
    provider_id,
    category_id,
    title,
    description,
    price,
    provider_status,
    experience_years,
    trainings,
    has_driving_license,
    service_area,
  }) {
    const hasProviderDetailsColumns = await this.hasProviderDetailsColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const result = hasProviderDetailsColumns && hasProviderStatusColumn
      ? await db.query(
          `
          INSERT INTO services (
            provider_id,
            category_id,
            title,
            description,
            price,
            provider_status,
            experience_years,
            trainings,
            has_driving_license,
            service_area,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
          RETURNING *
          `,
          [provider_id, category_id, title, description, price, provider_status, experience_years, trainings, has_driving_license, service_area]
        )
      : hasProviderDetailsColumns
      ? await db.query(
          `
          INSERT INTO services (
            provider_id,
            category_id,
            title,
            description,
            price,
            experience_years,
            trainings,
            has_driving_license,
            service_area,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
          RETURNING *
          `,
          [provider_id, category_id, title, description, price, experience_years, trainings, has_driving_license, service_area]
        )
      : hasProviderStatusColumn
      ? await db.query(
          `
          INSERT INTO services (
            provider_id,
            category_id,
            title,
            description,
            price,
            provider_status,
            created_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          RETURNING *
          `,
          [provider_id, category_id, title, description, price, provider_status]
        )
      : await db.query(
          `
          INSERT INTO services (provider_id, category_id, title, description, price, created_at)
          VALUES ($1, $2, $3, $4, $5, NOW())
          RETURNING *
          `,
          [provider_id, category_id, title, description, price]
        );

    return result.rows[0];
  }

  static async updateBySlug(
    slug,
    { category_id, title, description, price, provider_status, experience_years, trainings, has_driving_license, service_area }
  ) {
    const hasProviderDetailsColumns = await this.hasProviderDetailsColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const result = hasProviderDetailsColumns && hasProviderStatusColumn
      ? await db.query(
          `
          UPDATE public.services
          SET
            category_id = $1,
            title = $2,
            description = $3,
            price = $4,
            provider_status = $5,
            experience_years = $6,
            trainings = $7,
            has_driving_license = $8,
            service_area = $9,
            updated_at = NOW()
          WHERE id_service::text = $10
          RETURNING id_service
          `,
          [category_id, title, description, price, provider_status, experience_years, trainings, has_driving_license, service_area, slug]
        )
      : hasProviderDetailsColumns
      ? await db.query(
          `
          UPDATE public.services
          SET
            category_id = $1,
            title = $2,
            description = $3,
            price = $4,
            experience_years = $5,
            trainings = $6,
            has_driving_license = $7,
            service_area = $8,
            updated_at = NOW()
          WHERE id_service::text = $9
          RETURNING id_service
          `,
          [category_id, title, description, price, experience_years, trainings, has_driving_license, service_area, slug]
        )
      : hasProviderStatusColumn
      ? await db.query(
          `
          UPDATE public.services
          SET
            category_id = $1,
            title = $2,
            description = $3,
            price = $4,
            provider_status = $5,
            updated_at = NOW()
          WHERE id_service::text = $6
          RETURNING id_service
          `,
          [category_id, title, description, price, provider_status, slug]
        )
      : await db.query(
          `
          UPDATE public.services
          SET
            category_id = $1,
            title = $2,
            description = $3,
            price = $4,
            updated_at = NOW()
          WHERE id_service::text = $5
          RETURNING id_service
          `,
          [category_id, title, description, price, slug]
        );

    if (!result.rows[0]) {
      throw new Error("Service introuvable.");
    }

    return result.rows[0];
  }
}

export default ServiceService;
