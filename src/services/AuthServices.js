"use strict";

import db from "../config/database.js";
import bcrypt from "bcrypt";

class AuthService {
  static async register({ name, email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.query(
      `
      INSERT INTO users (name, email, password, role, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING id, name, email, role
      `,
      [name, email, hashedPassword, role]
    );

    return result.rows[0];
  }

  static async login(email) {
    const result = await db.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    return result.rows[0] || null;
  }
}

export default AuthService;