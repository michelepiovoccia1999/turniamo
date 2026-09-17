const bcrypt = require('bcryptjs');
const db = require('../../../lib/db');
const { createSessionCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { username, password, name } = req.body || {};

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password e nome sono obbligatori' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ error: 'La password deve avere almeno 6 caratteri' });
  }

  const { data: existing } = await db
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'Username già in uso' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const { data: created, error } = await db
    .from('users')
    .insert({ username, password_hash: passwordHash, name })
    .select('id, username, name')
    .single();

  if (error) {
    return res.status(500).json({ error: 'Errore nella creazione dell\'account' });
  }

  res.setHeader('Set-Cookie', createSessionCookie(created.id));
  return res.status(201).json(created);
}
