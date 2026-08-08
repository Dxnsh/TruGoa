import { useState } from "react";
import {
  Waves,
  Castle,
  Trees,
  Store,
  Church,
  Compass,
} from "lucide-react";

const EXPLORE_OPTIONS = [
  {
    id: "beaches",
    title: "Beaches",
    icon: Waves,
    image: "/images/journey/beaches.jpg",
    description:
      "From lively shores to hidden coves, every beach in Goa tells a different story.",
    places: [
      "Palolem",
      "Vagator",
      "Morjim",
      "Ashwem",
      "Butterfly Beach",
    ],
  },

  {
    id: "forts",
    title: "Forts",
    icon: Castle,
    image: "/images/journey/forts.jpg",
    description:
      "Ancient walls overlooking the Arabian Sea and centuries of history.",
    places: [
      "Aguada Fort",
      "Chapora Fort",
      "Reis Magos",
      "Corjuem Fort",
    ],
  },

  {
    id: "waterfalls",
    title: "Waterfalls",
    icon: Trees,
    image: "/images/journey/waterfalls.jpg",
    description:
      "Step away from the coast and discover Goa's lush green heart.",
    places: [
      "Dudhsagar Falls",
      "Harvalem Falls",
      "Tambdi Surla Falls",
    ],
  },

  {
    id: "markets",
    title: "Markets",
    icon: Store,
    image: "/images/journey/markets.jpg",
    description:
      "Colorful markets filled with food, music, and local stories.",
    places: [
      "Mapusa Market",
      "Anjuna Flea Market",
      "Saturday Night Market",
    ],
  },

  {
    id: "churches",
    title: "Churches",
    icon: Church,
    image: "/images/journey/churches.jpg",
    description:
      "Explore the rich heritage and architecture that shaped Goa.",
    places: [
      "Basilica of Bom Jesus",
      "Se Cathedral",
      "Church of Our Lady",
    ],
  },

  {
    id: "hidden",
    title: "Hidden Gems",
    icon: Compass,
    image: "/images/journey/hidden-gems.jpg",
    description:
      "Places that locals quietly recommend to people they trust.",
    places: [
      "Divar Island",
      "Netravali",
      "Kakolem Beach",
      "Cabo de Rama",
    ],
  },
];

export default function ExploreChapter() {
  const [selectedCategory, setSelectedCategory] = useState(0);

  const current = EXPLORE_OPTIONS[selectedCategory];

  return (
    <section
      id="chapter-4"
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
            height: "70vh",
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            marginBottom: 80,
          }}
        >
          <img
            src="/images/journey/explore-goa.jpg"
            alt="Explore Goa"
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
              CHAPTER 04 OF 07
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Explore Goa
            </h2>

            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                opacity: 0.9,
              }}
            >
              Beyond the beaches lies another Goa.
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
          Goa is more than its beaches. It is ancient forts
          overlooking the sea, hidden waterfalls tucked away in
          forests, colorful markets filled with stories, and quiet
          corners that never make it onto postcards. Today, you
          decide which side of Goa to discover.
        </p>

        {/* CATEGORY SELECTOR */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 24,
            marginBottom: 80,
          }}
        >
          {EXPLORE_OPTIONS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCategory(index)}
                style={{
                  background:
                    selectedCategory === index
                      ? "#1C2B1E"
                      : "#FFFFFF",

                  color:
                    selectedCategory === index
                      ? "white"
                      : "#1C2B1E",

                  padding: 32,
                  borderRadius: 24,
                  cursor: "pointer",
                  transition: ".3s",

                  transform:
                    selectedCategory === index
                      ? "translateY(-8px)"
                      : "translateY(0)",

                  boxShadow:
                    selectedCategory === index
                      ? "0 20px 60px rgba(0,0,0,.12)"
                      : "0 10px 30px rgba(0,0,0,.05)",
                }}
              >
                <Icon
                  size={40}
                  color={
                    selectedCategory === index
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
            background: "#F5F0E8",
            borderRadius: 32,
            padding: 60,
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
              color: "#555",
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
                  background: "white",
                  padding: "14px 22px",
                  borderRadius: 999,
                  fontWeight: 600,
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

        {/* TRAVELER'S NOTE */}

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
            TRAVELER'S NOTE
          </h3>

          <p
            style={{
              maxWidth: 700,
              margin: "20px auto 0",
              lineHeight: 1.9,
              fontSize: 18,
            }}
          >
            Goa is not a checklist. Don't try to see everything.
            Leave something undiscovered, so you'll always have a
            reason to return.
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
            Continue Your Journey →
          </button>

          <p
            style={{
              marginTop: 20,
              color: "#666",
            }}
          >
            As the sun begins to fall, Goa changes once again.
          </p>
        </div>
      </div>
    </section>
  );
}