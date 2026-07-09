// POST /api/analyze-card
// Body: { image: "<base64 jpeg, no data: prefix>" }
// Keeps ANTHROPIC_API_KEY server-side — never exposed to the browser.
// Requires an active session so anonymous visitors can't burn API credits.

import { getSession } from '../lib/auth.js';

const PROMPT = `Estás viendo la foto de una carta física Panini Adrenalyn XL FIFA World Cup 2026. Identifica lo que puedas y responde SOLO con un objeto JSON, sin texto adicional, sin backticks, con esta forma exacta:
{
  "number": "número de carta si es visible, texto vacío si no",
  "player": "nombre del jugador tal como aparece en la carta",
  "team": "selección nacional del jugador",
  "tier": "una de estas opciones exactas: Base, Team Logo, Contender, Fans' Favourite, Master Rookie, Icon, Golden Baller, Limited Edition, Eternos 22, Otro",
  "condition_guess": "una de estas opciones exactas según el estado visual de la carta: Mint, NM, EX, Jugada",
  "estimated_value_low": número en USD (estimación aproximada, 0 si no tienes idea),
  "estimated_value_high": número en USD (estimación aproximada),
  "confidence": "alta, media o baja",
  "notes": "cualquier duda sobre la identificación, en una frase corta"
}
Si no puedes leer algún campo con confianza, dejalo como texto vacío o 0, y bájalo en "confidence". No inventes datos.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = getSession(req);
  if (!session) {
    return res.status(401).json({ error: 'No hay sesión activa' });
  }

  const { image } = req.body || {};
  if (!image) {
    return res.status(400).json({ error: 'Falta la imagen (campo "image" en base64).' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY no está configurada en el proyecto de Vercel.' });
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: image } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text();
      return res.status(anthropicRes.status).json({ error: `Anthropic API: ${errText}` });
    }

    const data = await anthropicRes.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}
