const bcrypt = require('bcryptjs');
const db = require('../../../lib/db');
const { createSessionCookie } = require('../../../lib/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Metodo non consentito' });
  }

  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username e password sono obbligatori' });
  }

  const { data: user } = await db
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenziali non valide' });
  }

  res.setHeader('Set-Cookie', createSessionCookie(user.id));
  return res.status(200).json({ id: user.id, username: user.username, name: user.name });
}
