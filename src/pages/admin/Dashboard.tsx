import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserCheck, AlertCircle, IndianRupee, Inbox } from "lucide-react";
import { Link } from "react-router-dom";

type Stats = { members: number; volunteers: number; pending: number; revenue: number; leads: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ members: 0, volunteers: 0, pending: 0, revenue: 0, leads: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [m, v, p, rev, l, r] = await Promise.all([
        supabase.from("memberships").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("applications").select("amount_paid").eq("status", "active"),
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("applications").select("id,full_name,mobile,post,district,status,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      const revenue = (rev.data ?? []).reduce((s: number, x: any) => s + Number(x.amount_paid ?? 0), 0);
      setStats({
        members: m.count ?? 0,
        volunteers: v.count ?? 0,
        pending: p.count ?? 0,
        revenue,
        leads: l.count ?? 0,
      });
      setRecent(r.data ?? []);
    })();
  }, []);

  const cards = [
    { label: "Total Members", value: stats.members, icon: Users, to: "/admin/members", color: "text-blue-600" },
    { label: "Total Volunteers", value: stats.volunteers, icon: UserCheck, to: "/admin/applications", color: "text-green-600" },
    { label: "Pending Payments", value: stats.pending, icon: AlertCircle, to: "/admin/applications", color: "text-amber-600" },
    { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString("en-IN")}`, icon: IndianRupee, to: "/admin/applications", color: "text-emerald-600" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground">{c.label}</div>
                  <div className="text-2xl font-bold">{c.value}</div>
                </div>
                <c.icon className={`h-8 w-8 ${c.color}`} />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Inbox className="h-4 w-4" /> Recent applications</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No applications yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between text-sm gap-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.full_name}</div>
                    <div className="text-xs text-muted-foreground truncate">{r.post} · {r.district} · {r.mobile}</div>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleDateString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
