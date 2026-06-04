"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "choosie-install-dismissed";
const VISIT_COUNT_KEY = "choosie-install-visit-count";
const INSTALL_REQUEST_EVENT = "choosie:install-request";
const INSTALL_AVAILABLE_EVENT = "choosie:install-available";
let installAvailable = false;

function isStandalone() {
  if (typeof window === "undefined") return false;
  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true;
}

function isIosSafari() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isSafari = /^((?!CriOS|FxiOS|EdgiOS|OPiOS).)*Safari/i.test(ua);
  return isIos && isSafari;
}

function InstallIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v11" strokeLinecap="round" />
      <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 20h14" strokeLinecap="round" />
    </svg>
  );
}

export function requestChoosieInstallPrompt() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(INSTALL_REQUEST_EVENT));
}

function ShareIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 12h8" strokeLinecap="round" />
      <path d="M12 8v8" strokeLinecap="round" />
      <path d="M12 3 7 8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="m12 3 5 5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 13v6h12v-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m6 6 12 12" strokeLinecap="round" />
      <path d="M18 6 6 18" strokeLinecap="round" />
    </svg>
  );
}

export function InstallChoosiePrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === "true") return;

    const visitCount = Number(window.localStorage.getItem(VISIT_COUNT_KEY) || "0") + 1;
    window.localStorage.setItem(VISIT_COUNT_KEY, String(visitCount));
    const canShowPrompt = visitCount >= 2;

    const ios = isIosSafari();
    if (ios) {
      setShowIosHelp(true);
      setVisible(canShowPrompt);
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      installAvailable = true;
      setInstallEvent(event as BeforeInstallPromptEvent);
      window.dispatchEvent(new Event(INSTALL_AVAILABLE_EVENT));
      if (canShowPrompt) setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
      setOpen(false);
      setInstallEvent(null);
      installAvailable = false;
      window.localStorage.setItem(DISMISSED_KEY, "true");
    }

    function onInstallRequest() {
      setOpen(true);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    window.addEventListener(INSTALL_REQUEST_EVENT, onInstallRequest);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
      window.removeEventListener(INSTALL_REQUEST_EVENT, onInstallRequest);
    };
  }, []);

  async function install() {
    if (!installEvent) {
      setOpen(true);
      return;
    }

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") {
      setVisible(false);
    }
    setInstallEvent(null);
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    setOpen(false);
  }

  if (!visible || (!installEvent && !showIosHelp)) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2">
      {open && (
        <div className="w-72 rounded-2xl border border-brand/20 bg-white p-4 text-sm text-slate-700 shadow-xl shadow-slate-900/12">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="font-semibold text-brand-dark">Add Choosie</div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close install instructions"
              title="Close"
            >
              <XIcon />
            </button>
          </div>

          {showIosHelp && !installEvent ? (
            <div className="space-y-3">
              <p className="leading-5">Install Choosie from Safari with the Share button, then Add to Home Screen.</p>
              <div className="flex items-center gap-2 rounded-xl bg-brand-light px-3 py-2 font-semibold text-brand-dark">
                <ShareIcon />
                <span>Share, then Add to Home Screen</span>
              </div>
            </div>
          ) : (
            <p className="leading-5">Add Choosie to your home screen for quick access.</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={install}
          className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:bg-brand-dark"
          aria-label="Add Choosie to your home screen"
          title="Add Choosie"
        >
          <InstallIcon />
          <span>Add Choosie</span>
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full bg-white p-2 text-slate-400 shadow-md shadow-slate-900/10 transition hover:text-slate-700"
          aria-label="Dismiss install prompt"
          title="Dismiss"
        >
          <XIcon />
        </button>
      </div>
    </div>
  );
}

export function InstallChoosieButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || window.localStorage.getItem(DISMISSED_KEY) === "true") return;
    if (installAvailable || isIosSafari()) {
      setVisible(true);
    }

    function onInstallAvailable() {
      setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
    }

    window.addEventListener(INSTALL_AVAILABLE_EVENT, onInstallAvailable);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener(INSTALL_AVAILABLE_EVENT, onInstallAvailable);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={requestChoosieInstallPrompt}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-brand/10 bg-white px-2.5 text-xs font-semibold text-brand shadow-sm transition hover:border-consensus/40 hover:text-brand-dark sm:h-9 sm:px-3"
      aria-label="Add Choosie to your home screen"
      title="Add Choosie to your home screen"
    >
      <InstallIcon />
      <span className="hidden sm:inline">Install</span>
    </button>
  );
}
