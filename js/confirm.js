import { escapeHTML } from './utils.js';

let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement('div');
  overlayEl.className = 'confirm-overlay';
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function openConfirm({ title, message, confirmLabel = 'Confirmar', danger = false, onConfirm }) {
  const overlay = ensureOverlay();

  overlay.innerHTML = `
    <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title">
      <p id="confirm-title" class="confirm-title">${escapeHTML(title)}</p>
      <p class="confirm-message">${escapeHTML(message)}</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-ghost" id="confirm-cancel">Cancelar</button>
        <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">${escapeHTML(confirmLabel)}</button>
      </div>
    </div>
  `;

  overlay.classList.add('is-open');

  function close() {
    overlay.classList.remove('is-open');
  }

  overlay.querySelector('#confirm-cancel').addEventListener('click', close);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close();
  });
  overlay.querySelector('#confirm-ok').addEventListener('click', () => {
    close();
    onConfirm?.();
  });
}
