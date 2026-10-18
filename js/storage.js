// Camada de persistência — localStorage é o dado funcional do app (não é "conteúdo de site",
// é o próprio propósito: hábitos e registros diários do usuário vivem só neste dispositivo por ora.
const KEY_HABITS = 'ritual:habits';
const KEY_LOGS = 'ritual:logs';

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // armazenamento indisponível (modo privado, cota excedida) — falha silenciosa,
    // o app continua funcionando em memória para a sessão atual.
  }
}

export function todayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function uid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- hábitos ----

export function getHabits() {
  return readJSON(KEY_HABITS, []);
}

function saveHabits(list) {
  writeJSON(KEY_HABITS, list);
}

export function getActiveHabits() {
  return getHabits().filter((h) => h.active);
}

// hábitos antigos não têm `days` — valem para todos os dias
export function isScheduledOn(habit, date = new Date()) {
  return !Array.isArray(habit.days) || habit.days.includes(date.getDay());
}

export function getTodayHabits() {
  return getActiveHabits().filter((h) => isScheduledOn(h));
}

function newEntry(habit) {
  return { name: habit.name, icon: habit.icon, period: habit.period || null, done: false, completedAt: null };
}

export function addHabit({ name, icon, days, period }) {
  const habits = getHabits();
  const habit = {
    id: uid(),
    name: name.trim(),
    icon: icon || '✓',
    days: days || [0, 1, 2, 3, 4, 5, 6],
    period: period || null,
    active: true,
    createdAt: new Date().toISOString(),
  };
  habits.push(habit);
  saveHabits(habits);
  materializeToday(habits);
  return habit;
}

export function updateHabit(id, patch) {
  const habits = getHabits();
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  if (typeof patch.name === 'string') habit.name = patch.name.trim();
  if (typeof patch.icon === 'string') habit.icon = patch.icon;
  if (Array.isArray(patch.days)) habit.days = patch.days;
  if (patch.period !== undefined) habit.period = patch.period || null;
  saveHabits(habits);

  // mantém o snapshot de hoje coerente com a edição mais recente,
  // incluindo entrar/sair do checklist se os dias mudaram
  const logs = getLogs();
  const key = todayKey();
  const day = logs[key] || { entries: {} };
  const shouldShow = habit.active && isScheduledOn(habit);
  if (day.entries[id]) {
    if (shouldShow) {
      Object.assign(day.entries[id], { name: habit.name, icon: habit.icon, period: habit.period || null });
    } else {
      delete day.entries[id];
    }
  } else if (shouldShow) {
    day.entries[id] = newEntry(habit);
  }
  logs[key] = day;
  saveLogs(logs);
}

export function setHabitActive(id, active) {
  const habits = getHabits();
  const habit = habits.find((h) => h.id === id);
  if (!habit) return;
  habit.active = active;
  saveHabits(habits);

  const logs = getLogs();
  const key = todayKey();
  const day = logs[key] || { entries: {} };
  if (active) {
    if (!day.entries[id] && isScheduledOn(habit)) {
      day.entries[id] = newEntry(habit);
    }
  } else {
    delete day.entries[id];
  }
  logs[key] = day;
  saveLogs(logs);
}

export function deleteHabit(id) {
  const habits = getHabits().filter((h) => h.id !== id);
  saveHabits(habits);

  // some apenas da lista de hábitos e do checklist de hoje;
  // dias passados guardam nome/ícone no próprio registro e não são tocados.
  const logs = getLogs();
  const key = todayKey();
  const day = logs[key];
  if (day && day.entries[id]) {
    delete day.entries[id];
    saveLogs(logs);
  }
}

// ---- registros diários ----

export function getLogs() {
  return readJSON(KEY_LOGS, {});
}

function saveLogs(logs) {
  writeJSON(KEY_LOGS, logs);
}

// Garante que o dia de hoje tenha uma entrada para cada hábito ativo.
// Chamado ao abrir a tela "Hoje" e ao criar/reativar hábitos.
export function materializeToday(habitsList) {
  const habits = habitsList || getHabits();
  const logs = getLogs();
  const key = todayKey();
  const day = logs[key] || { entries: {} };
  let changed = !logs[key];

  for (const habit of habits) {
    if (habit.active && isScheduledOn(habit) && !day.entries[habit.id]) {
      day.entries[habit.id] = newEntry(habit);
      changed = true;
    }
  }

  if (changed) {
    logs[key] = day;
    saveLogs(logs);
  }
  return day;
}

export function toggleCompletion(habitId) {
  const logs = getLogs();
  const key = todayKey();
  const day = logs[key];
  if (!day || !day.entries[habitId]) return null;
  const entry = day.entries[habitId];
  entry.done = !entry.done;
  entry.completedAt = entry.done ? new Date().toISOString() : null;
  saveLogs(logs);
  return entry;
}

export function getDay(dateKey) {
  const logs = getLogs();
  return logs[dateKey] || null;
}

export function getDayStats(dateKey) {
  const day = getDay(dateKey);
  const entries = day ? Object.values(day.entries) : [];
  const total = entries.length;
  const done = entries.filter((e) => e.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  return { total, done, pct };
}

export function getHistoryDays(limit = 60) {
  const logs = getLogs();
  return Object.keys(logs)
    .sort((a, b) => (a < b ? 1 : -1))
    .slice(0, limit)
    .map((dateKey) => ({ dateKey, ...getDayStats(dateKey) }));
}

export function getCurrentStreak() {
  const logs = getLogs();
  const dates = Object.keys(logs).sort((a, b) => (a < b ? 1 : -1));
  if (!dates.length) return 0;

  const key = todayKey();
  let cursor = new Date();
  let streak = 0;

  // se hoje já existe e não está 100%, não conta ainda (mas também não quebra a sequência) —
  // só entra na contagem a partir de ontem para trás.
  const todayStats = getDayStats(key);
  if (todayStats.total > 0 && todayStats.pct === 100) {
    streak += 1;
  }
  cursor.setDate(cursor.getDate() - 1);

  while (true) {
    const dk = todayKey(cursor);
    const stats = getDayStats(dk);
    if (stats.total > 0 && stats.pct === 100) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}
