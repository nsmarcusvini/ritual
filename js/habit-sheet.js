import { HABIT_ICONS, DEFAULT_ICON } from './icons.js';
import { addHabit, updateHabit, deleteHabit } from './storage.js';
import { escapeHTML, toast, PERIODS, WEEK_DAYS, formatDays } from './utils.js';
import { openConfirm } from './confirm.js';

let overlayEl = null;

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const PERIOD_OPTIONS = [{ value: null, label: 'Qualquer' }, ...PERIODS];

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'sheet-overlay';
  overlayEl.id = 'sheet-overlay';
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function openHabitSheet({ habit = null, onSaved } = {}) {
  const overlay = ensureOverlay();
  let selectedIcon = habit?.icon || DEFAULT_ICON;
  const selectedDays = new Set(Array.isArray(habit?.days) ? habit.days : ALL_DAYS);
  let selectedPeriod = habit?.period || null;
  const isEdit = Boolean(habit);

  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="sheet-grabber" aria-hidden="true"></div>
      <h2 id="sheet-title" class="sheet-title">${isEdit ? 'Editar hábito' : 'Novo hábito'}</h2>

      <label class="field-label" for="habit-name-input">Nome</label>
      <input id="habit-name-input" class="text-input" type="text" maxlength="40" placeholder="Ex: Ler 20 minutos" value="${escapeHTML(habit?.name || '')}" autocomplete="off" />

      <p class="field-label" id="days-label">Dias</p>
      <div class="day-picker" id="day-picker" role="group" aria-labelledby="days-label">
        ${WEEK_DAYS.map(
          (d) => `
          <button type="button" class="day-option ${selectedDays.has(d.value) ? 'is-selected' : ''}" data-day="${d.value}" aria-pressed="${selectedDays.has(d.value)}" aria-label="${d.label}">${d.short}</button>
        `
        ).join('')}
      </div>
      <p class="field-hint" id="days-hint">${formatDays([...selectedDays])}</p>

      <p class="field-label" id="period-label">Período</p>
      <div class="segmented" id="period-picker" role="radiogroup" aria-labelledby="period-label">
        ${PERIOD_OPTIONS.map(
          (p) => `
          <button type="button" class="segmented-option ${p.value === selectedPeriod ? 'is-selected' : ''}" data-period="${p.value ?? ''}" role="radio" aria-checked="${p.value === selectedPeriod}">${p.label}</button>
        `
        ).join('')}
      </div>

      <p class="field-label">Ícone</p>
      <div class="icon-grid" id="icon-grid" role="radiogroup" aria-label="Escolher ícone">
        ${HABIT_ICONS.map(
          (icon) => `
          <button type="button" class="icon-option ${icon === selectedIcon ? 'is-selected' : ''}" data-icon="${icon}" role="radio" aria-checked="${icon === selectedIcon}">${icon}</button>
        `
        ).join('')}
      </div>

      <div class="sheet-actions">
        ${isEdit ? '<button type="button" class="btn btn-danger" id="sheet-delete">Excluir</button>' : ''}
        <button type="button" class="btn btn-ghost" id="sheet-cancel">Cancelar</button>
        <button type="button" class="btn btn-primary" id="sheet-save">Salvar</button>
      </div>
    </div>
  `;

  overlay.classList.add('is-open');
  const nameInput = overlay.querySelector('#habit-name-input');
  requestAnimationFrame(() => nameInput.focus());

  overlay.querySelectorAll('.icon-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.icon-option').forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-checked', 'true');
      selectedIcon = btn.dataset.icon;
    });
  });

  const daysHint = overlay.querySelector('#days-hint');
  overlay.querySelectorAll('.day-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = Number(btn.dataset.day);
      if (selectedDays.has(day)) selectedDays.delete(day);
      else selectedDays.add(day);
      const on = selectedDays.has(day);
      btn.classList.toggle('is-selected', on);
      btn.setAttribute('aria-pressed', String(on));
      daysHint.classList.remove('has-error');
      daysHint.textContent = selectedDays.size ? formatDays([...selectedDays]) : 'Escolha pelo menos um dia';
    });
  });

  overlay.querySelectorAll('.segmented-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      overlay.querySelectorAll('.segmented-option').forEach((b) => {
        b.classList.remove('is-selected');
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('is-selected');
      btn.setAttribute('aria-checked', 'true');
      selectedPeriod = btn.dataset.period || null;
    });
  });

  function close() {
    overlay.classList.remove('is-open');
  }

  overlay.querySelector('#sheet-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });

  overlay.querySelector('#sheet-save').addEventListener('click', () => {
    const name = nameInput.value.trim();
    if (!name) {
      nameInput.focus();
      nameInput.classList.add('has-error');
      return;
    }
    if (!selectedDays.size) {
      daysHint.classList.add('has-error');
      daysHint.textContent = 'Escolha pelo menos um dia';
      return;
    }
    const days = [...selectedDays].sort();
    if (isEdit) {
      updateHabit(habit.id, { name, icon: selectedIcon, days, period: selectedPeriod });
      toast('Hábito atualizado');
    } else {
      addHabit({ name, icon: selectedIcon, days, period: selectedPeriod });
      toast('Hábito criado');
    }
    close();
    onSaved?.();
  });

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') overlay.querySelector('#sheet-save').click();
  });

  const deleteBtn = overlay.querySelector('#sheet-delete');
  deleteBtn?.addEventListener('click', () => {
    close();
    openConfirm({
      title: 'Excluir hábito?',
      message: `"${habit.name}" será removido. O histórico de dias anteriores é mantido.`,
      confirmLabel: 'Excluir',
      danger: true,
      onConfirm: () => {
        deleteHabit(habit.id);
        toast('Hábito excluído');
        onSaved?.();
      },
    });
  });
}
