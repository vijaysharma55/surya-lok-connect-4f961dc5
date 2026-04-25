import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, IndianRupee, Upload, ShieldCheck, UserPlus } from "lucide-react";

type Loc = { id: string; name: string; type: "district" | "block" | "panchayat"; parent_id: string | null };

const POSTS = ["District Coordinator", "Block Coordinator", "Panchayat Coordinator"] as const;

const schema = z.object({
  full_name: z.string().trim().min(2, "Name is too short").max(120),
  mobile: z.string().trim().min(10, "Enter a valid 10-digit mobile").max(20).regex(/^[0-9+\-\s()]+$/, "Invalid characters"),
  aadhaar: z.string().trim().regex(/^\d{12}$/, "Aadhaar must be 12 digits"),
  email: z.string().trim().email("Invalid email").max(254).optional().or(z.literal("")),
  district: z.string().min(1, "Select a district"),
  block: z.string().min(1, "Select a block"),
  panchayat: z.string().min(1, "Select a panchayat"),
  post: z.enum(POSTS),
  transaction_id: z.string().trim().min(3, "Enter the transaction ID").max(80),
});

type FormState = z.infer<typeof schema>;

const initial: FormState = {
  full_name: "",
  mobile: "",
  aadhaar: "",
  email: "",
  district: "",
  block: "",
  panchayat: "",
  post: "Panchayat Coordinator",
  transaction_id: "",
};

const FEE = 101;
const UPI_ID = "suryalokfoundation@upi";

async function uploadToMedia(file: File, prefix: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `applications/${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: upErr } = await supabase.storage.from("media").upload(path, file, { contentType: file.type });
  if (upErr) throw upErr;
  const { data: { publicUrl } } = supabase.storage.from("media").getPublicUrl(path);
  return publicUrl;
}

export default function Apply() {
  const nav = useNavigate();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ code: string } | null>(null);
  const [locations, setLocations] = useState<Loc[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

  useEffect(() => {
    supabase
      .from("locations")
      .select("id,name,type,parent_id")
      .order("sort_order")
      .order("name")
      .then(({ data }) => setLocations((data as Loc[]) ?? []));
  }, []);

  const districts = useMemo(() => locations.filter((l) => l.type === "district"), [locations]);
  const selectedDistrict = useMemo(() => districts.find((d) => d.name === form.district), [districts, form.district]);
  const blocks = useMemo(
    () => locations.filter((l) => l.type === "block" && l.parent_id === selectedDistrict?.id),
    [locations, selectedDistrict],
  );
  const selectedBlock = useMemo(() => blocks.find((b) => b.name === form.block), [blocks, form.block]);
  const panchayats = useMemo(
    () => locations.filter((l) => l.type === "panchayat" && l.parent_id === selectedBlock?.id),
    [locations, selectedBlock],
  );

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
    if (errors[k]) setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe: Partial<Record<keyof FormState, string>> = {};
      for (const i of parsed.error.issues) {
        const k = i.path[0] as keyof FormState;
        if (!fe[k]) fe[k] = i.message;
      }
      setErrors(fe);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (!screenshotFile) {
      toast.error("Please upload your payment screenshot.");
      return;
    }
    setSubmitting(true);
    try {
      const screenshot_url = await uploadToMedia(screenshotFile, "screenshot");
      let photo_url: string | null = null;
      if (photoFile) photo_url = await uploadToMedia(photoFile, "photo");

      const { data, error } = await supabase
        .from("applications")
        .insert({
          full_name: parsed.data.full_name,
          mobile: parsed.data.mobile,
          aadhaar: parsed.data.aadhaar,
          email: parsed.data.email || null,
          district: parsed.data.district,
          block: parsed.data.block,
          panchayat: parsed.data.panchayat,
          post: parsed.data.post,
          transaction_id: parsed.data.transaction_id,
          payment_screenshot_url: screenshot_url,
          payment_amount: FEE,
          photo_url,
        })
        .select("application_code")
        .single();

      if (error) throw error;
      setDone({ code: data!.application_code as string });
      setForm(initial);
      setPhotoFile(null);
      setScreenshotFile(null);
    } catch (err: any) {
      toast.error(err.message ?? "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Seo
        title="Become a Volunteer — SLKF"
        description="Apply to become a District, Block or Panchayat Coordinator with Surya Lok Kalyan Foundation."
        path="/apply"
      />

      <section className="gradient-warm">
        <div className="container-tight py-10 sm:py-16 text-center">
          <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-secondary bg-secondary/10 px-3 py-1 rounded-full">
            <UserPlus className="h-3.5 w-3.5" /> Volunteer Application
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-foreground">
            Become a Volunteer / Coordinator
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Join SLKF as a District, Block or Panchayat Coordinator. Application fee
            <span className="font-semibold text-foreground"> ₹{FEE}</span>. After payment, our team
            verifies and activates your Volunteer ID within 24 hours.
          </p>
        </div>
      </section>

      <section className="container-tight py-8 sm:py-12">
        <Card className="max-w-3xl mx-auto shadow-warm">
          <CardHeader>
            <CardTitle>Application form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {/* PERSONAL */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Personal information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Label htmlFor="full_name">Full name *</Label>
                    <Input id="full_name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} maxLength={120} required />
                    {errors.full_name && <p className="text-xs text-destructive mt-1">{errors.full_name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="mobile">Mobile *</Label>
                    <Input id="mobile" inputMode="tel" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} maxLength={20} placeholder="9XXXXXXXXX" required />
                    {errors.mobile && <p className="text-xs text-destructive mt-1">{errors.mobile}</p>}
                  </div>
                  <div>
                    <Label htmlFor="aadhaar">Aadhaar number *</Label>
                    <Input id="aadhaar" inputMode="numeric" value={form.aadhaar} onChange={(e) => set("aadhaar", e.target.value.replace(/\D/g, "").slice(0, 12))} maxLength={12} placeholder="12-digit Aadhaar" required />
                    {errors.aadhaar && <p className="text-xs text-destructive mt-1">{errors.aadhaar}</p>}
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} maxLength={254} placeholder="you@example.com" />
                    {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* LOCATION */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Location
                </h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <Label>District *</Label>
                    <Select value={form.district} onValueChange={(v) => { set("district", v); set("block", ""); set("panchayat", ""); }}>
                      <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                      <SelectContent>
                        {districts.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No districts yet</div>}
                        {districts.map((d) => <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {errors.district && <p className="text-xs text-destructive mt-1">{errors.district}</p>}
                  </div>
                  <div>
                    <Label>Block *</Label>
                    <Select value={form.block} onValueChange={(v) => { set("block", v); set("panchayat", ""); }} disabled={!form.district}>
                      <SelectTrigger><SelectValue placeholder={form.district ? (blocks.length ? "Select block" : "No blocks — type below") : "Select district first"} /></SelectTrigger>
                      <SelectContent>
                        {blocks.map((b) => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.district && blocks.length === 0 && (
                      <Input className="mt-2" placeholder="Type your block name" value={form.block} onChange={(e) => set("block", e.target.value)} maxLength={80} />
                    )}
                    {errors.block && <p className="text-xs text-destructive mt-1">{errors.block}</p>}
                  </div>
                  <div>
                    <Label>Panchayat *</Label>
                    <Select value={form.panchayat} onValueChange={(v) => set("panchayat", v)} disabled={!form.block}>
                      <SelectTrigger><SelectValue placeholder={form.block ? (panchayats.length ? "Select panchayat" : "No panchayats — type below") : "Select block first"} /></SelectTrigger>
                      <SelectContent>
                        {panchayats.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {form.block && panchayats.length === 0 && (
                      <Input className="mt-2" placeholder="Type your panchayat name" value={form.panchayat} onChange={(e) => set("panchayat", e.target.value)} maxLength={80} />
                    )}
                    {errors.panchayat && <p className="text-xs text-destructive mt-1">{errors.panchayat}</p>}
                  </div>
                </div>
              </div>

              {/* POST */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Post applying for *
                </h3>
                <RadioGroup value={form.post} onValueChange={(v) => set("post", v as FormState["post"])} className="grid sm:grid-cols-3 gap-3">
                  {POSTS.map((p) => (
                    <label key={p} className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition ${form.post === p ? "border-secondary ring-2 ring-secondary bg-secondary/5" : "border-border hover:border-secondary/50"}`}>
                      <RadioGroupItem value={p} id={`post-${p}`} />
                      <span className="text-sm font-medium">{p}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>

              {/* PHOTO */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Passport photo (for ID card)
                </h3>
                <FileField
                  label="Upload your photo"
                  accept="image/*"
                  file={photoFile}
                  onChange={setPhotoFile}
                  hint="JPG/PNG, under 5 MB. Used on your Volunteer ID card."
                />
              </div>

              {/* PAYMENT */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <IndianRupee className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Application fee</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">₹{FEE}</div>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Pay ₹{FEE} to UPI <span className="font-mono font-semibold text-foreground">{UPI_ID}</span> (or any
                  payment method shared with you), then upload the screenshot and enter the
                  transaction ID below.
                </p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="transaction_id">Transaction ID / UTR *</Label>
                    <Input id="transaction_id" value={form.transaction_id} onChange={(e) => set("transaction_id", e.target.value)} maxLength={80} placeholder="e.g. 4231XXXXXX12" required />
                    {errors.transaction_id && <p className="text-xs text-destructive mt-1">{errors.transaction_id}</p>}
                  </div>
                  <FileField
                    label="Payment screenshot *"
                    accept="image/*"
                    file={screenshotFile}
                    onChange={setScreenshotFile}
                    hint="Upload UPI/payment app screenshot"
                  />
                </div>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="w-full bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
              >
                {submitting ? "Submitting…" : `Submit application & ₹${FEE} payment`}
              </Button>

              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Your details are kept private and used only for verification.
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      <Dialog open={!!done} onOpenChange={(o) => { if (!o) { setDone(null); nav("/my-profile"); } }}>
        <DialogContent>
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <div className="h-14 w-14 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8" />
              </div>
            </div>
            <DialogTitle className="text-center">Application submitted</DialogTitle>
            <DialogDescription className="text-center">
              Your application has been submitted. Our team will contact you soon.
              <br />
              <span className="font-mono text-foreground mt-2 inline-block">{done?.code}</span>
              <br />
              Save your mobile + Aadhaar to check status anytime at{" "}
              <Link to="/my-profile" className="underline">My Profile</Link>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => { setDone(null); nav("/my-profile"); }}>
              Check my status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FileField({
  label, accept, file, onChange, hint,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  hint?: string;
}) {
  return (
    <div>
      <Label className="block">{label}</Label>
      <label className="mt-1 flex items-center gap-2 rounded-md border border-dashed border-border p-3 cursor-pointer hover:bg-accent transition min-h-[44px]">
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f && f.size > 5 * 1024 * 1024) {
              toast.error("File must be under 5 MB");
              return;
            }
            onChange(f ?? null);
          }}
        />
        <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm truncate">{file ? file.name : "Choose file"}</span>
      </label>
      {hint && <p className="text-[11px] text-muted-foreground mt-1">{hint}</p>}
      {file && file.type.startsWith("image/") && (
        <img src={URL.createObjectURL(file)} alt="" className="mt-2 h-24 rounded border object-cover" />
      )}
    </div>
  );
}
