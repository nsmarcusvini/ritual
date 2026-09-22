import { getActiveHabits, getDay, materializeToday, toggleCompletion, todayKey } from './storage.js';
import { escapeHTML, formatLongDate } from './utils.js';
import { openHabitSheet } from './habit-sheet.js';

export function renderToday(root) {
  const habits = getActiveHabits();
  materializeToday(habits);
  const day = getDay(todayKey());
  const entries = day ? day.entries : {};

  const rows = habits.map((h) => entries[h.id]).filter(Boolean);
  const total = rows.length;
  const done = rows.filter((r) => r.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const { weekday, label } = formatLongDate();

  root.innerHTML = `
    <section class="view view-today" aria-labelledby="today-heading">
      <header class="today-head">
        <p class="eyebrow">${escapeHTML(weekday)}</p>
        <h1 id="today-heading" class="today-date">${escapeHTML(label)}</h1>
      </header>

      <div class="progress-card ${pct === 100 ? 'is-complete' : ''}" role="group" aria-label="Progresso de hoje">
        <div class="seal" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100">
          <svg viewBox="0 0 100 100" class="seal-ring" aria-hidden="true">
            <circle class="seal-track" cx="50" cy="50" r="42" />
            <circle class="seal-fill" cx="50" cy="50" r="42" style="--pct:${pct}" />
          </svg>
          <span class="seal-pct">${pct}%</span>
        </div>
        <div class="seal-meta">
          <span class="progress-label">Seu progresso</span>
          <span class="progress-count"><strong>${done}</strong> de ${total} hábito${total === 1 ? '' : 's'}</span>
        </div>
      </div>

      ${total === 0 ? renderEmpty() : `<ul class="habit-list" id="habit-list">${habits.map((h) => renderRow(h, entries[h.id])).join('')}</ul>`}

      <button type="button" class="add-habit-link" id="today-add-habit">
        <span class="add-habit-plus" aria-hidden="true">+</span> Novo hábito
      </button>
    </section>
  `;

  root.querySelectorAll('.habit-row').forEach((row) => {
    row.addEventListener('click', () => {
      const id = row.dataset.id;
      const entry = toggleCompletion(id);
      if (!entry) return;
      row.classList.toggle('is-done', entry.done);
      row.querySelector('.habit-check').setAttribute('aria-checked', String(entry.done));
      row.classList.add('pulse');
      row.addEventListener('animationend', () => row.classList.remove('pulse'), { once: true });
      updateProgress(root);
    });
  });

  root.querySelector('#today-add-habit')?.addEventListener('click', () => {
    openHabitSheet({ onSaved: () => renderToday(root) });
  });
}

function renderRow(habit, entry) {
  const done = entry?.done;
  return `
    <li class="habit-row ${done ? 'is-done' : ''}" data-id="${habit.id}">
      <span class="habit-check" role="checkbox" aria-checked="${done ? 'true' : 'false'}" aria-label="Marcar ${escapeHTML(habit.name)} como concluído">
        <svg viewBox="0 0 24 24" class="habit-check-mark" aria-hidden="true"><path d="M4 12.5L9.5 18L20 6" /></svg>
      </span>
      <span class="habit-icon" aria-hidden="true">${escapeHTML(habit.icon)}</span>
      <span class="habit-name">${escapeHTML(habit.name)}</span>
    </li>
  `;
}

function renderEmpty() {
  return `
    <div class="empty-state">
      <p class="empty-state-title">Nenhum hábito ainda</p>
      <p class="empty-state-text">Crie seu primeiro hábito para começar a construir consistência.</p>
    </div>
  `;
}

function updateProgress(root) {
  const habits = getActiveHabits();
  const day = getDay(todayKey());
  const entries = day ? day.entries : {};
  const rows = habits.map((h) => entries[h.id]).filter(Boolean);
  const total = rows.length;
  const done = rows.filter((r) => r.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;

  root.querySelector('.progress-count').innerHTML = `<strong>${done}</strong> de ${total} hábito${total === 1 ? '' : 's'}`;
  root.querySelector('.seal-fill').style.setProperty('--pct', pct);
  root.querySelector('.seal-pct').textContent = `${pct}%`;
  root.querySelector('.seal').setAttribute('aria-valuenow', pct);
  root.querySelector('.progress-card').classList.toggle('is-complete', pct === 100);
}
