import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/site";

export const WhatsAppFloat = () => (
  <a
    href={waLink("Hello SLKF, I would like to connect.")}
    target="_blank"
    rel="noopener"
    aria-label="Chat on WhatsApp"
    className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(123_46%_34%)] text-white shadow-warm hover:scale-110 transition-transform"
  >
    <MessageCircle className="h-7 w-7" />
    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
  </a>
);
