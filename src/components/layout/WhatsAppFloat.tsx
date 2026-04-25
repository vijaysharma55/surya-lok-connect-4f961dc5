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
      className="fixed right-4 z-40 flex h-14 w-14 min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-[hsl(123_46%_34%)] text-white shadow-warm hover:scale-110 transition-transform bottom-[calc(env(safe-area-inset-bottom)+76px)] md:bottom-5 md:right-5"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
    </a>
  );
};
