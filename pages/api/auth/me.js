const db = require('../../../lib/db');
const { getUserIdFromReq } = require('../../../lib/auth');

export default async function handler(req, res) {
  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ error: 'Non autenticato' });
  }
  const { data: user } = await db
    .from('users')
    .select('id, username, name')
    .eq('id', userId)
    .maybeSingle();

  if (!user) {
    return res.status(401).json({ error: 'Non autenticato' });
  }
  return res.status(200).json(user);
}
