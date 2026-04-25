import { useEffect, useMemo, useState } from "react";
import { roleDebug, type RoleDebugEvent } from "@/lib/roleDebug";

const KIND_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  debounced: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  fired: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  fetched: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  "skipped-unchanged": "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  applied: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  "session-refreshed": "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  coalesced: "bg-orange-500/20 text-orange-300 border-orange-500/40",
};

const fmt = (ts: number) => {
  const d = new Date(ts);
  return `${d.toLocaleTimeString()}.${String(d.getMilliseconds()).padStart(3, "0")}`;
};

export const RoleDebugPanel = () => {
  // Hard guard: only render in dev builds
  if (!import.meta.env.DEV) return null;

  const [events, setEvents] = useState<RoleDebugEvent[]>([]);
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const unsub = roleDebug.subscribe(setEvents);
    return () => { unsub(); };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    events.forEach((e) => { c[e.kind] = (c[e.kind] ?? 0) + 1; });
    return c;
  }, [events]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-3 right-3 z-[9999] rounded-md border border-zinc-700 bg-zinc-900/90 px-2 py-1 text-xs text-zinc-200 shadow-lg backdrop-blur"
      >
        🔧 Roles
      </button>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[360px] max-w-[calc(100vw-1.5rem)] rounded-lg border border-zinc-700 bg-zinc-900/95 text-zinc-100 shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-700 px-3 py-2">
        <div className="text-xs font-semibold tracking-wide">
          Role reload debug
          <span className="ml-2 text-[10px] font-normal text-zinc-400">
            {events.length} events
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => roleDebug.clear()}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
          >
            clear
          </button>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
          >
            {collapsed ? "expand" : "collapse"}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-1.5 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="flex flex-wrap gap-1 px-3 py-2 text-[10px]">
            {Object.entries(counts).map(([k, n]) => (
              <span
                key={k}
                className={`rounded border px-1.5 py-0.5 ${KIND_COLORS[k] ?? "border-zinc-600 bg-zinc-800 text-zinc-200"}`}
              >
                {k} · {n}
              </span>
            ))}
            {events.length === 0 && (
              <span className="text-zinc-500">No events yet — trigger a role change…</span>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto px-2 pb-2 font-mono text-[10px] leading-tight">
            {[...events].reverse().map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-2 border-b border-zinc-800/60 px-1 py-1 last:border-b-0"
              >
                <span className="shrink-0 text-zinc-500">{fmt(e.ts)}</span>
                <span
                  className={`shrink-0 rounded border px-1 ${KIND_COLORS[e.kind] ?? "border-zinc-600 bg-zinc-800 text-zinc-200"}`}
                >
                  {e.kind}
                </span>
                {e.detail && <span className="text-zinc-300 break-all">{e.detail}</span>}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default RoleDebugPanel;
