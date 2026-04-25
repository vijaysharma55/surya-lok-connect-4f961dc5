import { useEffect, useMemo, useState } from "react";
import { Download, Share, Plus, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_KEY = "slkf_install_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type Platform = "ios-safari" | "android-firefox" | "desktop-safari" | "other";

const detectPlatform = (): Platform => {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS reports as Mac with touch
    (navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  if (isIOS) return "ios-safari";
  if (/Firefox/.test(ua) && /Android/.test(ua)) return "android-firefox";
  if (isSafari && /Macintosh/.test(ua)) return "desktop-safari";
  return "other";
};

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
  const [showGuide, setShowGuide] = useState(false);

  const platform = useMemo(detectPlatform, []);
  // Browsers without a programmatic prompt where install is still possible via UI
  const needsManualGuide =
    platform === "ios-safari" ||
    platform === "desktop-safari" ||
    platform === "android-firefox";

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

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
      setShowGuide(false);
      localStorage.removeItem(DISMISS_KEY);
      toast.success("App installed", {
        description: "SLKF is now available from your home screen.",
      });
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || hidden) return null;
  // Show button when we have a native prompt OR we can guide a manual install
  if (!deferred && !needsManualGuide) return null;

  const handleClick = async () => {
    if (deferred) {
      try {
        await deferred.prompt();
        const choice = await deferred.userChoice;
        if (choice.outcome === "accepted") {
          toast.success("Installing app…", {
            description: "Hang tight — SLKF will appear on your home screen shortly.",
          });
        } else {
          localStorage.setItem(DISMISS_KEY, String(Date.now()));
          setHidden(true);
          toast("Install cancelled", {
            description: "You can install the app anytime from the menu.",
          });
        }
      } catch {
        toast.error("Couldn't open install prompt", {
          description: "Please try again from your browser menu.",
        });
      } finally {
        setDeferred(null);
      }
      return;
    }
    // Manual install path (iOS Safari, etc.)
    setShowGuide(true);
    toast("How to install", {
      description:
        platform === "ios-safari"
          ? "Tap the Share button, then 'Add to Home Screen'."
          : platform === "desktop-safari"
            ? "Open File menu → 'Add to Dock' to install."
            : "Open the browser menu and choose 'Install' or 'Add to Home Screen'.",
      duration: 6000,
    });
  };

  return (
    <>
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

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Install SLKF on your device</DialogTitle>
            <DialogDescription>
              {platform === "ios-safari"
                ? "Add this app to your iPhone or iPad home screen in two taps."
                : platform === "desktop-safari"
                  ? "Add this app to your Mac Dock for one-click access."
                  : "Add this app to your home screen for quick access."}
            </DialogDescription>
          </DialogHeader>

          {platform === "ios-safari" && (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  1
                </span>
                <span className="flex items-center gap-1.5">
                  Tap the <Share className="h-4 w-4 inline" aria-label="Share" /> Share button at the bottom of Safari.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  2
                </span>
                <span className="flex items-center gap-1.5">
                  Choose <Plus className="h-4 w-4 inline" aria-label="Add" />
                  <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  3
                </span>
                <span>Tap <strong>Add</strong> in the top-right.</span>
              </li>
            </ol>
          )}

          {platform === "desktop-safari" && (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                <span>Open the <strong>File</strong> menu in Safari.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                <span>Choose <strong>Add to Dock…</strong></span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                <span>Click <strong>Add</strong>.</span>
              </li>
            </ol>
          )}

          {platform === "android-firefox" && (
            <ol className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                <span className="flex items-center gap-1.5">
                  Tap the <MoreVertical className="h-4 w-4 inline" aria-label="Menu" /> menu in Firefox.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                <span>Choose <strong>Install</strong> or <strong>Add to Home screen</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                <span>Confirm by tapping <strong>Add</strong>.</span>
              </li>
            </ol>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.setItem(DISMISS_KEY, String(Date.now()));
                setShowGuide(false);
                setHidden(true);
              }}
            >
              Don't show again
            </Button>
            <Button size="sm" onClick={() => setShowGuide(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallAppButton;
