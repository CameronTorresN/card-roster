import { sql } from '@vercel/postgres';
import { getSession, comparePassword, clearSessionCookie } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  const { currentPassword } = req.body || {};
  if (!currentPassword) {
    return res.status(400).json({ error: 'Falta la contraseña actual' });
  }

  try {
    const { rows } = await sql`SELECT password_hash FROM users WHERE id = ${session.uid}`;
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta' });

    // ON DELETE CASCADE on cards.user_id takes care of the collection
    await sql`DELETE FROM users WHERE id = ${session.uid}`;

    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
