const KEY = 'ritual:theme'; // 'system' | 'light' | 'dark'

export function getThemePref() {
  try {
    return localStorage.getItem(KEY) || 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref) {
  const root = document.documentElement;
  if (pref === 'system') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', pref);
  }
}

export function cycleTheme() {
  const order = ['system', 'light', 'dark'];
  const current = getThemePref();
  const next = order[(order.indexOf(current) + 1) % order.length];
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // conveniência apenas — segue em memória se storage falhar
  }
  applyTheme(next);
  return next;
}

const ICONS = {
  system:
    '<svg viewBox="0 0 24 24" class="theme-icon" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M12 3.5a8.5 8.5 0 000 17V3.5z" fill="currentColor" stroke="none" /></svg>',
  light:
    '<svg viewBox="0 0 24 24" class="theme-icon" aria-hidden="true"><circle cx="12" cy="12" r="4.5" /><path d="M12 3v2.3M12 18.7V21M21 12h-2.3M5.3 12H3M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2L5.6 5.6" /></svg>',
  dark:
    '<svg viewBox="0 0 24 24" class="theme-icon" aria-hidden="true"><path d="M20.5 14.6A8.5 8.5 0 119.4 3.5a7 7 0 0011.1 11.1z" /></svg>',
};

export function themeIcon(pref) {
  return ICONS[pref] || ICONS.system;
}
