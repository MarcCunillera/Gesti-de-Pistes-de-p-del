import { colorAvatar, iniciales } from "../utils/helpers";

const BACKEND = "http://localhost:4000";

/**
 * UserAvatar — componente compartido para mostrar avatar de usuario.
 * user: { id, nombre, avatar?, avatar_color? }
 * size: número de píxeles (por defecto 32)
 * outline: string CSS para el borde exterior (opcional)
 */
export default function UserAvatar({ user, size, outline, outlineOffset, title }) {
  var sz = size || 32;
  var src = user && user.avatar ? BACKEND + user.avatar : null;
  var bg = (user && user.avatar_color) || colorAvatar(user && user.id);
  var baseStyle = {
    width: sz, height: sz, borderRadius: "50%", flexShrink: 0, display: "block",
    outline: outline || "none", outlineOffset: outlineOffset || 2,
  };
  if (src) {
    return (
      <img
        src={src}
        alt={(user && user.nombre) || ""}
        title={title || (user && user.nombre) || ""}
        style={{ ...baseStyle, objectFit: "cover" }}
      />
    );
  }
  return (
    <div
      title={title || (user && user.nombre) || ""}
      style={{
        ...baseStyle,
        background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontSize: Math.round(sz * 0.38), fontWeight: 700,
      }}
    >
      {iniciales((user && user.nombre) || "?")}
    </div>
  );
}
