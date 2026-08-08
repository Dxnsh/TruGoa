export default function JourneyFooter() {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
      }}
    >
      <img
        src="/images/journey/final-sunset.jpg"
        alt=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.85))",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          color: "white",
          padding: "40px",
        }}
      >
        <div
          style={{
            color: "#C8973A",
            letterSpacing: 6,
            marginBottom: 24,
          }}
        >
          THANK YOU
        </div>

        <h2
          style={{
            fontSize: "clamp(3rem,7vw,5rem)",
            fontFamily: "Playfair Display",
            maxWidth: 900,
            margin: 0,
          }}
        >
          Thank you for letting TruGoa be a part of your Goa
          story.
        </h2>

        <p
          style={{
            marginTop: 32,
            maxWidth: 700,
            lineHeight: 1.9,
            color: "#E5E7EB",
            fontSize: 18,
          }}
        >
          Some journeys are measured in miles. Others are
          measured in memories.
        </p>

        <button
          style={{
            marginTop: 50,
            padding: "18px 42px",
            borderRadius: 999,
            border: "none",
            background: "#C8973A",
            color: "#111827",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          Explore More Goa
        </button>

        <p
          style={{
            marginTop: 50,
            opacity: 0.8,
            fontStyle: "italic",
          }}
        >
          "Every sunset in Goa is an invitation to return."
        </p>
      </div>
    </section>
  );
}