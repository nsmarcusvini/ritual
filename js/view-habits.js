import { getHabits, setHabitActive } from './storage.js';
import { escapeHTML, toast, formatDays, periodLabel } from './utils.js';
import { openHabitSheet } from './habit-sheet.js';

export function renderHabits(root) {
  const habits = getHabits().sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));

  root.innerHTML = `
    <section class="view view-habits" aria-labelledby="habits-heading">
      <header class="section-head">
        <p class="eyebrow">Gerenciar</p>
        <h1 id="habits-heading" class="section-title">Hábitos</h1>
      </header>

      ${
        habits.length === 0
          ? `<div class="empty-state">
              <p class="empty-state-title">Nenhum hábito cadastrado</p>
              <p class="empty-state-text">Adicione o primeiro hábito que você quer repetir todos os dias.</p>
            </div>`
          : `<ul class="manage-list">${habits.map(renderItem).join('')}</ul>`
      }

      <button type="button" class="btn btn-primary btn-block" id="habits-add">+ Novo hábito</button>
    </section>
  `;

  root.querySelectorAll('.manage-item').forEach((item) => {
    const id = item.dataset.id;
    const habit = habits.find((h) => h.id === id);

    item.querySelector('.manage-item-main').addEventListener('click', () => {
      openHabitSheet({ habit, onSaved: () => renderHabits(root) });
    });

    item.querySelector('.switch').addEventListener('click', (e) => {
      e.stopPropagation();
      const nextActive = !habit.active;
      setHabitActive(id, nextActive);
      toast(nextActive ? 'Hábito ativado' : 'Hábito desativado');
      renderHabits(root);
    });
  });

  root.querySelector('#habits-add').addEventListener('click', () => {
    openHabitSheet({ onSaved: () => renderHabits(root) });
  });
}

function renderItem(habit) {
  return `
    <li class="manage-item ${habit.active ? '' : 'is-inactive'}" data-id="${habit.id}">
      <button type="button" class="manage-item-main">
        <span class="habit-icon" aria-hidden="true">${escapeHTML(habit.icon)}</span>
        <span class="manage-item-name">${escapeHTML(habit.name)}</span>
        <span class="manage-item-freq">${escapeHTML(formatDays(habit.days))}${habit.period ? ` · ${periodLabel(habit.period)}` : ''}</span>
      </button>
      <button type="button" class="switch ${habit.active ? 'is-on' : ''}" role="switch" aria-checked="${habit.active}" aria-label="Ativar ou desativar ${escapeHTML(habit.name)}">
        <span class="switch-knob"></span>
      </button>
    </li>
  `;
}
