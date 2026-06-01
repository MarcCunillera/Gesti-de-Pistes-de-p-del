function Bloc({ w = "100%", h = 16, mb = 0 }) {
  return (
    <div
      className="skeleton"
      style={{
        width: w, height: h, marginBottom: mb,
        background: "var(--color-background-secondary, #e5e7eb)",
        borderRadius: 6,
      }}
    />
  );
}

function TarjetaSkeleton() {
  return (
    <div style={{
      background: "var(--color-background-primary, #fff)",
      borderRadius: 12, padding: "18px 20px", marginBottom: 10,
      boxShadow: "0 1px 4px rgba(0,0,0,.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div className="skeleton" style={{
          width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
          background: "var(--color-background-secondary, #e5e7eb)",
        }} />
        <div style={{ flex: 1 }}>
          <Bloc w="55%" h={14} mb={6} />
          <Bloc w="35%" h={11} />
        </div>
      </div>
      <Bloc w="80%" h={12} mb={6} />
      <Bloc w="60%" h={12} />
    </div>
  );
}

function CalendariSkeleton() {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <Bloc w={160} h={24} mb={6} />
          <Bloc w={220} h={14} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {[90, 60, 90].map((w, i) => (
            <div key={i} className="skeleton" style={{
              width: w, height: 36,
              background: "var(--color-background-secondary, #e5e7eb)",
              borderRadius: 8,
            }} />
          ))}
        </div>
      </div>
      <div style={{
        background: "var(--color-background-primary, #fff)",
        borderRadius: 16, padding: 20, boxShadow: "0 1px 8px rgba(0,0,0,.07)",
      }}>
        {/* Fila capçalera */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <div className="skeleton" style={{
            width: 50, height: 32, borderRadius: 6,
            background: "var(--color-background-secondary, #e5e7eb)",
          }} />
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="skeleton" style={{
              flex: 1, height: 52, borderRadius: 8,
              background: "var(--color-background-secondary, #e5e7eb)",
            }} />
          ))}
        </div>
        {/* Files */}
        {[1,2,3,4,5].map((i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6 }}>
            <div className="skeleton" style={{
              width: 50, height: 28, borderRadius: 6,
              background: "var(--color-background-secondary, #e5e7eb)",
            }} />
            {[1,2,3,4,5,6,7].map((j) => (
              <div key={j} className="skeleton" style={{
                flex: 1, height: 28, borderRadius: 6,
                background: "var(--color-background-tertiary, #f3f4f6)",
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// vista = "calendari" → skeleton del calendari
// qualsevol altra cosa → skeleton de targetes genèric
export default function Skeleton({ vista }) {
  if (vista === "calendari") return <CalendariSkeleton />;
  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <Bloc w={180} h={26} mb={16} />
        <TarjetaSkeleton />
        <TarjetaSkeleton />
        <TarjetaSkeleton />
      </div>
    </>
  );
}