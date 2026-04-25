// Lightweight dev-only event bus for role-reload debugging.
// Tree-shaken in production via import.meta.env.DEV checks at call sites.

export type RoleDebugKind =
  | "scheduled"
  | "debounced"
  | "fired"
  | "fetched"
  | "skipped-unchanged"
  | "applied"
  | "session-refreshed"
  | "coalesced";

export type RoleDebugEvent = {
  id: number;
  ts: number;
  kind: RoleDebugKind;
  detail?: string;
};

type Listener = (events: RoleDebugEvent[]) => void;

const MAX = 60;
let buffer: RoleDebugEvent[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

export const roleDebug = {
  enabled: import.meta.env.DEV,
  emit(kind: RoleDebugKind, detail?: string) {
    if (!this.enabled) return;
    const ev: RoleDebugEvent = { id: nextId++, ts: Date.now(), kind, detail };
    buffer = [...buffer, ev].slice(-MAX);
    listeners.forEach((l) => l(buffer));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    l(buffer);
    return () => listeners.delete(l);
  },
  clear() {
    buffer = [];
    listeners.forEach((l) => l(buffer));
  },
};
