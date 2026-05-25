import { useState } from "react";

export default function Nav({ navItems, vista, setVista, t }) {
  const bg       = t?.navBg    || "#fff";
  const border   = t?.navBorder || "#e5e7eb";
  const active   = t?.primary  || "#1a2e1a";
  const inactive = t?.textSecondary || "#6b7280";
  const hovered  = t?.text     || "#374151";

  return (
    <div style={{
      background: bg,
      borderBottom: "1px solid " + border,
      display: "flex",
      overflowX: "auto",
      padding: "0 16px",
      gap: 2,
    }}>
      {navItems.map((v) => (
        <NavItem
          key={v.id}
          v={v}
          isActive={vista === v.id}
          onClick={() => setVista(v.id)}
          active={active}
          inactive={inactive}
          hovered={hovered}
        />
      ))}
    </div>
  );
}

function NavItem({ v, isActive, onClick, active, inactive, hovered }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: "0 14px",
        height: 44,
        border: "none",
        background: "none",
        cursor: "pointer",
        fontSize: 13,
        whiteSpace: "nowrap",
        fontWeight: isActive ? 700 : 500,
        color: isActive ? active : hover ? hovered : inactive,
        borderBottom: isActive ? "2px solid " + active : "2px solid transparent",
        transition: "color 0.12s",
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
      }}
    >
      {v.label}
      {v.badge ? (
        <span style={{
          background: "#fef2f2",
          color: "#dc2626",
          border: "1px solid #fecaca",
          borderRadius: 99,
          padding: "0 6px",
          fontSize: 10,
          fontWeight: 700,
          lineHeight: "18px",
          minWidth: 18,
          textAlign: "center",
          display: "inline-block",
        }}>
          {v.badge}
        </span>
      ) : null}
    </button>
  );
}
