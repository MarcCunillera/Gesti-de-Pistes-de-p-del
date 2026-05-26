import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeContext";
import "./styles/global.css";

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// ── Registre del Service Worker (PWA) ─────────────────────────────────────────
if ("serviceWorker" in navigator) {
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
