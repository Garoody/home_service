"use strict";

import db from "../config/database.js";
import User from "../entities/User.js";

class UserRepository {
  static async findByEmail(email) {
    const query = /*sql*/`
      SELECT id_user, full_name, email, password_hash, phone, address, role, gdpr_consent, gdpr_consent_date, created_at, updated_at
      FROM public.users
      WHERE email = $1
      LIMIT 1;
    `;

    const { rows } = await db.query(query, [email]);
    return User.fromDatabase(rows[0]);
  }

  static async findById(userId) {
    const query = /*sql*/`
      SELECT id_user, full_name, email, password_hash, phone, address, role, gdpr_consent, gdpr_consent_date, created_at, updated_at
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
}

export default UserRepository;
