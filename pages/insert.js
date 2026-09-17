import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SHIFT_TYPES, computeHours, toDateStr } from '../lib/shiftUtils';

const emptyForm = {
  date: toDateStr(new Date()),
  type: 'mattina',
  label: '',
  start: '',
  end: '',
  note: '',
};

export default function Insert() {
  const router = useRouter();
  const editId = router.query.id ? Number(router.query.id) : null;

  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editId) {
      setEditing(null);
      return;
    }
    fetch('/api/shifts')
      .then((r) => r.json())
      .then((shifts) => {
        const shift = shifts.find((s) => s.id === editId);
        if (shift) {
          setEditing(shift);
          setForm({
            date: shift.date,
            type: shift.type,
            label: shift.type === 'custom' ? shift.label : '',
            start: shift.start,
            end: shift.end,
            note: shift.note || '',
          });
        }
      });
  }, [editId]);

  function updateField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
    router.push('/insert');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.type === 'custom' && !form.label.trim()) {
      setError("L'etichetta è obbligatoria per i turni custom");
      return;
    }
    if (!form.start || !form.end) {
      setError('Inserisci orario di inizio e fine');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        type: form.type,
        label: form.type === 'custom' ? form.label.trim() : undefined,
        start: form.start,
        end: form.end,
        note: form.note.trim() || null,
      };

      const url = editing ? `/api/shifts/${editing.id}` : '/api/shifts';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Errore nel salvataggio');
        return;
      }

      if (editing) {
        router.push('/');
      } else {
        setForm(emptyForm);
      }
    } catch (err) {
      setError('Errore di rete, riprova');
    } finally {
      setSubmitting(false);
    }
  }

  const previewHours = computeHours(form.start, form.end);

  return (
    <div>
      <div className="page-header">
        <h1>{editing ? 'Modifica turno' : 'Inserisci turno'}</h1>
      </div>

      {editing && (
        <div className="edit-banner">
          <span>Modifica in corso: turno del {editing.date}</span>
          <button type="button" onClick={cancelEdit}>Annulla</button>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}

      <div className="panel">
        <form className="form-grid" onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Data</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => updateField('date', e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <label>Tipo turno</label>
            <div className="type-selector">
              {SHIFT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-btn ${form.type === t.value ? 'active' : ''}`}
                  onClick={() => updateField('type', t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {form.type === 'custom' && (
            <div className="form-row">
              <label>Etichetta</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => updateField('label', e.target.value)}
                placeholder="Nome del turno"
                required
              />
            </div>
          )}

          <div className="time-row">
            <div className="form-row">
              <label>Orario inizio</label>
              <input
                type="time"
                value={form.start}
                onChange={(e) => updateField('start', e.target.value)}
                required
              />
            </div>
            <div className="form-row">
              <label>Orario fine</label>
              <input
                type="time"
                value={form.end}
                onChange={(e) => updateField('end', e.target.value)}
                required
              />
            </div>
          </div>

          {form.start && form.end && (
            <div className="duration-preview">
              Durata: {previewHours.toFixed(2)} ore
            </div>
          )}

          <div className="form-row">
            <label>Nota (facoltativa)</label>
            <textarea
              value={form.note}
              onChange={(e) => updateField('note', e.target.value)}
              rows={3}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Salvataggio...' : 'Salva turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
