import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { SHIFT_TYPES, computeHours, toDateStr, isHourlessType } from '../lib/shiftUtils';

const emptyForm = {
  date: toDateStr(new Date()),
  type: 'mattina',
  label: '',
  start: '',
  end: '',
  note: '',
};

const DEFAULT_TIMES_KEY = 'turniamo_default_times';

function getDefaultTimes(type) {
  try {
    const raw = window.localStorage.getItem(DEFAULT_TIMES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    return all[type] || null;
  } catch (err) {
    return null;
  }
}

function saveDefaultTimes(type, start, end) {
  try {
    const raw = window.localStorage.getItem(DEFAULT_TIMES_KEY);
    const all = raw ? JSON.parse(raw) : {};
    all[type] = { start, end };
    window.localStorage.setItem(DEFAULT_TIMES_KEY, JSON.stringify(all));
  } catch (err) {
    // storage non disponibile: ignora
  }
}

export default function Insert() {
  const router = useRouter();
  const editId = router.query.id ? Number(router.query.id) : null;
  const presetDate = typeof router.query.date === 'string' ? router.query.date : null;

  const [form, setForm] = useState(emptyForm);
  const [dates, setDates] = useState([presetDate || emptyForm.date]);
  const [dateToAdd, setDateToAdd] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!editId) {
      setEditing(null);
      if (presetDate) {
        setDates([presetDate]);
      }
      const saved = getDefaultTimes(emptyForm.type);
      if (saved) {
        setForm((f) => ({ ...f, start: saved.start, end: saved.end }));
      }
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

  function selectType(type) {
    setForm((f) => {
      const next = { ...f, type };
      if (!isHourlessType(type) && type !== 'custom') {
        const saved = getDefaultTimes(type);
        if (saved) {
          next.start = saved.start;
          next.end = saved.end;
        }
      }
      return next;
    });
  }

  function cancelEdit() {
    setEditing(null);
    setForm(emptyForm);
    setDates([emptyForm.date]);
    router.push('/insert');
  }

  function addDate() {
    if (!dateToAdd) return;
    setDates((prev) => (prev.includes(dateToAdd) ? prev : [...prev, dateToAdd].sort()));
    setDateToAdd('');
  }

  function removeDate(d) {
    setDates((prev) => prev.filter((x) => x !== d));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const hourless = isHourlessType(form.type);

    if (form.type === 'custom' && !form.label.trim()) {
      setError("L'etichetta è obbligatoria per i turni custom");
      return;
    }
    if (!hourless && (!form.start || !form.end)) {
      setError('Inserisci orario di inizio e fine');
      return;
    }
    if (!editing && dates.length === 0) {
      setError('Seleziona almeno un giorno');
      return;
    }

    setSubmitting(true);
    try {
      const basePayload = {
        type: form.type,
        label: form.type === 'custom' ? form.label.trim() : undefined,
        start: hourless ? '' : form.start,
        end: hourless ? '' : form.end,
        note: form.note.trim() || null,
      };

      if (!hourless && form.type !== 'custom') {
        saveDefaultTimes(form.type, form.start, form.end);
      }

      if (editing) {
        const res = await fetch(`/api/shifts/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, date: form.date }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Errore nel salvataggio');
          return;
        }
        router.push('/');
        return;
      }

      for (const d of dates) {
        const res = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...basePayload, date: d }),
        });
        if (!res.ok) {
          const data = await res.json();
          setError(`${data.error || 'Errore nel salvataggio'} (${d})`);
          return;
        }
      }

      const resetSaved = getDefaultTimes(emptyForm.type);
      setForm(resetSaved ? { ...emptyForm, start: resetSaved.start, end: resetSaved.end } : emptyForm);
      setDates([emptyForm.date]);
    } catch (err) {
      setError('Errore di rete, riprova');
    } finally {
      setSubmitting(false);
    }
  }

  const formHourless = isHourlessType(form.type);
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
          {editing ? (
            <div className="form-row">
              <label>Data</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-row">
              <label>Giorni</label>
              {dates.length > 0 && (
                <div className="date-chips">
                  {dates.map((d) => (
                    <span className="date-chip" key={d}>
                      {d}
                      <button type="button" onClick={() => removeDate(d)} aria-label={`Rimuovi ${d}`}>×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="date-add-row">
                <input
                  type="date"
                  value={dateToAdd}
                  onChange={(e) => setDateToAdd(e.target.value)}
                />
                <button type="button" className="btn-secondary" onClick={addDate}>
                  + Aggiungi giorno
                </button>
              </div>
            </div>
          )}

          <div className="form-row">
            <label>Tipo turno</label>
            <div className="type-selector">
              {SHIFT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`type-btn ${form.type === t.value ? 'active' : ''}`}
                  onClick={() => selectType(t.value)}
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

          {!formHourless && (
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
          )}

          {!formHourless && form.start && form.end && (
            <div className="duration-preview">
              Durata: {previewHours.toFixed(2)} ore{!editing && dates.length > 1 ? ` × ${dates.length} giorni` : ''}
            </div>
          )}

          {formHourless && (
            <div className="duration-preview">
              Nessun orario da registrare — non incide sul monte ore{!editing && dates.length > 1 ? ` (${dates.length} giorni)` : ''}
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
              {submitting
                ? 'Salvataggio...'
                : !editing && dates.length > 1
                  ? `Salva su ${dates.length} giorni`
                  : 'Salva turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
