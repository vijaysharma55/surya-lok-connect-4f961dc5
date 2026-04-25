import { useState } from "react";
import { z } from "zod";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Sparkles } from "lucide-react";

const PLANS = [
  { value: "Basic", label: "Basic Membership", desc: "Volunteer access & newsletter." },
  { value: "Premium", label: "Premium Membership", desc: "All Basic + project participation & invites." },
  { value: "Lifetime", label: "Lifetime Patron", desc: "All Premium + lifetime recognition on our wall." },
];

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(120, "Name is too long"),
  email: z.string().trim().email("Invalid email").max(254).optional().or(z.literal("")),
  phone_number: z
    .string()
    .trim()
    .min(7, "Phone is too short")
    .max(20, "Phone is too long")
    .regex(/^[0-9+\-\s()]+$/, "Only digits, +, -, spaces, () allowed"),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  membership_type: z.enum(["Basic", "Premium", "Lifetime"]),
});

type FormState = z.infer<typeof schema>;

const initial: FormState = {
  full_name: "",
  email: "",
  phone_number: "",
  address: "",
  membership_type: "Basic",
};

export default function Membership() {
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof FormState, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormState;
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast.error("Please fix the errors and try again.");
      return;
    }
    setSubmitting(true);
    const payload = {
      full_name: parsed.data.full_name,
      email: parsed.data.email || null,
      phone_number: parsed.data.phone_number,
      address: parsed.data.address || null,
      membership_type: parsed.data.membership_type,
      payment_status: "pending",
    };
    const { error } = await supabase.from("memberships").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted!");
    setForm(initial);
    setDone(true);
  };

  return (
    <>
      <Seo
        title="Become a Member — SLKF"
        description="Join Surya Lok Kalyan Foundation. Choose a membership plan and partner with us on CSR, solar and community projects across Bihar."
        path="/membership"
      />

      <section className="gradient-warm">
        <div className="container-tight py-14 sm:py-20 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            <Sparkles className="h-3.5 w-3.5" /> Become a Member
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold text-foreground">
            Join the SLKF family
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Support transparent CSR, clean energy and community projects.
            Pick a plan, fill the form, and our team will reach out shortly.
          </p>
        </div>
      </section>

      <section className="container-tight py-12">
        <div className="grid lg:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <Card
              key={p.value}
              className={`cursor-pointer transition shadow-card ${
                form.membership_type === p.value
                  ? "border-secondary ring-2 ring-secondary"
                  : "hover:border-secondary/50"
              }`}
              onClick={() => set("membership_type", p.value as FormState["membership_type"])}
            >
              <CardHeader>
                <CardTitle className="text-lg">{p.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
                {form.membership_type === p.value && (
                  <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                    <CheckCircle2 className="h-4 w-4" /> Selected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8 max-w-2xl mx-auto shadow-warm">
          <CardHeader>
            <CardTitle>Membership application</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="full_name">Full name *</Label>
                <Input
                  id="full_name"
                  value={form.full_name}
                  onChange={(e) => set("full_name", e.target.value)}
                  maxLength={120}
                  required
                />
                {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone_number">Phone number *</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    inputMode="tel"
                    value={form.phone_number}
                    onChange={(e) => set("phone_number", e.target.value)}
                    maxLength={20}
                    placeholder="+91 9XXXXXXXXX"
                    required
                  />
                  {errors.phone_number && <p className="text-xs text-destructive mt-1">{errors.phone_number}</p>}
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email ?? ""}
                    onChange={(e) => set("email", e.target.value)}
                    maxLength={254}
                    placeholder="you@example.com"
                  />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  rows={2}
                  value={form.address ?? ""}
                  onChange={(e) => set("address", e.target.value)}
                  maxLength={500}
                />
                {errors.address && <p className="text-xs text-destructive mt-1">{errors.address}</p>}
              </div>

              <div>
                <Label htmlFor="membership_type">Membership plan *</Label>
                <Select
                  value={form.membership_type}
                  onValueChange={(v) => set("membership_type", v as FormState["membership_type"])}
                >
                  <SelectTrigger id="membership_type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PLANS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
              >
                {submitting ? "Submitting…" : "Submit application"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      <Dialog open={done} onOpenChange={setDone}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <DialogTitle className="text-center">Thank you!</DialogTitle>
            <DialogDescription className="text-center">
              Your application has been submitted. Our team will contact you soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setDone(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
