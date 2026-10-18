import { getIdeas, addIdea, toggleIdea, deleteIdea, clearDoneIdeas } from './storage.js';
import { escapeHTML, toast, formatRelativeDate } from './utils.js';
import { openConfirm } from './confirm.js';

export function renderIdeas(root, { onChange } = {}) {
  const ideas = getIdeas();
  const pending = ideas.filter((i) => !i.done);
  const done = ideas.filter((i) => i.done);

  root.innerHTML = `
    <section class="view view-ideas" aria-labelledby="ideas-heading">
      <header class="section-head">
        <p class="eyebrow">Para depois</p>
        <h1 id="ideas-heading" class="section-title">Ideias</h1>
      </header>

      <form class="idea-capture" id="idea-form" autocomplete="off">
        <input id="idea-inline-input" class="text-input" type="text" maxlength="280" placeholder="Anote uma ideia ou tarefa…" aria-label="Nova ideia" />
        <button type="submit" class="btn btn-primary idea-capture-btn" aria-label="Guardar ideia">+</button>
      </form>

      ${
        ideas.length === 0
          ? `<div class="empty-state">
              <p class="empty-state-title">Nada guardado</p>
              <p class="empty-state-text">Quando surgir algo inesperado, toque na lâmpada e anote para não esquecer.</p>
            </div>`
          : `
            ${pending.length ? `<ul class="idea-list">${pending.map(renderItem).join('')}</ul>` : '<p class="idea-all-done">Tudo resolvido por aqui.</p>'}
            ${
              done.length
                ? `<div class="idea-done-head">
                    <h2 class="period-title">Concluídas · ${done.length}</h2>
                    <button type="button" class="idea-clear" id="idea-clear">Limpar</button>
                  </div>
                  <ul class="idea-list is-done-list">${done.map(renderItem).join('')}</ul>`
                : ''
            }
          `
      }
    </section>
  `;

  const rerender = () => {
    renderIdeas(root, { onChange });
    onChange?.();
  };

  const input = root.querySelector('#idea-inline-input');
  root.querySelector('#idea-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.focus();
      return;
    }
    addIdea(text);
    rerender();
    root.querySelector('#idea-inline-input').focus();
  });

  root.querySelectorAll('.idea-item').forEach((item) => {
    const id = item.dataset.id;
    item.querySelector('.idea-toggle').addEventListener('click', () => {
      const idea = toggleIdea(id);
      if (idea) toast(idea.done ? 'Ideia concluída' : 'Ideia reaberta');
      rerender();
    });
    item.querySelector('.idea-delete').addEventListener('click', () => {
      deleteIdea(id);
      toast('Ideia excluída');
      rerender();
    });
  });

  root.querySelector('#idea-clear')?.addEventListener('click', () => {
    openConfirm({
      title: 'Limpar concluídas?',
      message:
        done.length === 1 ? '1 ideia concluída será removida.' : `${done.length} ideias concluídas serão removidas.`,
      confirmLabel: 'Limpar',
      danger: true,
      onConfirm: () => {
        clearDoneIdeas();
        toast('Concluídas removidas');
        rerender();
      },
    });
  });
}

function renderItem(idea) {
  return `
    <li class="idea-item ${idea.done ? 'is-done' : ''}" data-id="${idea.id}">
      <button type="button" class="idea-toggle" role="checkbox" aria-checked="${idea.done}">
        <span class="habit-check" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="habit-check-mark"><path d="M4 12.5L9.5 18L20 6" /></svg>
        </span>
        <span class="idea-body">
          <span class="idea-text">${escapeHTML(idea.text)}</span>
          <span class="idea-date">${escapeHTML(formatRelativeDate(idea.createdAt))}</span>
        </span>
      </button>
      <button type="button" class="idea-delete" aria-label="Excluir ideia">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
      </button>
    </li>
  `;
}
