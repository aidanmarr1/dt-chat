const SETTINGS_KEYS = [
  "dt-theme", "dt-accent", "dt-density", "dt-font-size", "dt-bubble-style",
  "dt-time-format", "dt-enter-to-send", "dt-reduce-motion",
  "dt-sound", "dt-notifications",
  "dt-read-receipts", "dt-show-typing", "dt-show-online",
];

// Deduplicated fetch — all components share the same single request
let fetchPromise: Promise<Record<string, string>> | null = null;

export function fetchSettings(): Promise<Record<string, string>> {
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch("/api/settings")
    .then(res => res.ok ? res.json() : null)
    .then(data => {
      const settings = (data?.settings ?? {}) as Record<string, string>;

      // Bootstrap: if DB is empty, push existing localStorage settings to DB
      if (typeof window !== "undefined" && Object.keys(settings).length === 0) {
        const bootstrap: Record<string, string> = {};
        for (const key of SETTINGS_KEYS) {
          const val = localStorage.getItem(key);
          if (val !== null) bootstrap[key] = val;
        }
        if (Object.keys(bootstrap).length > 0) {
          fetch("/api/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(bootstrap),
          }).catch(() => {});
        }
      }

      return settings;
    })
    .catch(() => ({} as Record<string, string>));

  return fetchPromise;
}

// Debounced batch save — rapid changes are batched into a single PATCH
let pendingUpdates: Record<string, string | null> = {};
let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveSetting(key: string, value: string | null) {
  pendingUpdates[key] = value;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSettings, 300);
}

function flushSettings() {
  const updates = { ...pendingUpdates };
  pendingUpdates = {};
  saveTimer = null;

  fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
    keepalive: true,
  }).catch(() => {});
}

// Flush pending changes before page unload so nothing is lost
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (Object.keys(pendingUpdates).length > 0) {
      flushSettings();
    }
  });
}

// Clear all settings from DB (used by "clear local data")
export function clearDbSettings() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    pendingUpdates = {};
    saveTimer = null;
  }
  fetchPromise = null;

  const nullSettings: Record<string, null> = {};
  for (const key of SETTINGS_KEYS) {
    nullSettings[key] = null;
  }

  fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nullSettings),
    keepalive: true,
  }).catch(() => {});
}
