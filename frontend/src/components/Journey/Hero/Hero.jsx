import { useRef } from "react";

export default function Hero({ isMobile }) {

  const scrollToJourney = () => {
    document
      .getElementById("chapter-1")
      ?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
  };

  return (
    <section
      style={{
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >

      {/* Background */}

      <img
        src="/images/journey/goa-hero.jpg"
        alt="Goa"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scale(1.08)",
        }}
      />

      {/* Overlay */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.25), rgba(0,0,0,.72))",
        }}
      />

      {/* Hero Content */}

      <div
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 900,
          textAlign: "center",
          padding: "0 24px",
          color: "white",
        }}
      >
        {/* Small Label */}

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
          }}
        >
          <span
            style={{
              width: 42,
              height: 2,
              background: "#C8973A",
            }}
          />

          <span
            style={{
              fontSize: 12,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#C8973A",
              fontWeight: 700,
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            TruGoa Editorial
          </span>
        </div>

        {/* Heading */}

        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isMobile ? 52 : 90,
            lineHeight: 1,
            margin: 0,
            fontWeight: 700,
          }}
        >
          Your Goa
          <br />
          Journey
        </h1>

        {/* Paragraph */}

        <p
          style={{
            maxWidth: 700,
            margin: "34px auto",
            lineHeight: 1.9,
            fontSize: isMobile ? 17 : 20,
            color: "rgba(255,255,255,.85)",
            fontFamily: "'Instrument Sans', sans-serif",
          }}
        >
          From the moment you arrive in Goa until the day you
          return home, we'll guide you through every step of
          your journey—helping you discover where to go, what
          to experience, and how to make every moment
          unforgettable.
        </p>

        {/* CTA */}

        <button
          onClick={scrollToJourney}
          style={{
            border: "none",
            background: "#C8973A",
            color: "white",
            padding: "18px 42px",
            borderRadius: 999,
            cursor: "pointer",
            fontWeight: 600,
            fontSize: 15,
            transition: ".35s",
            fontFamily: "'Instrument Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          Begin Your Journey →
        </button>

        {/* Scroll */}

        <div
          style={{
            marginTop: 80,
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: "2px",
              textTransform: "uppercase",
              opacity: .7,
              marginBottom: 14,
              fontFamily: "'Instrument Sans', sans-serif",
            }}
          >
            Scroll to Begin
          </div>

          <div
            style={{
              fontSize: 28,
            }}
          >
            ↓
          </div>
        </div>

      </div>

    </section>
  );
}