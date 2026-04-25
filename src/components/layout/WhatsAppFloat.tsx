import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";
import { useSiteSettings } from "@/hooks/useCms";

export const WhatsAppFloat = () => {
  const settings = useSiteSettings();
  const number = settings?.whatsapp_number || undefined;
  const href = number
    ? `https://wa.me/${number}?text=${encodeURIComponent("Hello SLKF, I would like to connect.")}`
    : waLink("Hello SLKF, I would like to connect.");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(123_46%_34%)] text-white shadow-warm hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
    </a>
  );
};
