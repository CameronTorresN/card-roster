// GET  /api/cards       -> list the signed-in user's collection
// POST /api/cards       -> create or update a card (upsert by id), scoped to the user

import { sql } from '@vercel/postgres';
import { getSession } from '../../lib/auth.js';

export default async function handler(req, res) {
  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }
  const userId = session.uid;

  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT * FROM cards WHERE user_id = ${userId} ORDER BY added_at DESC`;
      const cards = rows.map(r => ({
        id: r.id,
        num: r.num,
        player: r.player,
        team: r.team,
        tier: r.tier,
        cond: r.cond,
        qty: r.qty,
        value: Number(r.value),
        notes: r.notes,
        image: r.image,
        addedAt: Number(r.added_at),
      }));
      return res.status(200).json(cards);
    }

    if (req.method === 'POST') {
      const c = req.body || {};
      if (!c.id || !c.player) {
        return res.status(400).json({ error: 'Falta id o player' });
      }
      await sql`
        INSERT INTO cards (id, user_id, num, player, team, tier, cond, qty, value, notes, image, added_at)
        VALUES (${c.id}, ${userId}, ${c.num || ''}, ${c.player}, ${c.team || ''}, ${c.tier || 'Base'},
                ${c.cond || 'Mint'}, ${c.qty || 1}, ${c.value || 0}, ${c.notes || ''},
                ${c.image || null}, ${c.addedAt || Date.now()})
        ON CONFLICT (id) DO UPDATE SET
          num = EXCLUDED.num,
          player = EXCLUDED.player,
          team = EXCLUDED.team,
          tier = EXCLUDED.tier,
          cond = EXCLUDED.cond,
          qty = EXCLUDED.qty,
          value = EXCLUDED.value,
          notes = EXCLUDED.notes,
          image = EXCLUDED.image
        WHERE cards.user_id = ${userId}
      `;
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
