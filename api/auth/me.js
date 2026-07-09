import { sql } from '../../lib/db.js';
import { getSession } from '../../lib/auth.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  try {
    const { rows } = await sql`
      SELECT email, name, username, avatar, theme FROM users WHERE id = ${session.uid}
    `;
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'No hay sesión activa' });

    return res.status(200).json({
      email: user.email,
      name: user.name || '',
      username: user.username || '',
      avatar: user.avatar || null,
      theme: user.theme || 'dark',
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
