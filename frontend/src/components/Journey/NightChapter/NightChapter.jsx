import { useState } from "react";
import {
  Sunset,
  Coffee,
  Music,
  Store,
  Disc3,
  Moon,
} from "lucide-react";

const NIGHT_OPTIONS = [
  {
    id: "sunsets",
    title: "Sunsets",
    icon: Sunset,
    image: "/images/journey/sunset.jpg",
    description:
      "Few places in the world do sunsets quite like Goa.",
    places: ["Chapora", "Ashwem", "Palolem", "Agonda"],
  },

  {
    id: "cafes",
    title: "Beach Cafés",
    icon: Coffee,
    image: "/images/journey/cafes.jpg",
    description:
      "Slow evenings, warm lights, and conversations that last for hours.",
    places: [
      "Artjuna",
      "Mojigao",
      "Purple Martini",
      "Pousada",
    ],
  },

  {
    id: "music",
    title: "Live Music",
    icon: Music,
    image: "/images/journey/music.jpg",
    description:
      "Somewhere in Goa, there's always a song playing after sunset.",
    places: ["Soro", "Hideaway", "Joseph Bar"],
  },

  {
    id: "markets",
    title: "Night Markets",
    icon: Store,
    image: "/images/journey/night-market.jpg",
    description:
      "Discover food, art, and culture beneath a sky full of stars.",
    places: [
      "Saturday Night Market",
      "Mackie's Night Bazaar",
    ],
  },

  {
    id: "clubs",
    title: "Beach Clubs",
    icon: Disc3,
    image: "/images/journey/beach-club.jpg",
    description:
      "For those who believe the night is still young.",
    places: ["Thalassa", "Tito's", "Antares"],
  },

  {
    id: "walks",
    title: "Late Night Walks",
    icon: Moon,
    image: "/images/journey/night-walk.jpg",
    description:
      "Sometimes the best part of Goa is simply walking beside the sea.",
    places: ["Miramar", "Palolem", "Morjim"],
  },
];

export default function NightChapter() {
  const [selectedNight, setSelectedNight] = useState(0);

  const current = NIGHT_OPTIONS[selectedNight];

  return (
    <section
      id="chapter-6"
      style={{
        padding: "120px 0",
        background: "#0F1720",
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
            height: "70vh",
            position: "relative",
            borderRadius: 32,
            overflow: "hidden",
            marginBottom: 80,
          }}
        >
          <img
            src="/images/journey/night.jpg"
            alt="Night in Goa"
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
                "linear-gradient(to bottom, rgba(0,0,0,.2), rgba(0,0,0,.85))",
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
              CHAPTER 06 OF 07
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Night
            </h2>

            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                opacity: 0.9,
              }}
            >
              As the sun disappears into the Arabian Sea, Goa
              becomes something else entirely.
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
            color: "#D1D5DB",
          }}
        >
          The same Goa that welcomed you in the morning now glows
          beneath a different sky. Somewhere, music drifts through
          the air. Somewhere else, waves crash quietly against the
          shore. However you choose to spend your evening, Goa has
          a way of making it unforgettable.
        </p>

        {/* SELECTOR */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 24,
            marginBottom: 80,
          }}
        >
          {NIGHT_OPTIONS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedNight(index)}
                style={{
                  background:
                    selectedNight === index
                      ? "#1C2B1E"
                      : "#FFFFFF",

                  color:
                    selectedNight === index
                      ? "white"
                      : "#1C2B1E",

                  padding: 32,
                  borderRadius: 24,
                  cursor: "pointer",
                  transition: ".3s",

                  transform:
                    selectedNight === index
                      ? "translateY(-8px)"
                      : "translateY(0)",

                  boxShadow:
                    selectedNight === index
                      ? "0 20px 60px rgba(0,0,0,.2)"
                      : "0 10px 30px rgba(0,0,0,.05)",
                }}
              >
                <Icon
                  size={40}
                  color={
                    selectedNight === index
                      ? "#C8973A"
                      : "#1C2B1E"
                  }
                />

                <h3
                  style={{
                    fontFamily: "Playfair Display",
                    fontSize: 28,
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    lineHeight: 1.8,
                    opacity: 0.9,
                  }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* SELECTED CATEGORY */}

        <div
          style={{
            background: "#1C2B1E",
            color: "white",
            padding: 60,
            borderRadius: 32,
            marginBottom: 80,
          }}
        >
          <h2
            style={{
              fontFamily: "Playfair Display",
              fontSize: 48,
            }}
          >
            {current.title}
          </h2>

          <p
            style={{
              maxWidth: 700,
              lineHeight: 1.9,
              color: "#D1D5DB",
              marginBottom: 40,
            }}
          >
            {current.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {current.places.map((place) => (
              <div
                key={place}
                style={{
                  background: "rgba(255,255,255,.1)",
                  padding: "14px 22px",
                  borderRadius: 999,
                }}
              >
                {place}
              </div>
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
            src={current.image}
            alt={current.title}
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
            }}
          />
        </div>

        {/* NIGHT REFLECTION */}

        <div
          style={{
            background: "#111827",
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
            NIGHT REFLECTION
          </h3>

          <p
            style={{
              maxWidth: 800,
              margin: "24px auto",
              lineHeight: 1.9,
            }}
          >
            Some nights stay with you forever.
          </p>

          <p>
            "You'll remember the color of the sunset."
          </p>

          <p>
            "You'll remember the sound of the waves."
          </p>

          <p>
            "You'll remember the song playing somewhere in the
            distance."
          </p>

          <p>
            "And you'll remember wishing the night never ended."
          </p>
        </div>

        {/* CONTINUE */}

        <div
          style={{
            textAlign: "center",
          }}
        >
          <button
            style={{
              background: "#C8973A",
              color: "#111827",
              border: "none",
              padding: "18px 42px",
              borderRadius: 999,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            Continue Your Journey →
          </button>

          <p
            style={{
              marginTop: 20,
              color: "#D1D5DB",
            }}
          >
            Tomorrow, it's time to say goodbye.
          </p>
        </div>
      </div>
    </section>
  );
}