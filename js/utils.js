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
