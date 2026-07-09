import { sql } from '@vercel/postgres';
import { hashPassword, signSession, setSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Falta email o contraseña' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const { rows: existing } = await sql`SELECT id FROM users WHERE email = ${normalizedEmail}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });
    }

    const passwordHash = await hashPassword(password);
    const { rows } = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${normalizedEmail}, ${passwordHash})
      RETURNING id, email
    `;
    const user = rows[0];

    const token = signSession(user.id, user.email);
    setSessionCookie(res, token);
    return res.status(200).json({ email: user.email });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
