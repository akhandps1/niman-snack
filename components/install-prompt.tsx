"use client";

import { useState, useEffect } from "react";
import { X, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

// Extend the Window interface to include the BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsStandalone(true);
      return;
    }

    const wasDismissed = localStorage.getItem("pwaPromptDismissed") === "true";
    setHasDismissed(wasDismissed);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // If iOS and not standalone, show our custom instruction after a short delay (if not dismissed)
    if (isIosDevice && !isStandalone && !wasDismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Listen for the native prompt (Android/Desktop Chrome)
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Auto-show prompt after a short delay (if not dismissed)
      if (!wasDismissed) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Allow external triggers (like a button click in the header)
    const handleTrigger = () => {
      // Force show prompt even if previously dismissed
      setHasDismissed(false);
      setShowPrompt(true);
    };
    window.addEventListener("trigger-install-prompt", handleTrigger);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("trigger-install-prompt", handleTrigger);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setHasDismissed(true);
    localStorage.setItem("pwaPromptDismissed", "true");
  };

  if (isStandalone || !showPrompt || hasDismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4"
        >
          <div className="flex items-start gap-4">
            <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/03b4a790-cba5-4c1f-b3ee-15b711bbae1b%20-%20Copy.jpg-YiztabVgfIKTPtMbLKFUSqT9llD4U6.jpeg"
                alt="Logo"
                fill
                className="object-cover p-1"
              />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-bold text-gray-900 leading-none">Niman Snacks Bar</h3>
              <p className="text-xs text-gray-500 mt-1">
                {isIOS 
                  ? "Install our app for a better experience." 
                  : "Install our app for quick ordering!"}
              </p>
            </div>
            <button 
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 hover:bg-gray-100 rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-4">
            {isIOS ? (
              <div className="bg-orange-50 text-orange-800 text-xs rounded-xl p-3 flex flex-col gap-2 border border-orange-100">
                <p className="font-medium">To install on iPhone/iPad:</p>
                <div className="flex items-center gap-2 text-orange-900 bg-white/60 p-2 rounded-lg">
                  <span className="font-bold">1.</span> Tap the <Share className="w-4 h-4 inline mx-1 text-blue-500" /> Share button below.
                </div>
                <div className="flex items-center gap-2 text-orange-900 bg-white/60 p-2 rounded-lg">
                  <span className="font-bold">2.</span> Scroll down and tap <span className="font-semibold px-1">Add to Home Screen</span>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handleInstallClick}
                className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                Install App
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
