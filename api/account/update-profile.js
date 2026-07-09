import { sql } from '../../lib/db.js';
import { getSession } from '../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  const { name, username, avatar, theme } = req.body || {};

  if (theme && theme !== 'dark' && theme !== 'light') {
    return res.status(400).json({ error: 'Tema inválido' });
  }

  const cleanUsername = username ? String(username).trim().toLowerCase().replace(/[^a-z0-9_.]/g, '') : null;

  try {
    if (cleanUsername) {
      const { rows: existing } = await sql`
        SELECT id FROM users WHERE username = ${cleanUsername} AND id != ${session.uid}
      `;
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Ese nombre de usuario ya está en uso' });
      }
    }

    const { rows } = await sql`
      UPDATE users SET
        name = COALESCE(${name ?? null}, name),
        username = COALESCE(${cleanUsername}, username),
        avatar = COALESCE(${avatar ?? null}, avatar),
        theme = COALESCE(${theme ?? null}, theme)
      WHERE id = ${session.uid}
      RETURNING name, username, avatar, theme
    `;

    return res.status(200).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
