"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The app still works as a normal web app when registration fails.
      });
    }
  }, []);

  return null;
}
