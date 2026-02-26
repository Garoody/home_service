"use strict";

import db from "../config/database.js";

class UserService {
  async getByEmail(email) {
    const result = await db.query("SELECT * FROM public.users WHERE email = $1", [
      email,
    ]);
    return result.rows[0] || null;
  }

  async create({ full_name, email, password_hash, phone, role, gdpr_consent }) {
    const result = await db.query(
      `
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
      RETURNING id_user, full_name, email, role, created_at
      `,
      [full_name, email, password_hash, phone, role, gdpr_consent]
    );

    return result.rows[0];
  }
}

export default new UserService();
