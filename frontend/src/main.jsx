import React from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import "./styles/global.css";

const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

// ── Registre del Service Worker (PWA) ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const reg of registrations) {
      if (reg.scope && !reg.scope.includes(location.origin)) {
        reg.unregister();
        console.log("[PWA] SW obsolet des-registrat:", reg.scope);
      }
    }
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("[PWA] Service Worker registrat:", reg.scope);

        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;

          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log(
                "[PWA] Nova versió disponible. Recarrega per actualitzar."
              );

              window.dispatchEvent(new CustomEvent("padel:sw-update"));
            }
          });
        });
      })
      .catch((err) => console.warn("[PWA] Error registrant SW:", err));
  });
}