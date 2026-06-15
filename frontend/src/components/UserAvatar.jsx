import { colorAvatar, iniciales } from "../utils/helpers";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const BACKEND = API_BASE.startsWith("http")
  ? API_BASE.replace(/\/api\/?$/, "")
  : "";

export default function UserAvatar({
  user,
  size,
  outline,
  outlineOffset,
  title,
  onClick,
  ariaLabel,
}) {
  var sz = size || 32;

  var src = null;

  if (user && user.avatar) {
    if (
      user.avatar.startsWith("http://") ||
      user.avatar.startsWith("https://")
    ) {
      src = user.avatar;
    } else {
      src = BACKEND + user.avatar;
    }
  }

  var bg = (user && user.avatar_color) || colorAvatar(user && user.id);

  var baseStyle = {
    width: sz,
    height: sz,
    borderRadius: "50%",
    flexShrink: 0,
    display: "block",
    outline: outline || "none",
    outlineOffset: outlineOffset || 2,
  };

  var label = title || (user && user.nombre) || "";
  var avatar = src ? (
    <img
      src={src}
      alt={(user && user.nombre) || ""}
      title={label}
      referrerPolicy="no-referrer"
      style={{
        ...baseStyle,
        objectFit: "cover",
      }}
    />
  ) : (
    <div
      title={label}
      style={{
        ...baseStyle,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: Math.round(sz * 0.38),
        fontWeight: 700,
      }}
    >
      {iniciales((user && user.nombre) || "?")}
    </div>
  );

  if (!onClick) return avatar;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || ("Ver perfil de " + ((user && user.nombre) || "usuario"))}
      title={label}
      style={{
        width: sz,
        height: sz,
        border: "none",
        borderRadius: "50%",
        background: "transparent",
        padding: 0,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        flexShrink: 0,
        lineHeight: 0,
      }}
    >
      {avatar}
    </button>
  );
}
