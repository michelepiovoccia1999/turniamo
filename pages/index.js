import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { SHIFT_TYPES, startOfWeek, endOfWeek, toDateStr } from '../lib/shiftUtils';

function currentMonthValue() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const TYPE_LABELS = Object.fromEntries(SHIFT_TYPES.map((t) => [t.value, t.label]));
const TYPE_SHORT = { mattina: 'M', pomeriggio: 'P', notte: 'N', custom: 'C' };
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function buildCalendarWeeks(monthValue) {
  const [year, monthNum] = monthValue.split('-').map(Number);
  const firstOfMonth = new Date(year, monthNum - 1, 1);
  const gridStart = startOfWeek(firstOfMonth);

  const lastOfMonth = new Date(year, monthNum, 0);
  const gridEnd = endOfWeek(lastOfMonth);

  const weeks = [];
  let cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({
        date: toDateStr(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === monthNum - 1,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

export default function Visualizza({ user }) {
  const router = useRouter();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(currentMonthValue());
  const [selectedDay, setSelectedDay] = useState(null);

  useEffect(() => {
    loadShifts();
  }, []);

  useEffect(() => {
    setSelectedDay(null);
  }, [month]);

  async function loadShifts() {
    setLoading(true);
    try {
      const res = await fetch('/api/shifts');
      if (res.ok) {
        setShifts(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Eliminare questo turno?')) return;
    await fetch(`/api/shifts/${id}`, { method: 'DELETE' });
    setShifts((prev) => prev.filter((s) => s.id !== id));
  }

  function handleEdit(id) {
    router.push(`/insert?id=${id}`);
  }

  const monthShifts = useMemo(() => {
    return shifts.filter((s) => s.date.startsWith(month));
  }, [shifts, month]);

  const monthHours = useMemo(
    () => monthShifts.reduce((sum, s) => sum + s.hours, 0),
    [monthShifts]
  );

  const weekHours = useMemo(() => {
    const now = new Date();
    const start = toDateStr(startOfWeek(now));
    const end = toDateStr(endOfWeek(now));
    return shifts
      .filter((s) => s.date >= start && s.date <= end)
      .reduce((sum, s) => sum + s.hours, 0);
  }, [shifts]);

  const hoursByType = useMemo(() => {
    const totals = {};
    SHIFT_TYPES.forEach((t) => { totals[t.value] = 0; });
    monthShifts.forEach((s) => {
      totals[s.type] = (totals[s.type] || 0) + s.hours;
    });
    return totals;
  }, [monthShifts]);

  const weeklyBreakdown = useMemo(() => {
    const map = new Map();
    monthShifts.forEach((s) => {
      const weekStart = toDateStr(startOfWeek(new Date(s.date)));
      const weekEnd = toDateStr(endOfWeek(new Date(s.date)));
      const key = weekStart;
      if (!map.has(key)) {
        map.set(key, { start: weekStart, end: weekEnd, hours: 0 });
      }
      map.get(key).hours += s.hours;
    });
    return Array.from(map.values()).sort((a, b) => a.start.localeCompare(b.start));
  }, [monthShifts]);

  const shiftsByDate = useMemo(() => {
    const map = new Map();
    monthShifts.forEach((s) => {
      if (!map.has(s.date)) map.set(s.date, []);
      map.get(s.date).push(s);
    });
    return map;
  }, [monthShifts]);

  const calendarWeeks = useMemo(() => buildCalendarWeeks(month), [month]);
  const todayStr = toDateStr(new Date());
  const selectedShifts = selectedDay ? (shiftsByDate.get(selectedDay) || []) : [];

  return (
    <div>
      <div className="page-header">
        <button className="btn-primary" onClick={() => router.push('/insert')}>
          + Nuovo turno
        </button>
      </div>

      <div className="panel">
        <h2>Turni registrati</h2>
        {loading && <div className="empty-state">Caricamento...</div>}
        {!loading && (
          <div className="calendar">
            <div className="calendar-weekdays">
              {WEEKDAY_LABELS.map((w) => (
                <div className="calendar-weekday" key={w}>{w}</div>
              ))}
            </div>
            {calendarWeeks.map((week) => (
              <div className="calendar-week" key={week[0].date}>
                {week.map((cell) => {
                  const cellShifts = shiftsByDate.get(cell.date) || [];
                  const isSelected = selectedDay === cell.date;
                  return (
                    <button
                      type="button"
                      key={cell.date}
                      className={[
                        'calendar-cell',
                        !cell.inMonth ? 'outside' : '',
                        cell.date === todayStr ? 'today' : '',
                        isSelected ? 'selected' : '',
                      ].filter(Boolean).join(' ')}
                      onClick={() => setSelectedDay(isSelected ? null : cell.date)}
                    >
                      <span className="calendar-day-num">{cell.day}</span>
                      <div className="calendar-badges">
                        {cellShifts.map((s) => (
                          <span
                            key={s.id}
                            className={`calendar-badge badge-${s.type}`}
                            title={`${TYPE_LABELS[s.type]}${s.type === 'custom' ? ` · ${s.label}` : ''}`}
                          >
                            <span className="badge-type-letter">{TYPE_SHORT[s.type]}</span>
                            <span className="badge-type-label">
                              {s.type === 'custom' ? s.label : TYPE_LABELS[s.type]}
                            </span>
                            <span>· {s.hours.toFixed(1)}h</span>
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {selectedDay && (
          <div className="day-group" style={{ marginTop: 20 }}>
            <div className="day-group-title">{selectedDay}</div>
            {selectedShifts.length === 0 && (
              <div className="empty-state">Nessun turno in questo giorno</div>
            )}
            {selectedShifts.map((s) => (
              <div className="shift-row" key={s.id}>
                <div className="shift-info">
                  <span className={`shift-type-badge badge-${s.type}`}>{TYPE_LABELS[s.type] === s.label ? s.label : `${TYPE_LABELS[s.type]} · ${s.label}`}</span>
                  <span className="shift-time">{s.start} - {s.end} ({s.hours.toFixed(2)}h)</span>
                  {s.note && <span className="shift-note">{s.note}</span>}
                </div>
                <div className="shift-actions">
                  <button onClick={() => handleEdit(s.id)}>Modifica</button>
                  <button className="delete-btn" onClick={() => handleDelete(s.id)}>Elimina</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <h2>Riepilogo</h2>
        <div className="month-picker">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        <div className="tiles">
          <div className="tile">
            <div className="tile-value">{monthHours.toFixed(2)}</div>
            <div className="tile-label">Ore nel mese</div>
          </div>
          <div className="tile">
            <div className="tile-value">{monthShifts.length}</div>
            <div className="tile-label">Turni nel mese</div>
          </div>
          <div className="tile">
            <div className="tile-value">{weekHours.toFixed(2)}</div>
            <div className="tile-label">Ore settimana corrente</div>
          </div>
        </div>

        <div className="legend">
          {SHIFT_TYPES.map((t) => (
            <div className="legend-item" key={t.value}>
              <span className={`dot dot-${t.value}`} />
              {t.label}: {hoursByType[t.value].toFixed(2)}h
            </div>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>Settimana</th>
              <th>Ore</th>
            </tr>
          </thead>
          <tbody>
            {weeklyBreakdown.length === 0 && (
              <tr>
                <td colSpan={2} className="empty-state">Nessun dato per questo mese</td>
              </tr>
            )}
            {weeklyBreakdown.map((w) => (
              <tr key={w.start}>
                <td>{w.start} — {w.end}</td>
                <td>{w.hours.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      
    </div>
  );
}
