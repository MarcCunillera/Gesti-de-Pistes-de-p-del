function Bloque({ w = "100%", h = 16, mb = 0 }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, background: "#e5e7eb", borderRadius: 6, marginBottom: mb }}
    />
  );
}

function TarjetaSkeleton() {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", marginBottom: 10, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: "50%", background: "#e5e7eb", flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Bloque w="55%" h={14} mb={6} />
          <Bloque w="35%" h={11} />
        </div>
      </div>
      <Bloque w="80%" h={12} mb={6} />
      <Bloque w="60%" h={12} />
    </div>
  );
}

function CalendarioSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Bloque w={160} h={24} mb={6} />
          <Bloque w={220} h={14} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="skeleton" style={{ width: 90, height: 36, background: "#e5e7eb", borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 60, height: 36, background: "#e5e7eb", borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 90, height: 36, background: "#e5e7eb", borderRadius: 8 }} />
        </div>
      </div>
      <div style={{ background: "#fff", borderRadius: 16, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.07)" }}>
        {/* Fila capçalera */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div className="skeleton" style={{ width: 50, height: 32, background: "#e5e7eb", borderRadius: 6 }} />
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="skeleton" style={{ flex: 1, height: 52, background: "#e5e7eb", borderRadius: 8 }} />
          ))}
        </div>
        {/* Files */}
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div className="skeleton" style={{ width: 50, height: 28, background: "#e5e7eb", borderRadius: 6 }} />
            {[1,2,3,4,5,6,7].map((j) => (
              <div key={j} className="skeleton" style={{ flex: 1, height: 28, background: "#f3f4f6", borderRadius: 6 }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Skeleton({ vista }) {
  if (vista === "calendario") return <CalendarioSkeleton />;
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Bloque w={180} h={26} mb={16} />
        <TarjetaSkeleton />
        <TarjetaSkeleton />
        <TarjetaSkeleton />
      </div>
    </>
  );
}
