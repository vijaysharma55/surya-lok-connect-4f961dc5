import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { SITE, waLink } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name")
    .max(80, "Name too long"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  service: z.enum(["CSR", "Solar", "Property", "Other"], {
    message: "Please select a service",
  }),
  message: z
    .string()
    .trim()
    .min(5, "Please add a short message")
    .max(800, "Message too long"),
});

type FormData = z.infer<typeof schema>;

export const ContactForm = () => {
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", service: undefined, message: "" },
  });

  const onSubmit = async (data: FormData) => {
    // 1. Save lead (best-effort; do not block WhatsApp on failure)
    const { error } = await supabase.from("leads").insert({
      name: data.name,
      phone: `+91${data.phone}`,
      service: data.service,
      message: data.message,
      source: "website",
    });
    if (error) {
      console.error("Lead save failed", error);
    }
    // 2. Open WhatsApp with prefilled text
    const text = `Hello ${SITE.shortName},

Name: ${data.name}
Phone: +91 ${data.phone}
Interested in: ${data.service}

${data.message}`;
    window.open(waLink(text), "_blank", "noopener");
    toast({
      title: "Thank you! Opening WhatsApp…",
      description: "Your enquiry has been recorded. Send the message to complete it.",
    });
    form.reset();
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = form;

  const service = watch("service");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 bg-card rounded-2xl p-6 sm:p-8 border border-border shadow-card"
      noValidate
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" placeholder="Your name" autoComplete="name" {...register("name")} />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            inputMode="numeric"
            placeholder="10-digit mobile"
            autoComplete="tel"
            {...register("phone")}
          />
          {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="service">Service interest</Label>
        <Select
          value={service}
          onValueChange={(v) => setValue("service", v as FormData["service"], { shouldValidate: true })}
        >
          <SelectTrigger id="service">
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CSR">CSR Project Management</SelectItem>
            <SelectItem value="Solar">Solar Energy Solutions</SelectItem>
            <SelectItem value="Property">Property Buy & Sell</SelectItem>
            <SelectItem value="Other">Other / General Enquiry</SelectItem>
          </SelectContent>
        </Select>
        {errors.service && <p className="text-xs text-destructive">{errors.service.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">Message</Label>
        <Textarea
          id="message"
          rows={4}
          placeholder="Tell us briefly what you're looking for…"
          {...register("message")}
        />
        {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
      </div>

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting}
        className="w-full bg-secondary text-secondary-foreground hover:bg-[hsl(var(--secondary-hover))]"
      >
        <Send className="h-4 w-4" /> Send via WhatsApp
      </Button>
      <p className="text-xs text-muted-foreground text-center">
        Your message opens in WhatsApp and is sent to {SITE.phones[0]}.
      </p>
    </form>
  );
};
