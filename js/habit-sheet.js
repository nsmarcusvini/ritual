import { HABIT_ICONS, DEFAULT_ICON } from './icons.js';
import { addHabit, updateHabit, deleteHabit } from './storage.js';
import { escapeHTML, toast } from './utils.js';
import { openConfirm } from './confirm.js';

let overlayEl = null;

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
  const isEdit = Boolean(habit);

  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
      <div class="sheet-grabber" aria-hidden="true"></div>
      <h2 id="sheet-title" class="sheet-title">${isEdit ? 'Editar hábito' : 'Novo hábito'}</h2>

      <label class="field-label" for="habit-name-input">Nome</label>
      <input id="habit-name-input" class="text-input" type="text" maxlength="40" placeholder="Ex: Ler 20 minutos" value="${escapeHTML(habit?.name || '')}" autocomplete="off" />

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
    if (isEdit) {
      updateHabit(habit.id, { name, icon: selectedIcon });
      toast('Hábito atualizado');
    } else {
      addHabit({ name, icon: selectedIcon });
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
