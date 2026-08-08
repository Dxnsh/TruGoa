import {
  Plane,
  Backpack,
  Camera,
  Gift,
  Ticket,
  Wallet,
} from "lucide-react";

const PACKING_CHECKLIST = [
  "Passport / ID",
  "Chargers",
  "Flight Tickets",
  "Wallet",
  "Sunglasses",
  "Souvenirs",
];

const TOURISTS_FORGET = [
  "Check flight timings",
  "Download your boarding pass",
  "Carry some cash",
  "Leave early for the airport",
  "Take one last beach photo",
];

const SOUVENIRS = [
  "Cashew Nuts",
  "Bebinca",
  "Goan Spices",
  "Handmade Crafts",
  "Feni",
];

const AIRPORT_TIPS = [
  "Reach the airport at least 2 hours early.",
  "Mopa Airport can take longer during peak season.",
  "Keep your ID easily accessible.",
  "Double-check baggage limits before leaving.",
];

export default function DepartureChapter() {
  return (
    <section
      id="chapter-7"
      style={{
        padding: "120px 0",
        background: "#FCFAF7",
      }}
    >
      <div
        style={{
          width: "min(1400px,92%)",
          margin: "0 auto",
        }}
      >
        {/* HERO */}

        <div
          style={{
            position: "relative",
            height: "70vh",
            borderRadius: 32,
            overflow: "hidden",
            marginBottom: 80,
          }}
        >
          <img
            src="/images/journey/departure.jpg"
            alt="Departure"
            style={{
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
                "linear-gradient(to bottom,rgba(0,0,0,.15),rgba(0,0,0,.75))",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: 40,
              bottom: 50,
              color: "white",
            }}
          >
            <div
              style={{
                color: "#C8973A",
                letterSpacing: 4,
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 16,
              }}
            >
              CHAPTER 07 OF 07
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Before You Leave
            </h2>

            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                opacity: 0.9,
              }}
            >
              Every journey ends. The best ones leave a part of
              themselves behind.
            </p>
          </div>
        </div>

        {/* STORY */}

        <p
          style={{
            maxWidth: 900,
            margin: "0 auto 80px",
            textAlign: "center",
            fontSize: "clamp(1.1rem,2vw,1.35rem)",
            lineHeight: 1.9,
            color: "#4A4A4A",
          }}
        >
          Your bags are packed. Your camera roll is full.
          Somewhere between your first sunset and your last
          morning, Goa stopped feeling like a destination and
          started feeling like a memory.
        </p>

        {/* GRID SECTIONS */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: 24,
            marginBottom: 80,
          }}
        >
          {/* PACKING */}

          <div
            style={{
              background: "white",
              padding: 32,
              borderRadius: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,.05)",
            }}
          >
            <Backpack
              size={40}
              color="#C8973A"
              style={{ marginBottom: 20 }}
            />

            <h3
              style={{
                fontFamily: "Playfair Display",
              }}
            >
              Packing Checklist
            </h3>

            {PACKING_CHECKLIST.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>

          {/* FORGET */}

          <div
            style={{
              background: "white",
              padding: 32,
              borderRadius: 24,
              boxShadow: "0 10px 30px rgba(0,0,0,.05)",
            }}
          >
            <Camera
              size={40}
              color="#C8973A"
              style={{ marginBottom: 20 }}
            />

            <h3
              style={{
                fontFamily: "Playfair Display",
              }}
            >
              Things Tourists Forget
            </h3>

            {TOURISTS_FORGET.map((item) => (
              <p key={item}>• {item}</p>
            ))}
          </div>
        </div>

        {/* SOUVENIRS */}

        <div
          style={{
            background: "#F5F0E8",
            padding: 60,
            borderRadius: 32,
            marginBottom: 80,
          }}
        >
          <Gift
            size={42}
            color="#C8973A"
            style={{ marginBottom: 20 }}
          />

          <h2
            style={{
              fontFamily: "Playfair Display",
              fontSize: 48,
            }}
          >
            Souvenirs Worth Taking Home
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              marginTop: 40,
            }}
          >
            {SOUVENIRS.map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* AIRPORT TIPS */}

        <div
          style={{
            background: "#FFFFFF",
            padding: 60,
            borderRadius: 32,
            marginBottom: 80,
            boxShadow: "0 10px 30px rgba(0,0,0,.05)",
          }}
        >
          <Plane
            size={42}
            color="#C8973A"
            style={{ marginBottom: 20 }}
          />

          <h2
            style={{
              fontFamily: "Playfair Display",
              fontSize: 48,
            }}
          >
            Airport Tips
          </h2>

          <div
            style={{
              marginTop: 30,
            }}
          >
            {AIRPORT_TIPS.map((tip) => (
              <p
                key={tip}
                style={{
                  lineHeight: 1.9,
                  color: "#555",
                }}
              >
                • {tip}
              </p>
            ))}
          </div>
        </div>

        {/* EDITORIAL IMAGE */}

        <div
          style={{
            marginBottom: 80,
            borderRadius: 32,
            overflow: "hidden",
          }}
        >
          <img
            src="/images/journey/farewell.jpg"
            alt="Farewell"
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
            }}
          />
        </div>

        {/* FINAL REFLECTION */}

        <div
          style={{
            background: "#1C2B1E",
            color: "white",
            padding: 60,
            borderRadius: 32,
            textAlign: "center",
            marginBottom: 80,
          }}
        >
          <h3
            style={{
              color: "#C8973A",
              letterSpacing: 3,
            }}
          >
            FINAL REFLECTION
          </h3>

          <p
            style={{
              maxWidth: 800,
              margin: "24px auto",
              lineHeight: 1.9,
            }}
          >
            One day, you'll return to Goa.
          </p>

          <p>Maybe for the beaches.</p>

          <p>Maybe for the food.</p>

          <p>Maybe for the memories.</p>

          <p>
            And when you do, TruGoa will still be here, waiting
            to help you write your next chapter.
          </p>
        </div>

        {/* FINAL CTA */}

        <div
          style={{
            textAlign: "center",
          }}
        >
          <button
            style={{
              background: "#1C2B1E",
              color: "white",
              border: "none",
              padding: "18px 42px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 16,
            }}
          >
            Until Next Time →
          </button>

          <p
            style={{
              marginTop: 20,
              color: "#666",
            }}
          >
            Thank you for letting TruGoa be a part of your Goa
            story.
          </p>
        </div>
      </div>
    </section>
  );
}