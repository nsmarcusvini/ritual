import { renderToday } from './view-today.js';
import { renderHabits } from './view-habits.js';
import { renderHistory } from './view-history.js';
import { applyTheme, getThemePref, cycleTheme, themeIcon } from './theme.js';

const ROUTES = {
  today: { render: renderToday, label: 'Hoje' },
  habits: { render: renderHabits, label: 'Hábitos' },
  history: { render: renderHistory, label: 'Histórico' },
};

const viewRoot = document.getElementById('view-root');
const navButtons = document.querySelectorAll('.bottom-nav [data-route]');
const themeBtn = document.getElementById('theme-toggle');

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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {
      // registro falhou (ex: arquivo servido fora de HTTPS/localhost) — app segue funcionando online
    });
  });
}
