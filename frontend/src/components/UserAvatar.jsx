import { colorAvatar, iniciales } from "../utils/helpers";

const BACKEND =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:4000";

export default function UserAvatar({
  user,
  size,
  outline,
  outlineOffset,
  title,
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

  if (src) {
    return (
      <img
        src={src}
        alt={(user && user.nombre) || ""}
        title={title || (user && user.nombre) || ""}
        referrerPolicy="no-referrer"
        style={{
          ...baseStyle,
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      title={title || (user && user.nombre) || ""}
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
}