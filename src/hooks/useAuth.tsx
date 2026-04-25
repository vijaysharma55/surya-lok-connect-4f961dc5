import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { roleDebug } from "@/lib/roleDebug";

type AuthCtx = {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  /** Districts this user is a coordinator for (empty for super admin / regular users) */
  coordinatorDistricts: string[];
  /** True if user has admin role OR any coordinator assignment */
  isStaff: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  isAdmin: false,
  coordinatorDistricts: [],
  isStaff: false,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [coordinatorDistricts, setCoordinatorDistricts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRolesFor = async (uid: string, opts?: { refreshSession?: boolean }) => {
    if (opts?.refreshSession) {
      await supabase.auth.refreshSession();
      roleDebug.emit("session-refreshed");
    }
    const [roleRes, assignRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
      supabase.from("coordinator_assignments").select("district").eq("user_id", uid),
    ]);
    const nextIsAdmin = !!roleRes.data;
    const nextDistricts = Array.from(new Set((assignRes.data ?? []).map((r: any) => r.district as string))).sort();
    roleDebug.emit("fetched", `admin=${nextIsAdmin} districts=[${nextDistricts.join(",")}]`);

    let changed = false;
    setIsAdmin((prev) => {
      if (prev === nextIsAdmin) return prev;
      changed = true;
      return nextIsAdmin;
    });
    setCoordinatorDistricts((prev) => {
      const same = prev.length === nextDistricts.length && prev.every((d, i) => d === nextDistricts[i]);
      if (same) return prev;
      changed = true;
      return nextDistricts;
    });
    // Defer to next tick so the `changed` flag is final after both setters run
    queueMicrotask(() => {
      if (changed) roleDebug.emit("applied", `admin=${nextIsAdmin}`);
      else roleDebug.emit("skipped-unchanged");
    });
  };

  useEffect(() => {
    let rolesChannel: ReturnType<typeof supabase.channel> | null = null;
    let assignChannel: ReturnType<typeof supabase.channel> | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let currentUid: string | null = null;

    // Debounced + batched reload — coalesces bursts of role events into a single
    // refreshSession + role-fetch, eliminating UI flicker on rapid updates.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let pendingNeedsSessionRefresh = false;
    let inFlight: Promise<void> | null = null;
    let rerunAfter = false;
    const DEBOUNCE_MS = 250;

    const runReload = async (uid: string) => {
      const needsRefresh = pendingNeedsSessionRefresh;
      pendingNeedsSessionRefresh = false;
      try {
        await loadRolesFor(uid, { refreshSession: needsRefresh });
      } finally {
        if (rerunAfter) {
          rerunAfter = false;
          inFlight = runReload(uid);
        } else {
          inFlight = null;
        }
      }
    };

    const scheduleReload = (opts?: { refreshSession?: boolean; immediate?: boolean; reason?: string }) => {
      if (!currentUid) return;
      if (opts?.refreshSession) pendingNeedsSessionRefresh = true;
      roleDebug.emit("scheduled", `${opts?.reason ?? "event"}${opts?.immediate ? " (immediate)" : ""}`);

      const fire = () => {
        debounceTimer = null;
        if (!currentUid) return;
        if (inFlight) {
          rerunAfter = true; // collapse further events into one extra run
          roleDebug.emit("coalesced", "queued after in-flight reload");
        } else {
          roleDebug.emit("fired");
          inFlight = runReload(currentUid);
        }
      };

      if (opts?.immediate) {
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        fire();
        return;
      }
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        roleDebug.emit("debounced", `reset ${DEBOUNCE_MS}ms`);
      }
      debounceTimer = setTimeout(fire, DEBOUNCE_MS);
    };

    const subscribeForUser = (uid: string) => {
      if (rolesChannel) supabase.removeChannel(rolesChannel);
      if (assignChannel) supabase.removeChannel(assignChannel);

      rolesChannel = supabase
        .channel(`user_roles:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${uid}` },
          () => scheduleReload({ refreshSession: true, reason: "user_roles change" })
        )
        .subscribe();

      assignChannel = supabase
        .channel(`coord_assign:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "coordinator_assignments", filter: `user_id=eq.${uid}` },
          () => scheduleReload({ reason: "coordinator_assignments change" })
        )
        .subscribe();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        currentUid = s.user.id;
        setTimeout(() => scheduleReload({ immediate: true, reason: "auth state change" }), 0);
        subscribeForUser(s.user.id);
      } else {
        currentUid = null;
        if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
        rerunAfter = false;
        pendingNeedsSessionRefresh = false;
        setIsAdmin(false);
        setCoordinatorDistricts([]);
        if (rolesChannel) { supabase.removeChannel(rolesChannel); rolesChannel = null; }
        if (assignChannel) { supabase.removeChannel(assignChannel); assignChannel = null; }
      }
    });

    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        const cur = refreshed.session ?? s;
        setSession(cur);
        setUser(cur.user ?? null);
        currentUid = cur.user!.id;
        await loadRolesFor(cur.user!.id);
        subscribeForUser(cur.user!.id);
        setLoading(false);
      } else {
        setSession(null);
        setUser(null);
        setLoading(false);
      }
    });

    // Periodic safety-net refresh (every 30s) in case realtime drops
    pollId = setInterval(() => scheduleReload(), 30000);

    // Re-check whenever the tab regains focus
    const onFocus = () => scheduleReload();
    window.addEventListener("focus", onFocus);

    return () => {
      sub.subscription.unsubscribe();
      if (rolesChannel) supabase.removeChannel(rolesChannel);
      if (assignChannel) supabase.removeChannel(assignChannel);
      if (pollId) clearInterval(pollId);
      if (debounceTimer) clearTimeout(debounceTimer);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setCoordinatorDistricts([]);
  };

  const isStaff = isAdmin || coordinatorDistricts.length > 0;

  return (
    <Ctx.Provider value={{ user, session, isAdmin, coordinatorDistricts, isStaff, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
