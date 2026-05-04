"use strict";

import db from "../config/database.js";
import User from "../entities/User.js";

class UserRepository {
  static _hasProviderProfileColumns = null;
  static _hasProviderStatusColumn = null;
  static _hasProfilePhotoColumn = null;
  static _hasModerationColumns = null;

  static async hasProviderProfileColumns() {
    if (this._hasProviderProfileColumns !== null) {
      return this._hasProviderProfileColumns;
    }

    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN ('experience_years', 'trainings', 'has_driving_license', 'service_area');
    `;

    const { rows } = await db.query(query);
    this._hasProviderProfileColumns = rows[0]?.count === 4;
    return this._hasProviderProfileColumns;
  }

  static async hasProfilePhotoColumn() {
    if (this._hasProfilePhotoColumn !== null) {
      return this._hasProfilePhotoColumn;
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
    this._hasProfilePhotoColumn = rows[0]?.exists === true;
    return this._hasProfilePhotoColumn;
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
          AND table_name = 'users'
          AND column_name = 'provider_status'
      ) AS exists;
    `;

    const { rows } = await db.query(query);
    this._hasProviderStatusColumn = rows[0]?.exists === true;
    return this._hasProviderStatusColumn;
  }

  static async hasModerationColumns() {
    if (this._hasModerationColumns !== null) {
      return this._hasModerationColumns;
    }

    const query = /*sql*/`
      SELECT COUNT(*)::int AS count
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name IN (
          'warning_count',
          'suspended_at',
          'suspended_reason',
          'banned_at',
          'banned_reason',
          'can_message',
          'can_publish_services',
          'deleted_by_admin_at',
          'admin_note'
        );
    `;

    const { rows } = await db.query(query);
    this._hasModerationColumns = rows[0]?.count === 9;
    return this._hasModerationColumns;
  }

  static async findByEmail(email) {
    const hasProviderProfileColumns = await this.hasProviderProfileColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const hasProfilePhotoColumn = await this.hasProfilePhotoColumn();
    const hasModerationColumns = await this.hasModerationColumns();
    const query = /*sql*/`
      SELECT
        id_user,
        full_name,
        email,
        password_hash,
        phone,
        address,
        role,
        gdpr_consent,
        gdpr_consent_date,
        ${hasProviderProfileColumns ? "experience_years" : "NULL::int AS experience_years"},
        ${hasProviderProfileColumns ? "trainings" : "NULL::text AS trainings"},
        ${hasProviderProfileColumns ? "has_driving_license" : "NULL::boolean AS has_driving_license"},
        ${hasProviderProfileColumns ? "service_area" : "NULL::varchar AS service_area"},
        ${hasProviderStatusColumn ? "provider_status" : "NULL::varchar AS provider_status"},
        ${hasProfilePhotoColumn ? "profile_photo_path" : "NULL::varchar AS profile_photo_path"},
        ${hasModerationColumns ? "warning_count" : "0::int AS warning_count"},
        ${hasModerationColumns ? "suspended_at" : "NULL::timestamptz AS suspended_at"},
        ${hasModerationColumns ? "suspended_reason" : "NULL::text AS suspended_reason"},
        ${hasModerationColumns ? "banned_at" : "NULL::timestamptz AS banned_at"},
        ${hasModerationColumns ? "banned_reason" : "NULL::text AS banned_reason"},
        ${hasModerationColumns ? "can_message" : "TRUE AS can_message"},
        ${hasModerationColumns ? "can_publish_services" : "TRUE AS can_publish_services"},
        ${hasModerationColumns ? "deleted_by_admin_at" : "NULL::timestamptz AS deleted_by_admin_at"},
        ${hasModerationColumns ? "admin_note" : "NULL::text AS admin_note"},
        created_at,
        updated_at
      FROM public.users
      WHERE email = $1
      LIMIT 1;
    `;
    const { rows } = await db.query(query, [email]);
    return User.fromDatabase(rows[0]);
  }

  static async findById(userId) {
    const hasProviderProfileColumns = await this.hasProviderProfileColumns();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const hasProfilePhotoColumn = await this.hasProfilePhotoColumn();
    const hasModerationColumns = await this.hasModerationColumns();
    const query = /*sql*/`
      SELECT
        id_user,
        full_name,
        email,
        password_hash,
        phone,
        address,
        role,
        gdpr_consent,
        gdpr_consent_date,
        ${hasProviderProfileColumns ? "experience_years" : "NULL::int AS experience_years"},
        ${hasProviderProfileColumns ? "trainings" : "NULL::text AS trainings"},
        ${hasProviderProfileColumns ? "has_driving_license" : "NULL::boolean AS has_driving_license"},
        ${hasProviderProfileColumns ? "service_area" : "NULL::varchar AS service_area"},
        ${hasProviderStatusColumn ? "provider_status" : "NULL::varchar AS provider_status"},
        ${hasProfilePhotoColumn ? "profile_photo_path" : "NULL::varchar AS profile_photo_path"},
        ${hasModerationColumns ? "warning_count" : "0::int AS warning_count"},
        ${hasModerationColumns ? "suspended_at" : "NULL::timestamptz AS suspended_at"},
        ${hasModerationColumns ? "suspended_reason" : "NULL::text AS suspended_reason"},
        ${hasModerationColumns ? "banned_at" : "NULL::timestamptz AS banned_at"},
        ${hasModerationColumns ? "banned_reason" : "NULL::text AS banned_reason"},
        ${hasModerationColumns ? "can_message" : "TRUE AS can_message"},
        ${hasModerationColumns ? "can_publish_services" : "TRUE AS can_publish_services"},
        ${hasModerationColumns ? "deleted_by_admin_at" : "NULL::timestamptz AS deleted_by_admin_at"},
        ${hasModerationColumns ? "admin_note" : "NULL::text AS admin_note"},
        created_at,
        updated_at
      FROM public.users
      WHERE id_user = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [userId]);
    return User.fromDatabase(rows[0]);
  }

  static async create({ full_name, email, password_hash, phone, role, gdpr_consent }) {
    const hasProfilePhotoColumn = await this.hasProfilePhotoColumn();
    const hasModerationColumns = await this.hasModerationColumns();
    const query = /*sql*/`
      INSERT INTO public.users (
        full_name,
        email,
        password_hash,
        phone,
        role,
        gdpr_consent,
        gdpr_consent_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING
        id_user,
        full_name,
        email,
        password_hash,
        phone,
        address,
        role,
        gdpr_consent,
        gdpr_consent_date,
        ${hasProfilePhotoColumn ? "profile_photo_path" : "NULL::varchar AS profile_photo_path"},
        ${hasModerationColumns ? "warning_count" : "0::int AS warning_count"},
        ${hasModerationColumns ? "suspended_at" : "NULL::timestamptz AS suspended_at"},
        ${hasModerationColumns ? "suspended_reason" : "NULL::text AS suspended_reason"},
        ${hasModerationColumns ? "banned_at" : "NULL::timestamptz AS banned_at"},
        ${hasModerationColumns ? "banned_reason" : "NULL::text AS banned_reason"},
        ${hasModerationColumns ? "can_message" : "TRUE AS can_message"},
        ${hasModerationColumns ? "can_publish_services" : "TRUE AS can_publish_services"},
        ${hasModerationColumns ? "deleted_by_admin_at" : "NULL::timestamptz AS deleted_by_admin_at"},
        ${hasModerationColumns ? "admin_note" : "NULL::text AS admin_note"},
        created_at,
        updated_at;
    `;
    const values = [full_name, email, password_hash, phone, role, gdpr_consent];
    const { rows } = await db.query(query, values);
    return User.fromDatabase(rows[0]);
  }

  static async deleteById(userId) {
    const query = /*sql*/`
      DELETE FROM public.users
      WHERE id_user = $1
      RETURNING id_user;
    `;

    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
  }

  static async updateServiceProfile({
    userId,
    experience_years,
    trainings,
    has_driving_license,
    service_area,
    provider_status,
    profile_photo_path,
  }) {
    const hasProviderProfileColumns = await this.hasProviderProfileColumns();
    if (!hasProviderProfileColumns) {
      throw new Error("Les colonnes du profil de publication ne sont pas encore disponibles en base.");
    }

    const hasProfilePhotoColumn = await this.hasProfilePhotoColumn();
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    const query = hasProfilePhotoColumn && hasProviderStatusColumn
      ? /*sql*/`
          UPDATE public.users
          SET
            experience_years = $1,
            trainings = $2,
            has_driving_license = $3,
            service_area = $4,
            provider_status = $5,
            profile_photo_path = COALESCE($6, profile_photo_path),
            updated_at = NOW()
          WHERE id_user = $7
          RETURNING id_user;
        `
      : hasProfilePhotoColumn
      ? /*sql*/`
          UPDATE public.users
          SET
            experience_years = $1,
            trainings = $2,
            has_driving_license = $3,
            service_area = $4,
            profile_photo_path = COALESCE($5, profile_photo_path),
            updated_at = NOW()
          WHERE id_user = $6
          RETURNING id_user;
        `
      : hasProviderStatusColumn
      ? /*sql*/`
          UPDATE public.users
          SET
            experience_years = $1,
            trainings = $2,
            has_driving_license = $3,
            service_area = $4,
            provider_status = $5,
            updated_at = NOW()
          WHERE id_user = $6
          RETURNING id_user;
        `
      : /*sql*/`
          UPDATE public.users
          SET
            experience_years = $1,
            trainings = $2,
            has_driving_license = $3,
            service_area = $4,
            updated_at = NOW()
          WHERE id_user = $5
          RETURNING id_user;
        `;

    const values =
      hasProfilePhotoColumn && hasProviderStatusColumn
        ? [experience_years, trainings, has_driving_license, service_area, provider_status, profile_photo_path || null, userId]
        : hasProfilePhotoColumn
        ? [experience_years, trainings, has_driving_license, service_area, profile_photo_path || null, userId]
        : hasProviderStatusColumn
        ? [experience_years, trainings, has_driving_license, service_area, provider_status, userId]
        : [experience_years, trainings, has_driving_license, service_area, userId];
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  static async updateProviderStatus({ userId, provider_status }) {
    const hasProviderStatusColumn = await this.hasProviderStatusColumn();
    if (!hasProviderStatusColumn) {
      return null;
    }

    const query = /*sql*/`
      UPDATE public.users
      SET
        provider_status = $1,
        updated_at = NOW()
      WHERE id_user = $2
      RETURNING id_user;
    `;

    const { rows } = await db.query(query, [provider_status, userId]);
    return rows[0] || null;
  }

  static async updateUserProfile({ userId, full_name, phone, address }) {
    const query = /*sql*/`
      UPDATE public.users
      SET
        full_name = $1,
        phone = NULLIF($2, ''),
        address = NULLIF($3, ''),
        updated_at = NOW()
      WHERE id_user = $4
      RETURNING id_user, full_name;
    `;

    const values = [full_name, phone, address, userId];
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }
}

export default UserRepository;
