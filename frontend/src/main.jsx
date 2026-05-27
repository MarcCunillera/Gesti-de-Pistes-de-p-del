import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import "./styles/global.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

// ── Registre del Service Worker (PWA) ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
  // Des-registrar qualsevol SW antic d'altres ports (p.ex. 5173) per evitar
  // que interceptin peticions i redireccionin a un port que ja no existeix
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

        // Detecta quan hi ha una nova versió disponible
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // Hi ha una nova versió instal·lada — notificar l'usuari
              console.log("[PWA] Nova versió disponible. Recarrega per actualitzar.");
              // Opcional: pots mostrar un banner aquí disparant un CustomEvent
              window.dispatchEvent(new CustomEvent("padel:sw-update"));
            }
          });
        });
      })
      .catch((err) => console.warn("[PWA] Error registrant SW:", err));
  });
}
