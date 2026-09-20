const db = require('../../../lib/db');
const { getUserIdFromReq } = require('../../../lib/auth');
const { computeHours, SHIFT_TYPES, isHourlessType } = require('../../../lib/shiftUtils');

const VALID_TYPES = SHIFT_TYPES.map((t) => t.value);

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }

  const { id } = req.query;
  const { data: existing } = await db
    .from('shifts')
    .select('id')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (!existing) {
    return res.status(404).json({ error: 'Turno non trovato' });
  }

  if (req.method === 'PUT') {
    const { date, type, label, start, end, note } = req.body || {};
    if (!date || !type) {
      return res.status(400).json({ error: 'Data e tipo sono obbligatori' });
    }
    if (!VALID_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Tipo turno non valido' });
    }
    const hourless = isHourlessType(type);
    if (!hourless && (!start || !end)) {
      return res.status(400).json({ error: 'Orario inizio e fine sono obbligatori' });
    }
    const finalLabel = type === 'custom' ? (label || '').trim() : SHIFT_TYPES.find((t) => t.value === type).label;
    if (type === 'custom' && !finalLabel) {
      return res.status(400).json({ error: "L'etichetta è obbligatoria per i turni custom" });
    }
    const hours = hourless ? 0 : computeHours(start, end);

    const { data: updated, error } = await db
      .from('shifts')
      .update({
        date,
        type,
        label: finalLabel,
        start: hourless ? '' : start,
        end: hourless ? '' : end,
        hours,
        note: note || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: "Errore nell'aggiornamento del turno" });
    }
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const { error } = await db
      .from('shifts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return res.status(500).json({ error: "Errore nell'eliminazione del turno" });
    }
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', ['PUT', 'DELETE']);
  return res.status(405).json({ error: 'Metodo non consentito' });
}
