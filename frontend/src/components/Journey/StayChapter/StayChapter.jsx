import { useState } from "react";
import {
  MapPin,
  Hotel,
  Smartphone,
  Pill,
  UtensilsCrossed,
} from "lucide-react";
import useIsMobile from "../../../hooks/useIsMobile";

const STAY_OPTIONS = [
  {
    id: "north",
    title: "North Goa",
    description:
      "Perfect for nightlife, cafés, beaches, and an energetic atmosphere.",
    places: ["Candolim", "Calangute", "Anjuna", "Vagator", "Morjim"],
  },

  {
    id: "south",
    title: "South Goa",
    description:
      "Perfect for peaceful vacations, luxury stays, and beautiful sunsets.",
    places: ["Palolem", "Colva", "Agonda", "Benaulim", "Varca"],
  },
];

const ESSENTIALS = [
  {
    title: "ATM",
    description: "Find nearby ATMs within 5 minutes of your stay.",
    icon: MapPin,
  },
  {
    title: "SIM Card",
    description: "Purchase a local Jio or Airtel SIM card.",
    icon: Smartphone,
  },
  {
    title: "Pharmacy",
    description: "Locate nearby pharmacies for any essentials.",
    icon: Pill,
  },
  {
    title: "Restaurants",
    description: "Discover great places to eat around your stay.",
    icon: UtensilsCrossed,
  },
];

const QUICK_TIPS = [
  {
    title: "Check-In",
    value: "2 PM",
  },
  {
    title: "Peak Season",
    value: "Nov - Feb",
  },
  {
    title: "Local SIM",
    value: "Jio / Airtel",
  },
  {
    title: "Emergency",
    value: "112",
  },
];

export default function StayChapter() {
    const isMobile = useIsMobile();
    const [selectedArea, setSelectedArea] = useState(0);
  

  const area = STAY_OPTIONS[selectedArea];

  return (
    <section
      id="chapter-2"
      style={{
        background: "#FFFFFF",
        padding: isMobile
        ? "80px 0"
        : "120px 0",
      }}
    >
      <div
        style={{
          width: "min(1400px,92%)",
          margin: "auto",
        }}
      >
        {/* Hero */}

        <div
          style={{
            width: "100%",
            height: isMobile
            ? "50vh"
            : "70vh",
            position: "relative",
            overflow: "hidden",
            borderRadius: 32,
            marginBottom: 80,
          }}
        >
          <img
            src="/images/journey/stay.jpg"
            alt="Stay"
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
                "linear-gradient(to bottom, rgba(0,0,0,.15), rgba(0,0,0,.75))",
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
                marginBottom: 16,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              CHAPTER 02
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Getting Settled
            </h2>
          </div>
        </div>

        {/* Story */}

       <p
        style={{
            maxWidth: 900,
            margin: "0 auto 80px",
            textAlign: "center",
            fontSize: "clamp(1.1rem,2vw,1.35rem)",
            lineHeight: 1.9,
            color: "#4A4A4A",
            padding: "0 20px",
        }}
        >
        Every traveler discovers a different Goa. Some wake to the
        sound of beach cafés opening in North Goa, while others
        spend their mornings listening to the waves along the
        quieter shores of the south. Where you stay becomes the
        backdrop of every memory you'll take home.
        </p>

        {/* North vs South */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 80,
          }}
        >
          {STAY_OPTIONS.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedArea(index)}
              style={{
                flex: "1 1 280px",
                    maxWidth: 400,
                    minWidth: 260,

                    transform:
                    selectedArea === index
                    ? "translateY(-8px)"
                    : "translateY(0)",

                    boxShadow:
                    selectedArea === index
                    ? "0 20px 60px rgba(0,0,0,.12)"
                    : "0 10px 30px rgba(0,0,0,.05)",
                background:
                  selectedArea === index
                    ? "#1C2B1E"
                    : "#F8F8F8",

                color:
                  selectedArea === index
                    ? "white"
                    : "#1C2B1E",

                padding: 32,
                borderRadius: 24,
                cursor: "pointer",
                transform: "translateY(-2px)"
              }}
            >
              <Hotel
                size={42}
                color={
                  selectedArea === index
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
                  opacity: 0.85,
                }}
              >
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* Selected Area */}

        <div
          style={{
            background: "#F5F0E8",
            borderRadius: 30,
            padding: isMobile ? 30 : 60,
            marginBottom: 80,
          }}
        >
          <h2
            style={{
              fontFamily: "Playfair Display",
              fontSize: isMobile ? 36 : 48
            }}
          >
            {area.title}
          </h2>

          <p
            style={{
              maxWidth: 700,
              lineHeight: 1.9,
              color: "#555",
              marginBottom: 40,
            }}
          >
            {area.description}
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {area.places.map((place) => (
              <div
                key={place}
                style={{
                  background: "white",
                  padding: "14px 22px",
                  borderRadius: 50,
                  fontWeight: 600,
                }}
              >
                {place}
              </div>
            ))}
          </div>
        </div>

        <div
        style={{
            marginBottom: 80,
            borderRadius: 32,
            overflow: "hidden",
        }}
        >
        <img
            src="/images/journey/editorial-stay.jpg"
            alt=""
            style={{
            width: "100%",
            height: isMobile ? 350 : 500,
            objectFit: "cover",
            }}
        />
        </div>

        {/* Essentials */}

        <h2
          style={{
            textAlign: "center",
            marginBottom: 50,
            fontFamily: "Playfair Display",
            fontSize: 48,
          }}
        >
          Nearby Essentials
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(260px,1fr))",
            gap: 24,
            marginBottom: 80,
          }}
        >
          {ESSENTIALS.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                style={{
                  background: "#FFFFFF",
                  padding: 32,
                  borderRadius: 24,
                  boxShadow:
                    "0 10px 30px rgba(0,0,0,.05)",
                }}
              >
                <Icon
                  size={38}
                  color="#C8973A"
                  style={{
                    marginBottom: 20,
                  }}
                />

                <h3>{item.title}</h3>

                <p
                  style={{
                    lineHeight: 1.8,
                    color: "#666",
                  }}
                >
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Quick Tips */}

        <div
  style={{
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit,minmax(220px,1fr))",
    gap: 20,
    marginBottom: 80,
  }}
>
  {QUICK_TIPS.map((tip) => (
    <div
      key={tip.title}
      style={{
        background: "#F5F0E8",
        padding: 24,
        borderRadius: 20,
      }}
    >
      <h4>{tip.title}</h4>

      <p>{tip.value}</p>
    </div>
  ))}
        </div>

        {/* Continue */}

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
    Tomorrow morning, Goa begins to reveal itself.
  </p>
        </div>
      </div>
    </section>
  );
}