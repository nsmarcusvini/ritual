import { addIdea } from './storage.js';
import { toast } from './utils.js';

let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'sheet-overlay';
  overlayEl.id = 'idea-overlay';
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function openIdeaSheet({ onSaved } = {}) {
  const overlay = ensureOverlay();

  overlay.innerHTML = `
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="idea-sheet-title">
      <div class="sheet-grabber" aria-hidden="true"></div>
      <h2 id="idea-sheet-title" class="sheet-title">Nova ideia</h2>
      <p class="sheet-subtitle">Anote agora, resolva depois. Fica guardado na aba Ideias.</p>

      <label class="field-label" for="idea-text-input">O que apareceu?</label>
      <textarea id="idea-text-input" class="text-input idea-textarea" rows="3" maxlength="280" placeholder="Ex: Ligar para o dentista, ideia de presente…"></textarea>

      <div class="sheet-actions">
        <button type="button" class="btn btn-ghost" id="idea-cancel">Cancelar</button>
        <button type="button" class="btn btn-primary" id="idea-save">Guardar</button>
      </div>
    </div>
  `;

  overlay.classList.add('is-open');
  const input = overlay.querySelector('#idea-text-input');
  requestAnimationFrame(() => input.focus());

  function close() {
    overlay.classList.remove('is-open');
  }

  function save() {
    const text = input.value.trim();
    if (!text) {
      input.focus();
      input.classList.add('has-error');
      return;
    }
    addIdea(text);
    toast('Ideia guardada');
    close();
    onSaved?.();
  }

  overlay.querySelector('#idea-cancel').addEventListener('click', close);
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
  overlay.querySelector('#idea-save').addEventListener('click', save);
  input.addEventListener('input', () => input.classList.remove('has-error'));
  input.addEventListener('keydown', (e) => {
    // Enter guarda; Shift+Enter quebra linha
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      save();
    }
    if (e.key === 'Escape') close();
  });
}
