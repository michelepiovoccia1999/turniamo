const db = require('../../../lib/db');
const { createSessionCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { username } = req.body || {};
  const cleanUsername = (username || '').trim();
  if (!cleanUsername) {
    return res.status(400).json({ error: 'Username obbligatorio' });
  }

  const { data: existing } = await db
    .from('users')
    .select('*')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (existing) {
    res.setHeader('Set-Cookie', createSessionCookie(existing.id));
    return res.status(200).json({ id: existing.id, username: existing.username, name: existing.name });
  }

  const { data: created, error } = await db
    .from('users')
    .insert({ username: cleanUsername, password_hash: '', name: cleanUsername })
    .select('id, username, name')
    .single();

  if (error) {
    return res.status(500).json({ error: "Errore nella creazione dell'account" });
  }

  res.setHeader('Set-Cookie', createSessionCookie(created.id));
  return res.status(201).json(created);
}
