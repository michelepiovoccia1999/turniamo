import { useState } from 'react';
import { useRouter } from 'next/router';
import ThemeToggle from '../components/ThemeToggle';

export default function Login({ onAuthed }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Si è verificato un errore');
        return;
      }
      await onAuthed();
      router.replace('/');
    } catch (err) {
      setError('Errore di rete, riprova');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <ThemeToggle className="auth-theme-toggle" />
      <div className="auth-card">
        <h1>Turniamo</h1>
        <p className="subtitle">Gestisci i tuoi turni di lavoro</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-row">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              placeholder="username"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Attendere...' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
