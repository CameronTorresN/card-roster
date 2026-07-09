import { sql } from '../../lib/db.js';
import { getSession, comparePassword, hashPassword } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Falta la contraseña actual o la nueva' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const { rows } = await sql`SELECT password_hash FROM users WHERE id = ${session.uid}`;
    const user = rows[0];
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const valid = await comparePassword(currentPassword, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const newHash = await hashPassword(newPassword);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${session.uid}`;

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
