"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const isLocalhost = window.location.hostname === "localhost";
    const isSecure = window.location.protocol === "https:";
    if (!isLocalhost && !isSecure) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Registration can fail in private browsing or restricted environments.
    });
  }, []);

  return null;
}
