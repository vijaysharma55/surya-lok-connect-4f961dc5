import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "slkf_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const InstallAppButton = ({
  className,
  variant = "default",
  size = "sm",
}: {
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}) => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Already installed (running standalone) — never show
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // iOS Safari
      (window.navigator as any).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    // Respect a recent dismissal
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
      setHidden(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      localStorage.removeItem(DISMISS_KEY);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || hidden || !deferred) return null;

  const handleClick = async () => {
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "dismissed") {
        localStorage.setItem(DISMISS_KEY, String(Date.now()));
        setHidden(true);
      }
    } catch {
      // No-op: prompt() can throw if called twice
    } finally {
      setDeferred(null);
    }
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={cn("gap-2", className)}
      aria-label="Install Surya Lok Kalyan Foundation app"
    >
      <Download className="h-4 w-4" />
      Install App
    </Button>
  );
};

export default InstallAppButton;
