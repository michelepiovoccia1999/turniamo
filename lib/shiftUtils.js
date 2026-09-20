const SHIFT_TYPES = [
  { value: 'mattina', label: 'Mattina' },
  { value: 'pomeriggio', label: 'Pomeriggio' },
  { value: 'notte', label: 'Notte' },
  { value: 'smonto', label: 'Smonto' },
  { value: 'riposo', label: 'Riposo' },
  { value: 'custom', label: 'Custom' },
];

const NO_HOURS_TYPES = ['smonto', 'riposo'];

function isHourlessType(type) {
  return NO_HOURS_TYPES.includes(type);
}

function computeHours(start, end) {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  if ([sh, sm, eh, em].some((v) => Number.isNaN(v))) return 0;
  let diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) diff += 24 * 60;
  return diff / 60;
}

function startOfWeek(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // 0 = lunedì
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeek(date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function toDateStr(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function weekNumberOfMonth(dateStr) {
  const d = new Date(dateStr);
  return toDateStr(startOfWeek(d));
}

module.exports = {
  SHIFT_TYPES,
  NO_HOURS_TYPES,
  isHourlessType,
  computeHours,
  startOfWeek,
  endOfWeek,
  toDateStr,
  weekNumberOfMonth,
};
