import { sql } from '../../lib/db.js';
import { comparePassword, signSession, setSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Falta email o contraseña' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  try {
    const { rows } = await sql`SELECT id, email, password_hash FROM users WHERE email = ${normalizedEmail}`;
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const valid = await comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email o contraseña incorrectos' });
    }

    const token = signSession(user.id, user.email);
    setSessionCookie(res, token);
    return res.status(200).json({ email: user.email });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
