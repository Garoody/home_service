"use strict";

import db from "../config/database.js";
import Service from "../entities/Service.js";

class PgServiceRepository {
  static _hasProviderDetailsColumns = null;
  static _hasProviderStatusColumn = null;
  static _hasProviderPhotoColumn = null;
  static _hasServicePhotosTable = null;
  static _hasAdminStatusColumn = null;

  static async hasProviderDetailsColumns() {
    if (this._hasProviderDetailsColumns !== null) {
      return this._hasProviderDetailsColumns;
    }

    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'services'
        AND column_name IN (
          'experience_years',
          'trainings',
          'has_driving_license',
          'service_area'
        );
    `;

    const { rows } = await db.query(query);
    this._hasProviderDetailsColumns = rows[0]?.count === 4;
    return this._hasProviderDetailsColumns;
  }

  static async hasProviderPhotoColumn() {
    if (this._hasProviderPhotoColumn !== null) {
      return this._hasProviderPhotoColumn;
    }

    const query = /*sql*/`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'profile_photo_path'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasProviderPhotoColumn = rows[0]?.exists === true;
    return this._hasProviderPhotoColumn;
  }

  static async hasProviderStatusColumn() {
    if (this._hasProviderStatusColumn !== null) {
      return this._hasProviderStatusColumn;
    }

    const query = /*sql*/`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'provider_status'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasProviderStatusColumn = rows[0]?.exists === true;
    return this._hasProviderStatusColumn;
  }

  static async hasServicePhotosTable() {
    if (this._hasServicePhotosTable !== null) {
      return this._hasServicePhotosTable;
    }

    const query = /*sql*/`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'service_photos'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasServicePhotosTable = rows[0]?.exists === true;
    return this._hasServicePhotosTable;
  }

  static async hasAdminStatusColumn() {
    if (this._hasAdminStatusColumn !== null) {
      return this._hasAdminStatusColumn;
    }

    const query = /*sql*/`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'services'
          AND column_name = 'admin_status'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasAdminStatusColumn = rows[0]?.exists === true;
    return this._hasAdminStatusColumn;
  }

  static async getFeatureFlags() {
    const [
      hasProviderDetailsColumns,
      hasProviderStatusColumn,
      hasProviderPhotoColumn,
      hasAdminStatusColumn,
    ] = await Promise.all([
      this.hasProviderDetailsColumns(),
      this.hasProviderStatusColumn(),
      this.hasProviderPhotoColumn(),
      this.hasAdminStatusColumn(),
    ]);

    return {
      hasProviderDetailsColumns,
      hasProviderStatusColumn,
      hasProviderPhotoColumn,
      hasAdminStatusColumn,
    };
  }

  static buildDetailsSelect(flags, { includeUpdatedAt = true } = {}) {
    return `
      s.id_service AS id,
      s.id_service::text AS slug,
      s.provider_id,
      s.category_id,
      s.title,
      s.description,
      s.price,
      ${
        flags.hasProviderDetailsColumns
          ? "s.experience_years"
          : "NULL::int AS experience_years"
      },
      ${
        flags.hasProviderDetailsColumns ? "s.trainings" : "NULL::text AS trainings"
      },
      ${
        flags.hasProviderDetailsColumns
          ? "s.has_driving_license"
          : "NULL::boolean AS has_driving_license"
      },
      ${
        flags.hasProviderDetailsColumns
          ? "s.service_area"
          : "NULL::varchar AS service_area"
      },
      ${
        flags.hasProviderStatusColumn
          ? "s.provider_status"
          : "NULL::varchar AS provider_status"
      },
      ${
        flags.hasAdminStatusColumn
          ? "s.admin_status"
          : "'active'::varchar AS admin_status"
      },
      ${
        flags.hasAdminStatusColumn
          ? "s.admin_status_reason"
          : "NULL::text AS admin_status_reason"
      },
      ${
        flags.hasAdminStatusColumn
          ? "s.admin_status_updated_at"
          : "NULL::timestamptz AS admin_status_updated_at"
      },
      s.created_at,
      ${includeUpdatedAt ? "s.updated_at," : ""}
      u.full_name AS provider_name,
      ${
        flags.hasProviderPhotoColumn
          ? "u.profile_photo_path AS provider_photo_path"
          : "NULL::varchar AS provider_photo_path"
      },
      c.name AS category_name
    `;
  }

  static buildMutationReturning(flags) {
    return `
      id_service AS id,
      id_service::text AS slug,
      provider_id,
      category_id,
      title,
      description,
      price,
      ${
        flags.hasProviderDetailsColumns
          ? "experience_years"
          : "NULL::int AS experience_years"
      },
      ${
        flags.hasProviderDetailsColumns ? "trainings" : "NULL::text AS trainings"
      },
      ${
        flags.hasProviderDetailsColumns
          ? "has_driving_license"
          : "NULL::boolean AS has_driving_license"
      },
      ${
        flags.hasProviderDetailsColumns
          ? "service_area"
          : "NULL::varchar AS service_area"
      },
      ${
        flags.hasProviderStatusColumn
          ? "provider_status"
          : "NULL::varchar AS provider_status"
      },
      ${
        flags.hasAdminStatusColumn
          ? "admin_status"
          : "'active'::varchar AS admin_status"
      },
      ${
        flags.hasAdminStatusColumn
          ? "admin_status_reason"
          : "NULL::text AS admin_status_reason"
      },
      ${
        flags.hasAdminStatusColumn
          ? "admin_status_updated_at"
          : "NULL::timestamptz AS admin_status_updated_at"
      },
      created_at,
      updated_at
    `;
  }

  static async listPhotosByServiceId(serviceId) {
    const hasServicePhotosTable = await this.hasServicePhotosTable();
    if (!hasServicePhotosTable || !serviceId) return [];

    const query = /*sql*/`
      SELECT
        id_service_photo::text AS id,
        image_path,
        display_order
      FROM public.service_photos
      WHERE service_id = $1
      ORDER BY display_order ASC, created_at ASC;
    `;

    const { rows } = await db.query(query, [serviceId]);
    return rows;
  }

  static async getPhotoCountByServiceId(serviceId) {
    const hasServicePhotosTable = await this.hasServicePhotosTable();
    if (!hasServicePhotosTable || !serviceId) return 0;

    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM public.service_photos
      WHERE service_id = $1;
    `;

    const { rows } = await db.query(query, [serviceId]);
    return rows[0]?.count || 0;
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

    const query = /*sql*/`
      INSERT INTO public.service_photos (
        service_id,
        image_path,
        display_order
      )
      VALUES ${placeholders.join(", ")}
      RETURNING id_service_photo::text AS id, image_path, display_order;
    `;

    const { rows } = await db.query(query, values);
    return rows;
  }

  static async search({ q, categoryId, city } = {}) {
    const flags = await this.getFeatureFlags();
    if (city && !flags.hasProviderDetailsColumns) {
      return [];
    }

    const values = [];
    const where = [];

    if (flags.hasAdminStatusColumn) {
      where.push(`COALESCE(s.admin_status, 'active') = 'active'`);
    }

    if (q) {
      values.push(`%${q}%`);
      where.push(
        `(s.title ILIKE $${values.length} OR s.description ILIKE $${values.length})`
      );
    }

    if (categoryId) {
      values.push(categoryId);
      where.push(`s.category_id = $${values.length}`);
    }

    if (city) {
      values.push(`%${city}%`);
      where.push(`s.service_area ILIKE $${values.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const query = /*sql*/`
      SELECT
        ${this.buildDetailsSelect(flags, { includeUpdatedAt: false })}
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      ${whereSql}
      ORDER BY s.created_at DESC;
    `;

    const { rows } = await db.query(query, values);
    return Service.fromDatabaseList(rows);
  }

  static async getOwnerIdBySlug(slug) {
    const query = /*sql*/`
      SELECT provider_id::text AS provider_id
      FROM public.services
      WHERE id_service::text = $1;
    `;

    const { rows } = await db.query(query, [slug]);
    return rows[0]?.provider_id || null;
  }

  static async findBySlug(slug) {
    const flags = await this.getFeatureFlags();
    const query = /*sql*/`
      SELECT
        ${this.buildDetailsSelect(flags)}
      FROM public.services s
      JOIN public.users u ON s.provider_id = u.id_user
      JOIN public.categories c ON s.category_id = c.id_category
      WHERE s.id_service::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [slug]);
    return Service.fromDatabase(rows[0]);
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
    const flags = await this.getFeatureFlags();
    const query =
      flags.hasProviderDetailsColumns && flags.hasProviderStatusColumn
        ? /*sql*/`
            INSERT INTO public.services (
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
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : flags.hasProviderDetailsColumns
        ? /*sql*/`
            INSERT INTO public.services (
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
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : flags.hasProviderStatusColumn
        ? /*sql*/`
            INSERT INTO public.services (
              provider_id,
              category_id,
              title,
              description,
              price,
              provider_status,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : /*sql*/`
            INSERT INTO public.services (
              provider_id,
              category_id,
              title,
              description,
              price,
              created_at
            )
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING ${this.buildMutationReturning(flags)};
          `;

    const values =
      flags.hasProviderDetailsColumns && flags.hasProviderStatusColumn
        ? [
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
          ]
        : flags.hasProviderDetailsColumns
        ? [
            provider_id,
            category_id,
            title,
            description,
            price,
            experience_years,
            trainings,
            has_driving_license,
            service_area,
          ]
        : flags.hasProviderStatusColumn
        ? [provider_id, category_id, title, description, price, provider_status]
        : [provider_id, category_id, title, description, price];

    const { rows } = await db.query(query, values);
    return Service.fromDatabase(rows[0]);
  }

  static async updateBySlug(
    slug,
    {
      category_id,
      title,
      description,
      price,
      provider_status,
      experience_years,
      trainings,
      has_driving_license,
      service_area,
    }
  ) {
    const flags = await this.getFeatureFlags();
    const query =
      flags.hasProviderDetailsColumns && flags.hasProviderStatusColumn
        ? /*sql*/`
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
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : flags.hasProviderDetailsColumns
        ? /*sql*/`
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
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : flags.hasProviderStatusColumn
        ? /*sql*/`
            UPDATE public.services
            SET
              category_id = $1,
              title = $2,
              description = $3,
              price = $4,
              provider_status = $5,
              updated_at = NOW()
            WHERE id_service::text = $6
            RETURNING ${this.buildMutationReturning(flags)};
          `
        : /*sql*/`
            UPDATE public.services
            SET
              category_id = $1,
              title = $2,
              description = $3,
              price = $4,
              updated_at = NOW()
            WHERE id_service::text = $5
            RETURNING ${this.buildMutationReturning(flags)};
          `;

    const values =
      flags.hasProviderDetailsColumns && flags.hasProviderStatusColumn
        ? [
            category_id,
            title,
            description,
            price,
            provider_status,
            experience_years,
            trainings,
            has_driving_license,
            service_area,
            slug,
          ]
        : flags.hasProviderDetailsColumns
        ? [
            category_id,
            title,
            description,
            price,
            experience_years,
            trainings,
            has_driving_license,
            service_area,
            slug,
          ]
        : flags.hasProviderStatusColumn
        ? [category_id, title, description, price, provider_status, slug]
        : [category_id, title, description, price, slug];

    const { rows } = await db.query(query, values);
    return Service.fromDatabase(rows[0]);
  }

  static async softDeleteBySlug({ slug, providerId }) {
    const query = /*sql*/`
      UPDATE public.services
      SET
        admin_status = 'deleted',
        admin_status_reason = COALESCE(admin_status_reason, 'Supprime par le prestataire.'),
        admin_status_updated_at = NOW(),
        updated_at = NOW()
      WHERE id_service::text = $1
        AND provider_id::text = $2
        AND COALESCE(admin_status, 'active') <> 'deleted'
      RETURNING id_service::text AS id, title;
    `;

    const { rows } = await db.query(query, [slug, String(providerId)]);
    return rows[0] || null;
  }

  static async findDeletionContextBySlug(slug) {
    const query = /*sql*/`
      SELECT
        id_service::text AS id,
        provider_id::text AS provider_id,
        COALESCE(admin_status, 'active') AS admin_status
      FROM public.services
      WHERE id_service::text = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [slug]);
    return rows[0] || null;
  }
}

export default PgServiceRepository;
