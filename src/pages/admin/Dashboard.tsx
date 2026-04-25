import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, Wrench, FileText, Image as ImageIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Stats = { leads: number; services: number; pages: number; media: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ leads: 0, services: 0, pages: 0, media: 0 });
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [l, s, p, m, r] = await Promise.all([
        supabase.from("leads").select("*", { count: "exact", head: true }),
        supabase.from("services").select("*", { count: "exact", head: true }),
        supabase.from("pages").select("*", { count: "exact", head: true }),
        supabase.from("media").select("*", { count: "exact", head: true }),
        supabase.from("leads").select("id,name,phone,service,created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      setStats({ leads: l.count ?? 0, services: s.count ?? 0, pages: p.count ?? 0, media: m.count ?? 0 });
      setRecent(r.data ?? []);
    })();
  }, []);

  const cards = [
    { label: "Leads", value: stats.leads, icon: Inbox, to: "/admin/leads", color: "text-blue-600" },
    { label: "Services", value: stats.services, icon: Wrench, to: "/admin/services", color: "text-green-600" },
    { label: "Pages", value: stats.pages, icon: FileText, to: "/admin/pages", color: "text-amber-600" },
    { label: "Media", value: stats.media, icon: ImageIcon, to: "/admin/media", color: "text-purple-600" },
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
          <CardTitle className="text-base">Recent leads</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No leads yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map((r) => (
                <li key={r.id} className="py-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.phone} · {r.service}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
