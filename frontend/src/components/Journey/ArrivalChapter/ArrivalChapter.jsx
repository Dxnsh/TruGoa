import { useState } from "react";
import { ARRIVAL_OPTIONS } from "../../../Data/ArrivalData";

export default function ArrivalChapter() {
  const [selectedArrival, setSelectedArrival] = useState(0);
  const [selectedStep, setSelectedStep] = useState(0);

  const arrival = ARRIVAL_OPTIONS[selectedArrival];
  const step = arrival.steps[selectedStep];

  return (
    <section
      id="chapter-1"
      style={{
        background: "#F5F0E8",
        padding: "120px 0",
      }}
    >
      <div
        style={{
          width: "min(1400px,92%)",
          margin: "auto",
        }}
      >
        {/* Hero Image */}

        <div
          style={{
            width: "100%",
            height: "70vh",
            borderRadius: 32,
            overflow: "hidden",
            position: "relative",
            marginBottom: 80,
          }}
        >
          <img
            src="/images/Hero-img.jpg"
            alt="Arrival"
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
              bottom: 60,
              left: 40,
              color: "white",
            }}
          >
            <div
              style={{
                color: "#C8973A",
                letterSpacing: 4,
                fontSize: 12,
                marginBottom: 16,
                fontWeight: 700,
              }}
            >
              CHAPTER 01
            </div>

            <h2
              style={{
                margin: 0,
                fontFamily: "Playfair Display",
                fontSize: "clamp(42px,6vw,72px)",
              }}
            >
              Welcome to Goa
            </h2>
          </div>
        </div>

        {/* Story */}

        <p
          style={{
            maxWidth: 850,
            margin: "0 auto 80px",
            textAlign: "center",
            fontSize: 22,
            lineHeight: 1.9,
            color: "#4A4A4A",
          }}
        >
          You've finally arrived. Whether you've stepped off a
          plane, train, or bus, your Goa story starts right
          here. Let's get you settled before we begin
          exploring.
        </p>

        {/* Arrival Selector */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            marginBottom: 80,
          }}
        >
          {ARRIVAL_OPTIONS.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedArrival(index);
                  setSelectedStep(0);
                }}
                style={{
                  width: 240,
                  background:
                    selectedArrival === index
                      ? "#1C2B1E"
                      : "white",

                  color:
                    selectedArrival === index
                      ? "white"
                      : "#1C2B1E",

                  borderRadius: 24,
                  padding: 32,
                  cursor: "pointer",
                  textAlign: "center",
                  transition: ".3s",
                  boxShadow:
                    selectedArrival === index
                      ? "0 20px 50px rgba(0,0,0,.15)"
                      : "0 8px 30px rgba(0,0,0,.05)",
                }}
              >
                <Icon
                  size={42}
                  style={{
                    marginBottom: 20,
                    color:
                      selectedArrival === index
                        ? "#C8973A"
                        : "#1C2B1E",
                  }}
                />

                <h3
                  style={{
                    margin: 0,
                    marginBottom: 10,
                    fontSize: 24,
                    fontFamily: "Playfair Display",
                  }}
                >
                  {item.title}
                </h3>

                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.6,
                    opacity: 0.75,
                  }}
                >
                  {item.subtitle}
                </p>
              </div>
            );
          })}
        </div>

        {/* Timeline */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: 100,
            overflowX: "auto",
            padding: "20px 0",
          }}
        >
          {arrival.steps.map((item, index) => {
            const Icon = item.icon;

            return (
              <div
                key={index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: 1,
                }}
              >
                <div
                  onClick={() => setSelectedStep(index)}
                  style={{
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 120,
                  }}
                >
                  <div
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",

                      background:
                        selectedStep === index
                          ? "#C8973A"
                          : index < selectedStep
                          ? "#1C2B1E"
                          : "white",

                      color:
                        selectedStep === index ||
                        index < selectedStep
                          ? "white"
                          : "#1C2B1E",

                      border: "2px solid #C8973A",
                    }}
                  >
                    <Icon size={28} />
                  </div>

                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      textAlign: "center",
                    }}
                  >
                    {item.title}
                  </span>
                </div>

                {index < arrival.steps.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background:
                        index < selectedStep
                          ? "#1C2B1E"
                          : "rgba(0,0,0,.1)",
                      margin: "0 12px",
                      marginBottom: 45,
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Details */}

        <div
          style={{
            textAlign: "center",
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <img
            src="/images/beaches.jpg"
            alt={step.title}
            style={{
              width: "100%",
              height: 500,
              objectFit: "cover",
              borderRadius: 30,
              marginBottom: 40,
            }}
          />

          <h2
            style={{
              fontSize: 52,
              fontFamily: "Playfair Display",
              marginBottom: 24,
            }}
          >
            {step.title}
          </h2>

          <p
            style={{
              fontSize: 18,
              lineHeight: 1.9,
              color: "#555",
            }}
          >
            {step.description}
          </p>
        </div>

        {/* Quick Tips */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 24,
            flexWrap: "wrap",
            marginTop: 60,
            marginBottom: 80,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 20,
              minWidth: 220,
            }}
          >
            <h4>Travel Time</h4>
            <p>20 - 30 Minutes</p>
          </div>

          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 20,
              minWidth: 220,
            }}
          >
            <h4>Best Transport</h4>
            <p>Taxi / Cab</p>
          </div>

          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 20,
              minWidth: 220,
            }}
          >
            <h4>Next Step</h4>
            <p>Reach Your Stay</p>
          </div>
        </div>

        {/* Continue */}

        <div
          style={{
            display: "flex",
            justifyContent: "center",
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
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Continue Journey →
          </button>
        </div>
      </div>
    </section>
  );
}