import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export default function JourneyDrawer({ stage, onClose }) {
  const Icon = stage.icon;

  const drawerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      if (drawerRef.current) drawerRef.current.style.transform = "translateX(0)";
    });
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    if (drawerRef.current) {
      drawerRef.current.style.transform = "translateX(100%)";
      setTimeout(onClose, 320);
    } else onClose();
  };

  return (
    <>
      <div onClick={handleClose} style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(10,18,12,0.75)",
        backdropFilter: "blur(4px)",
      }} />

      <div ref={drawerRef} style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(540px, 100vw)",
        zIndex: 600,
        background: "var(--color-bg-surface)",
        boxShadow: "var(--shadow-modal)",
        transform: "translateX(100%)",
        transition: "transform 0.35s cubic-bezier(0.32,0.72,0,1)",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
        fontFamily: "var(--font-body)",
      }}>
        {/* Hero */}
        <div style={{
          height: 260, position: "relative", overflow: "hidden", flexShrink: 0,
          backgroundImage: `url(${stage.image})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.72) 100%)",
          }} />
          <button onClick={handleClose} style={{
            position: "absolute", top: 16, right: 16, zIndex: 10,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.25)", borderRadius: "50%",
            width: 36, height: 36, color: "white", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
          <div style={{
            position: "absolute", top: 18, left: 20,
            fontSize: 10, fontWeight: 700, letterSpacing: "2px",
            color: "var(--color-primary)", textTransform: "uppercase",
          }}>
            {String(stage.id).padStart(2, "0")} · YOUR GOA JOURNEY
          </div>
          <div style={{ position: "absolute", bottom: 24, left: 24 }}>
            <Icon
              size={36}
              color="white"
              strokeWidth={1.8}
              style={{ marginBottom: 8 }}
            />
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(28px,5vw,36px)", fontWeight: 700,
              color: "var(--color-text-inverse)", margin: 0, letterSpacing: "-0.5px",
            }}>{stage.title}</h2>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "28px 28px 48px", flex: 1 }}>
          <p style={{
            fontFamily: "var(--font-display)",
            fontSize: 18, fontStyle: "italic",
            color: "var(--color-text-body)", lineHeight: 1.7, marginBottom: 24,
          }}>{stage.desc}</p>

          <div style={{ width: 40, height: 2, background: "var(--color-primary)", marginBottom: 28 }} />

          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "2px",
            textTransform: "uppercase", color: "var(--color-text-muted)", marginBottom: 16,
          }}>What to know</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {stage.steps.map((step, i) => (
              <div key={i} style={{
                display: "flex", gap: 14, alignItems: "flex-start",
                background: "var(--color-bg-card)", borderRadius: "var(--radius-md)", padding: "15px 18px",
                border: "1px solid rgba(26,31,28,0.07)",
                boxShadow: "var(--shadow-card)",
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                  border: "1.5px solid color-mix(in srgb, var(--color-primary) 55%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "var(--color-primary-dark)",
                }}>{i + 1}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary)", marginBottom: 3 }}>
                    {step.label}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--color-text-body)", lineHeight: 1.55 }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Ask AI */}
          <div style={{
            marginTop: 28, background: "var(--color-bg-dark)", borderRadius: "var(--radius-md)",
            padding: "18px 20px", display: "flex", gap: 14, alignItems: "center",
          }}>
            <span style={{ fontSize: 22, flexShrink: 0 }}>🌴</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-inverse)", marginBottom: 3 }}>
                More questions about {stage.title}?
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>
                Ask GoaGuide AI — your personal Goa expert.
              </div>
            </div>
            <button onClick={() => navigate("/goaguide")} style={{
              background: "var(--color-primary)", color: "var(--color-bg-dark)", border: "none",
              borderRadius: "var(--radius-sm)", padding: "8px 14px", fontSize: 12,
              fontWeight: 700, cursor: "pointer",
              fontFamily: "var(--font-body)",
              whiteSpace: "nowrap", flexShrink: 0,
            }}>Ask AI →</button>
          </div>
        </div>
      </div>
    </>
  );
}
