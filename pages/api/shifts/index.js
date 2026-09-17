const db = require('../../../lib/db');
const { getUserIdFromReq } = require('../../../lib/auth');
const { computeHours, SHIFT_TYPES } = require('../../../lib/shiftUtils');

const VALID_TYPES = SHIFT_TYPES.map((t) => t.value);

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  if (req.method === 'GET') {
    const { data: rows, error } = await db
      .from('shifts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('start', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Errore nel recupero dei turni' });
    }
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    const { date, type, label, start, end, note } = req.body || {};
    if (!date || !type || !start || !end) {
      return res.status(400).json({ error: 'Data, tipo, orario inizio e fine sono obbligatori' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipo turno non valido' });
    }
    const finalLabel = type === 'custom' ? (label || '').trim() : SHIFT_TYPES.find((t) => t.value === type).label;
    if (type === 'custom' && !finalLabel) {
      return res.status(400).json({ error: "L'etichetta è obbligatoria per i turni custom" });
    }
    const hours = computeHours(start, end);

    const { data: created, error } = await db
      .from('shifts')
      .insert({
        user_id: userId,
        date,
        type,
        label: finalLabel,
        start,
        end,
        hours,
        note: note || null,
      })
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Errore nel salvataggio del turno' });
    }
    return res.status(201).json(created);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Metodo non consentito' });
}
