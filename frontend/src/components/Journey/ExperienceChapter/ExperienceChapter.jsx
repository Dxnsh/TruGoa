import { useState } from "react";

const EXPERIENCES = [
  {
    id: "scuba",
    title: "Scuba Diving",
    image: "/images/journey/scuba.jpg",
    description:
      "Discover an entirely different world beneath the Arabian Sea.",
    duration: "4 - 6 Hours",
    bestTime: "October - May",
    location: "Grande Island",
  },

  {
    id: "parasailing",
    title: "Parasailing",
    image: "/images/journey/parasailing.jpg",
    description:
      "See Goa from above as the coastline stretches endlessly below you.",
    duration: "15 Minutes",
    bestTime: "October - May",
    location: "Calangute",
  },

  {
    id: "kayaking",
    title: "Kayaking",
    image: "/images/journey/kayaking.jpg",
    description:
      "Glide through mangroves and quiet backwaters at sunrise.",
    duration: "2 Hours",
    bestTime: "Sunrise",
    location: "Chapora River",
  },

  {
    id: "cruise",
    title: "Sunset Cruise",
    image: "/images/journey/cruise.jpg",
    description:
      "Watch the sky turn gold as you sail across the Mandovi River.",
    duration: "1.5 Hours",
    bestTime: "Evening",
    location: "Mandovi River",
  },

  {
    id: "camping",
    title: "Camping",
    image: "/images/journey/camping.jpg",
    description:
      "Spend a night beneath the stars listening to the sound of the sea.",
    duration: "Overnight",
    bestTime: "Winter",
    location: "South Goa",
  },

  {
    id: "dolphins",
    title: "Dolphin Tour",
    image: "/images/journey/dolphins.jpg",
    description:
      "A simple but unforgettable experience for first-time visitors.",
    duration: "1 Hour",
    bestTime: "Morning",
    location: "Sinquerim",
  },
];

export default function ExperienceChapter() {
  const [selectedExperience, setSelectedExperience] = useState(0);

  const current = EXPERIENCES[selectedExperience];

  return (
    <section
      id="chapter-5"
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
            src="/images/journey/experiences.jpg"
            alt="Experiences"
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
              CHAPTER 05 OF 07
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: "clamp(42px,6vw,72px)",
                fontFamily: "Playfair Display",
              }}
            >
              Experiences
            </h2>

            <p
              style={{
                marginTop: 12,
                fontSize: 18,
                opacity: 0.9,
              }}
            >
              Some places are visited. Others are remembered.
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
          Years from now, you won't remember every road you
          traveled or every café you visited. But you'll remember
          the moment you saw Goa from above, beneath the sea, or
          under a sky full of stars.
        </p>

        {/* EXPERIENCE SELECTOR */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(220px,1fr))",
            gap: 24,
            marginBottom: 80,
          }}
        >
          {EXPERIENCES.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelectedExperience(index)}
              style={{
                background:
                  selectedExperience === index
                    ? "#1C2B1E"
                    : "#FFFFFF",

                color:
                  selectedExperience === index
                    ? "white"
                    : "#1C2B1E",

                padding: 32,
                borderRadius: 24,
                cursor: "pointer",
                transition: ".3s",

                transform:
                  selectedExperience === index
                    ? "translateY(-8px)"
                    : "translateY(0)",

                boxShadow:
                  selectedExperience === index
                    ? "0 20px 60px rgba(0,0,0,.12)"
                    : "0 10px 30px rgba(0,0,0,.05)",
              }}
            >
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
          ))}
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
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(220px,1fr))",
              gap: 20,
            }}
          >
            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 20,
              }}
            >
              <h4>Duration</h4>
              <p>{current.duration}</p>
            </div>

            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 20,
              }}
            >
              <h4>Best Time</h4>
              <p>{current.bestTime}</p>
            </div>

            <div
              style={{
                background: "white",
                padding: 24,
                borderRadius: 20,
              }}
            >
              <h4>Location</h4>
              <p>{current.location}</p>
            </div>
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

        {/* TRAVELER'S MEMORY */}

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
            TRAVELER'S MEMORY
          </h3>

          <p
            style={{
              maxWidth: 800,
              margin: "20px auto",
              lineHeight: 1.9,
            }}
          >
            The best souvenirs are never bought.
          </p>

          <p>"I remember watching the sunset over the Mandovi."</p>

          <p>"I remember seeing dolphins for the first time."</p>

          <p>"I remember wishing I had stayed longer."</p>
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
            Tonight, Goa begins to glow.
          </p>
        </div>
      </div>
    </section>
  );
}