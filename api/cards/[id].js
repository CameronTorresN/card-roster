// DELETE /api/cards/:id  -> only deletes if it belongs to the signed-in user

import { sql } from '../../lib/db.js';
import { getSession } from '../../lib/auth.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }
  const { id } = req.query;

  try {
    if (req.method === 'DELETE') {
      await sql`DELETE FROM cards WHERE id = ${id} AND user_id = ${session.uid}`;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['DELETE']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
