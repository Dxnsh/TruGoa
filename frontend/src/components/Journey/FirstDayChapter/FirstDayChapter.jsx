import { useState } from "react";
import {
  Sun,
  Utensils,
  Compass,
  Landmark,
  ShoppingBag,
} from "lucide-react";

const FIRST_DAY_OPTIONS = [
  {
    id: "relax",
    title: "Relax",
    icon: Sun,
    image: "/images/journey/relax.jpg",
    description:
      "Slow down and let Goa introduce itself at its own pace.",
    recommendations: [
      "Morning walk at Morjim Beach",
      "Coffee at Mojigao",
      "Afternoon by Ashwem",
      "Sunset beside the Arabian Sea",
    ],
  },

  {
    id: "food",
    title: "Food",
    icon: Utensils,
    image: "/images/journey/food.jpg",
    description:
      "Discover the flavors that have shaped Goa for centuries.",
    recommendations: [
      "Pousada by the Beach",
      "Vinayak Family Restaurant",
      "Gunpowder",
      "Local Goan Fish Thali",
    ],
  },

  {
    id: "adventure",
    title: "Adventure",
    icon: Compass,
    image: "/images/journey/adventure.jpg",
    description:
      "For travelers who believe every day should have a story.",
    recommendations: [
      "Parasailing",
      "Kayaking",
      "ATV Rides",
      "Jet Ski Experience",
    ],
  },

  {
    id: "culture",
    title: "Culture",
    icon: Landmark,
    image: "/images/journey/culture.jpg",
    description:
      "Explore the history, architecture, and traditions of Goa.",
    recommendations: [
      "Fontainhas",
      "Old Goa",
      "Basilica of Bom Jesus",
      "Local Heritage Walk",
    ],
  },

  {
    id: "shopping",
    title: "Shopping",
    icon: ShoppingBag,
    image: "/images/journey/shopping.jpg",
    description:
      "Take a little piece of Goa home with you.",
    recommendations: [
      "Anjuna Flea Market",
      "Mapusa Market",
      "Saturday Night Market",
      "Local Handmade Crafts",
    ],
  },
];

export default function FirstDayChapter() {
  const [selected, setSelected] = useState(0);

  const current = FIRST_DAY_OPTIONS[selected];

  return (
    <section
      id="chapter-3"
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
            src="/images/journey/first-day.jpg"
            alt=""
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
              CHAPTER 03 OF 07
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Your First Day
            </h2>

            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                opacity: 0.9,
              }}
            >
              Every traveler writes a different Goa story.
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
          It's your first morning in Goa. The cafés are opening,
          scooters fill the roads, and somewhere in the distance,
          the sea is waiting. There is no right way to experience
          Goa—only your way.
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
          {FIRST_DAY_OPTIONS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => setSelected(index)}
                style={{
                  background:
                    selected === index
                      ? "#1C2B1E"
                      : "#FFFFFF",

                  color:
                    selected === index
                      ? "white"
                      : "#1C2B1E",

                  padding: 32,
                  borderRadius: 24,
                  cursor: "pointer",
                  transition: ".3s",
                  transform:
                    selected === index
                      ? "translateY(-8px)"
                      : "translateY(0)",

                  boxShadow:
                    selected === index
                      ? "0 20px 60px rgba(0,0,0,.12)"
                      : "0 10px 30px rgba(0,0,0,.05)",
                }}
              >
                <Icon
                  size={40}
                  color={
                    selected === index
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

        {/* SELECTED EXPERIENCE */}

        <div
          style={{
            background: "#F5F0E8",
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
              color: "#555",
              lineHeight: 1.9,
              marginBottom: 40,
              maxWidth: 700,
            }}
          >
            {current.description}
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(250px,1fr))",
              gap: 20,
            }}
          >
            {current.recommendations.map((item) => (
              <div
                key={item}
                style={{
                  background: "white",
                  padding: 24,
                  borderRadius: 20,
                  fontWeight: 600,
                }}
              >
                {item}
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
            alt=""
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
            }}
          />
        </div>

        {/* LOCAL TIP */}

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
            LOCAL TIP
          </h3>

          <p
            style={{
              maxWidth: 700,
              margin: "20px auto 0",
              lineHeight: 1.9,
              fontSize: 18,
            }}
          >
            Leave an hour of your day unplanned. Some of Goa's
            best memories happen when you stop following the map.
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
            The road ahead leads beyond the beaches.
          </p>
        </div>
      </div>
    </section>
  );
}