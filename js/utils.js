export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str ?? '';
  return div.innerHTML;
}

const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];

export function formatLongDate(date = new Date()) {
  const weekday = WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleDateString('pt-BR', { month: 'long' });
  return { weekday, label: `${day} de ${month}` };
}

export const PERIODS = [
  { value: 'morning', label: 'Manhã' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'night', label: 'Noite' },
];

export function periodLabel(period) {
  return PERIODS.find((p) => p.value === period)?.label || 'Qualquer hora';
}

// ordem de exibição começando na segunda; valores seguem Date.getDay()
export const WEEK_DAYS = [
  { value: 1, short: 'S', label: 'Seg' },
  { value: 2, short: 'T', label: 'Ter' },
  { value: 3, short: 'Q', label: 'Qua' },
  { value: 4, short: 'Q', label: 'Qui' },
  { value: 5, short: 'S', label: 'Sex' },
  { value: 6, short: 'S', label: 'Sáb' },
  { value: 0, short: 'D', label: 'Dom' },
];

export function formatDays(days) {
  if (!Array.isArray(days) || days.length === 7) return 'Todos os dias';
  const set = new Set(days);
  if (set.size === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return 'Dias úteis';
  if (set.size === 2 && set.has(0) && set.has(6)) return 'Fim de semana';
  return WEEK_DAYS.filter((d) => set.has(d.value)).map((d) => d.label).join(', ');
}

export function formatShortDate(dateKey) {
  const [, m, d] = dateKey.split('-');
  return `${d}/${m}`;
}

export function isToday(dateKey) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return dateKey === `${y}-${m}-${d}`;
}

export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.remove('is-visible');
  // força reflow para reiniciar a animação em toasts consecutivos
  void el.offsetWidth;
  el.classList.add('is-visible');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove('is-visible'), 2200);
}
