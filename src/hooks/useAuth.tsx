import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

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

  const loadRolesFor = async (uid: string) => {
    const [roleRes, assignRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
      supabase.from("coordinator_assignments").select("district").eq("user_id", uid),
    ]);
    setIsAdmin(!!roleRes.data);
    const districts = Array.from(new Set((assignRes.data ?? []).map((r: any) => r.district as string)));
    setCoordinatorDistricts(districts);
  };

  useEffect(() => {
    let rolesChannel: ReturnType<typeof supabase.channel> | null = null;
    let assignChannel: ReturnType<typeof supabase.channel> | null = null;
    let pollId: ReturnType<typeof setInterval> | null = null;
    let currentUid: string | null = null;

    const subscribeForUser = (uid: string) => {
      // Tear down any prior subscriptions
      if (rolesChannel) supabase.removeChannel(rolesChannel);
      if (assignChannel) supabase.removeChannel(assignChannel);

      rolesChannel = supabase
        .channel(`user_roles:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${uid}` },
          async () => {
            await supabase.auth.refreshSession();
            loadRolesFor(uid);
          }
        )
        .subscribe();

      assignChannel = supabase
        .channel(`coord_assign:${uid}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "coordinator_assignments", filter: `user_id=eq.${uid}` },
          () => loadRolesFor(uid)
        )
        .subscribe();
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        currentUid = s.user.id;
        setTimeout(() => loadRolesFor(s.user.id), 0);
        subscribeForUser(s.user.id);
      } else {
        currentUid = null;
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
    pollId = setInterval(() => {
      if (currentUid) loadRolesFor(currentUid);
    }, 30000);

    // Re-check whenever the tab regains focus
    const onFocus = () => { if (currentUid) loadRolesFor(currentUid); };
    window.addEventListener("focus", onFocus);

    return () => {
      sub.subscription.unsubscribe();
      if (rolesChannel) supabase.removeChannel(rolesChannel);
      if (assignChannel) supabase.removeChannel(assignChannel);
      if (pollId) clearInterval(pollId);
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
