import { useState, useEffect, useRef } from "react";
import { JOURNEY_STAGES } from "../../../Data/journeyStages";
import JourneyDrawer from "../JourneyDrawer/JourneyDrawer";

/* ─── JOURNEY CARD ───────────────────────────────────────────────────────────── */
function JourneyCard({ stage, isMobile, onOpen }) {
  const Icon = stage.icon;
  const cardW = isMobile ? 260 : 320;
  const cardH = isMobile ? 440 : 580;

  return (
    <div
      onClick={() => onOpen(stage)}
      className="journey-card"
      style={{
        minWidth: cardW,
        width: cardW,
        height: cardH,
        borderRadius: "var(--radius-xl)",
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        background: "var(--color-bg-card)",
        boxShadow: "var(--shadow-card-hover)",
      }}
    >
      {/* IMAGE */}
      <div
        style={{
          height: "78%",
          position: "relative",
          backgroundImage: `url(${stage.image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom,rgba(0,0,0,.08),rgba(0,0,0,.72))",
          }}
        />

        {/* TITLE */}
        <div style={{ position: "absolute", left: 30, bottom: 30, color: "white" }}>
          <Icon size={42} strokeWidth={1.8} color="white" style={{ marginBottom: 10 }} />
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(2rem,3vw,2.6rem)",
              fontFamily: "var(--font-display)",
              lineHeight: 1,
            }}
          >
            {stage.title}
          </h2>
        </div>
      </div>

      {/* FOOTER */}
      <div
        style={{
          padding: 24,
          height: "22%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: "var(--color-text-body)" }}>
          {stage.desc}
        </p>
        <div style={{ color: "var(--color-primary-dark)", fontWeight: 700, marginTop: 20, letterSpacing: 1 }}>
          EXPLORE →
        </div>
      </div>
    </div>
  );
}

/* ─── JOURNEY SECTION ────────────────────────────────────────────────────────── */
export default function JourneySection({ isMobile }) {
  const [activeStage, setActiveStage] = useState(null);

  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  // Duplicate the stages so the marquee can loop seamlessly (translateX(-50%) lands
  // exactly back on the first copy).
  const loopStages = [...JOURNEY_STAGES, ...JOURNEY_STAGES];
  const cardWidth = isMobile ? 260 : 320;
  const gap = 24;
  const trackWidth = JOURNEY_STAGES.length * (cardWidth + gap);
  // Roughly constant speed regardless of card count / breakpoint (~48px per second).
  const duration = Math.max(20, Math.round(trackWidth / 48));

  return (
    <>
      <style>{`
        @keyframes journeyMarquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-${trackWidth}px); }
        }
        .journey-track {
          animation: journeyMarquee ${duration}s linear infinite;
        }
        .journey-track:hover,
        .journey-track:focus-within {
          animation-play-state: paused;
        }
        .journey-card {
          transition: transform .35s ease, box-shadow .35s ease;
        }
        .journey-card:hover {
          transform: translateY(-10px);
          box-shadow: var(--shadow-modal);
        }
        @media (prefers-reduced-motion: reduce) {
          .journey-track {
            animation: none;
          }
        }
      `}</style>

      <section
        ref={ref}
        style={{
          background: `
            linear-gradient(
              color-mix(in srgb, var(--color-bg-surface) 96%, transparent),
              color-mix(in srgb, var(--color-bg-surface) 96%, transparent)
            ),
            url('/images/goa-paper-texture.jpg')
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
          padding: isMobile ? "80px 0" : "140px 0",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* HEADER — stays inside the readable content width */}
        <div style={{ width: "min(1500px,95%)", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 80 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "clamp(5rem,9vw,9rem)",
                fontWeight: 800,
                color: "var(--color-text-primary)",
                letterSpacing: "-5px",
                lineHeight: .9,
                marginTop: "-80px",
                fontFamily: "var(--font-display)",
              }}
            >
              YOUR GOA JOURNEY
              <br />
              
            </h1>

            <p style={{ fontSize: 28, color: "var(--color-primary-dark)", marginTop: 20, fontStyle: "italic", fontFamily: "var(--font-display)" }}>
              worth a thousand memories
            </p>
          </div>
        </div>

        {/* CARDS — full-bleed, breaks out of the container so the row runs edge to edge */}
        <div
          style={{
            width: "100vw",
            marginLeft: "calc(50% - 50vw)",
            overflow: "hidden",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(40px)",
            transition: "opacity .6s ease, transform .6s ease",
          }}
        >
          <div
            className="journey-track"
            style={{
              display: "flex",
              gap,
              width: "max-content",
              paddingBottom: 20,
            }}
          >
            {loopStages.map((stage, i) => (
              <JourneyCard
                key={`${stage.id}-${i}`}
                stage={stage}
                isMobile={isMobile}
                onOpen={setActiveStage}
              />
            ))}
          </div>
        </div>

        {/* BOTTOM MESSAGE */}
        <div style={{ width: "min(1500px,95%)", margin: "0 auto" }}>
          <div style={{ marginTop: 60, textAlign: "center" }}>
            <p
              style={{
                fontSize: 22,
                color: "var(--color-text-body)",
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                lineHeight: 1.7,
              }}
            >
              Every chapter brings you closer to the Goa you'll never forget.
            </p>
          </div>
        </div>
      </section>

      {activeStage && (
        <JourneyDrawer stage={activeStage} onClose={() => setActiveStage(null)} />
      )}
    </>
  );
}