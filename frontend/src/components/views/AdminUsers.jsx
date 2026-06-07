import { useState } from "react";
import UserAvatar from "../UserAvatar";

const PER_PAGE = 5;

export default function AdminUsers({
  users,
  toggleActivo,
  reservas,
  onOpenUserProfile,
  session,
  cambiarRolUsuario,
  t,
}) {
  var surface = t?.surface || "#fff";
  var border = t?.border || "#e5e7eb";
  var textMain = t?.text || "#111827";
  var textMuted = t?.textSecondary || "#6b7280";
  var primary = t?.primary || "#1a2e1a";

  const [buscar, setBuscar] = useState("");
  const [pagina, setPagina] = useState(1);

  const filtrados = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
      u.email.toLowerCase().includes(buscar.toLowerCase())
  );

  const totalPags = Math.max(1, Math.ceil(filtrados.length / PER_PAGE));
  const paginaActual = Math.min(pagina, totalPags);
  const visibles = filtrados.slice(
    (paginaActual - 1) * PER_PAGE,
    paginaActual * PER_PAGE
  );

  const handleBuscar = (v) => {
    setBuscar(v);
    setPagina(1);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            color: textMain,
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 800,
          }}
        >
          Gestión de Usuarios
        </h2>

        <p style={{ margin: 0, color: textMuted, fontSize: 13 }}>
          {users.length} usuario{users.length !== 1 ? "s" : ""} registrado
          {users.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <input
          placeholder="Buscar por nombre o email..."
          value={buscar}
          onChange={(e) => handleBuscar(e.target.value)}
          style={{
            flex: 1,
            padding: "9px 14px",
            border: `1.5px solid ${border}`,
            borderRadius: 8,
            fontSize: 13,
            outline: "none",
          }}
        />

        <span style={{ fontSize: 12, color: textMuted, whiteSpace: "nowrap" }}>
          {filtrados.length} usuario{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {visibles.length === 0 ? (
        <div
          style={{
            background: surface,
            borderRadius: 10,
            padding: 24,
            textAlign: "center",
            color: textMuted,
            fontSize: 13,
          }}
        >
          No se encontraron usuarios para "{buscar}"
        </div>
      ) : (
        visibles.map((u) => (
          <div
            key={u.id}
            onClick={() => {
              if (onOpenUserProfile) onOpenUserProfile(u);
            }}
            style={{
              background: surface,
              borderRadius: 12,
              padding: "14px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 14,
              boxShadow: "0 1px 4px rgba(0,0,0,.07)",
              marginBottom: 8,
              border: `1px solid ${border}`,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <UserAvatar user={u} size={40} />

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: textMain,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    flexWrap: "wrap",
                  }}
                >
                  <span>{u.nombre}</span>

                  {u.rol === "admin" && (
                    <span
                      style={{
                        background: "#f39c12",
                        color: "#fff",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                      }}
                    >
                      ADMIN
                    </span>
                  )}

                  {u.protected_admin && (
                    <span
                      style={{
                        background: "#eef2ff",
                        color: "#3730a3",
                        borderRadius: 4,
                        padding: "1px 6px",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      PRINCIPAL
                    </span>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: textMuted,
                    marginTop: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {u.email} · Reservas:{" "}
                  {
                    reservas.filter(
                      (r) => r.userId === u.id && r.estado === "confirmada"
                    ).length
                  }
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: u.activo ? "#2d6a4f" : "#c0392b",
                  fontWeight: 700,
                }}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </span>

              {u.protected_admin && (
                <span
                  style={{
                    background: "#eef2ff",
                    color: "#3730a3",
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Admin principal
                </span>
              )}

              {!u.protected_admin && u.rol !== "admin" && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleActivo(u.id, !u.activo);
                  }}
                  style={{
                    background: u.activo ? "#fdecea" : "#e8f5e9",
                    color: u.activo ? "#c0392b" : "#2d6a4f",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {u.activo ? "Desactivar" : "Activar"}
                </button>
              )}

              {u.id !== session?.id && !u.protected_admin && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cambiarRolUsuario(
                      u,
                      u.rol === "admin" ? "usuario" : "admin"
                    );
                  }}
                  style={{
                    background: u.rol === "admin" ? "#fff7ed" : "#ecfdf5",
                    color: u.rol === "admin" ? "#c2410c" : "#047857",
                    border: "none",
                    borderRadius: 6,
                    padding: "6px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {u.rol === "admin" ? "Quitar admin" : "Hacer admin"}
                </button>
              )}
            </div>
          </div>
        ))
      )}

      {totalPags > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            marginTop: 12,
          }}
        >
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={paginaActual === 1}
            style={{
              padding: "6px 12px",
              border: `1.5px solid ${border}`,
              borderRadius: 6,
              background: surface,
              cursor: paginaActual === 1 ? "default" : "pointer",
              color: paginaActual === 1 ? textMuted : textMain,
              fontSize: 13,
            }}
          >
            ‹
          </button>

          {Array.from({ length: totalPags }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPagina(n)}
              style={{
                padding: "6px 12px",
                border: `1.5px solid ${n === paginaActual ? primary : border}`,
                borderRadius: 6,
                background: n === paginaActual ? primary : surface,
                color: n === paginaActual ? "#fff" : textMain,
                cursor: "pointer",
                fontWeight: n === paginaActual ? 700 : 400,
                fontSize: 13,
              }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setPagina((p) => Math.min(totalPags, p + 1))}
            disabled={paginaActual === totalPags}
            style={{
              padding: "6px 12px",
              border: `1.5px solid ${border}`,
              borderRadius: 6,
              background: surface,
              cursor: paginaActual === totalPags ? "default" : "pointer",
              color: paginaActual === totalPags ? textMuted : textMain,
              fontSize: 13,
            }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}