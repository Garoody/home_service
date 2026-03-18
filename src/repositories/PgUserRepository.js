"use strict";

import db from "../config/database.js";
import User from "../entities/User.js";

class UserRepository {
  static _hasProviderProfileColumns = null;

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

  static async findByEmail(email) {
    const hasProviderProfileColumns = await this.hasProviderProfileColumns();
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
      RETURNING id_user, full_name, email, password_hash, phone, address, role, gdpr_consent, gdpr_consent_date, created_at, updated_at;
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

  static async updateProviderProfile({
    userId,
    experience_years,
    trainings,
    has_driving_license,
    service_area,
  }) {
    const hasProviderProfileColumns = await this.hasProviderProfileColumns();
    if (!hasProviderProfileColumns) {
      throw new Error("Le profil prestataire n'est pas encore disponible en base.");
    }

    const query = /*sql*/`
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

    const values = [experience_years, trainings, has_driving_license, service_area, userId];
    const { rows } = await db.query(query, values);
    return rows[0] || null;
  }

  static async updateClientProfile({ userId, full_name, phone, address }) {
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
