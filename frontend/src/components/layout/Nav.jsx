import { useState } from "react";

export default function Nav({ navItems, vista, setVista, t }) {
  const bg = t?.navBg || "#fff";
  const border = t?.navBorder || "#e5e7eb";
  const active = t?.primary || "#1a2e1a";
  const inactive = t?.textSecondary || "#6b7280";
  const hovered = t?.text || "#374151";

  return (
    <nav
      className="app-nav"
      style={{
        background: bg,
        borderBottomColor: border,
      }}
    >
      <div className="app-nav-scroll">
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
    </nav>
  );
}

function NavItem({ v, isActive, onClick, active, inactive, hovered }) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="app-nav-item"
      style={{
        color: isActive ? active : hover ? hovered : inactive,
        borderBottomColor: isActive ? active : "transparent",
        fontWeight: isActive ? 800 : 600,
      }}
    >
      <span>{v.label}</span>

      {v.badge ? (
        <span className="app-nav-badge">{v.badge}</span>
      ) : null}
    </button>
  );
}