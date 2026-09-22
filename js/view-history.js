import { getHistoryDays, getCurrentStreak } from './storage.js';
import { formatShortDate, isToday } from './utils.js';

export function renderHistory(root) {
  const days = getHistoryDays(60);
  const streak = getCurrentStreak();

  root.innerHTML = `
    <section class="view view-history" aria-labelledby="history-heading">
      <header class="section-head">
        <p class="eyebrow">Consistência</p>
        <h1 id="history-heading" class="section-title">Histórico</h1>
      </header>

      <div class="streak-card">
        <svg viewBox="0 0 24 24" class="streak-flame" aria-hidden="true"><path d="M12 3c1.2 2.8-1.8 4.3-1.8 7a2.8 2.8 0 105.6 0c0-1-.5-1.7-1-2.4 1 .5 2.7 2 2.7 4.6a5.5 5.5 0 11-11 0C6.5 8.3 9.2 5.6 12 3z" /></svg>
        <div>
          <p class="streak-value">${streak} ${streak === 1 ? 'dia' : 'dias'}</p>
          <p class="streak-label">Sequência atual</p>
        </div>
      </div>

      ${
        days.length === 0
          ? `<div class="empty-state">
              <p class="empty-state-title">Ainda sem histórico</p>
              <p class="empty-state-text">Volte amanhã depois de marcar seus hábitos de hoje.</p>
            </div>`
          : `<ul class="history-list">${days.map(renderDay).join('')}</ul>`
      }
    </section>
  `;
}

function renderDay(day) {
  const label = isToday(day.dateKey) ? 'Hoje' : formatShortDate(day.dateKey);
  return `
    <li class="history-row">
      <span class="history-date">${label}</span>
      <div class="history-track">
        <div class="history-fill" style="--pct:${day.pct}%"></div>
      </div>
      <span class="history-fraction">${day.done}/${day.total}</span>
      <span class="history-pct">${day.pct}%</span>
    </li>
  `;
}
