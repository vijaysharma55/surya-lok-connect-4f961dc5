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
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadRolesFor(s.user.id), 0);
      } else {
        setIsAdmin(false);
        setCoordinatorDistricts([]);
      }
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        loadRolesFor(s.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
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
