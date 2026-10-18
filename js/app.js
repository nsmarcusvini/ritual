import { renderToday } from './view-today.js';
import { renderHabits } from './view-habits.js';
import { renderHistory } from './view-history.js';
import { renderIdeas } from './view-ideas.js';
import { openIdeaSheet } from './idea-sheet.js';
import { getPendingIdeasCount } from './storage.js';
import { toast } from './utils.js';
import { applyTheme, getThemePref, cycleTheme, themeIcon } from './theme.js';

const ROUTES = {
  today: { render: renderToday, label: 'Hoje' },
  habits: { render: renderHabits, label: 'Hábitos' },
  ideas: { render: (root) => renderIdeas(root, { onChange: updateIdeasBadge }), label: 'Ideias' },
  history: { render: renderHistory, label: 'Histórico' },
};

const viewRoot = document.getElementById('view-root');
const navButtons = document.querySelectorAll('.bottom-nav [data-route]');
const themeBtn = document.getElementById('theme-toggle');
const ideaFab = document.getElementById('idea-fab');
const ideasBadge = document.getElementById('ideas-badge');

function updateIdeasBadge() {
  const count = getPendingIdeasCount();
  ideasBadge.hidden = count === 0;
  ideasBadge.textContent = count > 99 ? '99+' : String(count);
}

ideaFab.addEventListener('click', () => {
  openIdeaSheet({
    onSaved: () => {
      updateIdeasBadge();
      if (currentRoute() === 'ideas') render();
    },
  });
});

function currentRoute() {
  const hash = location.hash.replace('#/', '');
  return ROUTES[hash] ? hash : 'today';
}

function navigate(route) {
  location.hash = `/${route}`;
}

function render() {
  const route = currentRoute();
  navButtons.forEach((btn) => {
    const active = btn.dataset.route === route;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });
  // na própria aba Ideias já há campo de captura
  ideaFab.classList.toggle('is-hidden', route === 'ideas');
  updateIdeasBadge();
  viewRoot.classList.add('is-entering');
  ROUTES[route].render(viewRoot);
  requestAnimationFrame(() => viewRoot.classList.remove('is-entering'));
  viewRoot.scrollTop = 0;
}

navButtons.forEach((btn) => {
  btn.addEventListener('click', () => navigate(btn.dataset.route));
});

window.addEventListener('hashchange', render);

themeBtn.addEventListener('click', () => {
  const next = cycleTheme();
  themeBtn.innerHTML = themeIcon(next);
  themeBtn.setAttribute('aria-label', `Tema: ${next === 'system' ? 'automático' : next === 'light' ? 'claro' : 'escuro'}`);
});

applyTheme(getThemePref());
themeBtn.innerHTML = themeIcon(getThemePref());

if (!location.hash) navigate('today');
render();

const UPDATED_FLAG = 'ritual:updated';

try {
  if (sessionStorage.getItem(UPDATED_FLAG)) {
    sessionStorage.removeItem(UPDATED_FLAG);
    toast('App atualizado');
  }
} catch {
  // sessionStorage indisponível — só perde o aviso
}

function reloadForUpdate() {
  try {
    sessionStorage.setItem(UPDATED_FLAG, '1');
  } catch {
    // segue sem o aviso
  }
  location.reload();
}

// não recarrega no meio de uma anotação: espera o app ir para segundo plano
function reloadWhenSafe() {
  const busy = document.querySelector('.sheet-overlay.is-open, .confirm-overlay.is-open');
  if (!busy || document.visibilityState === 'hidden') {
    reloadForUpdate();
    return;
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') reloadForUpdate();
  });
}

if ('serviceWorker' in navigator) {
  // sem controlador = primeira instalação; a primeira troca só "assume" a página, não é atualização
  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) {
      hadController = true;
      return;
    }
    if (reloading) return;
    reloading = true;
    reloadWhenSafe();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('sw.js', { updateViaCache: 'none' })
      .then((reg) => {
        // PWA em modo app volta do segundo plano sem navegar, então o navegador não checa sozinho
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') reg.update().catch(() => {});
        });
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
      })
      .catch(() => {
        // registro falhou (ex: arquivo servido fora de HTTPS/localhost) — app segue funcionando online
      });
  });
}
