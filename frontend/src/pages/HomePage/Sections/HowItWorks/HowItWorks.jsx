 <div
        ref={catRef}
        style={{
          background: "#FAFAF7",
          padding: isMobile ? "56px 24px" : `80px clamp(32px,6vw,96px)`,
        }}
      >
        <div className={`reveal ${catVisible ? "visible" : ""}`} style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-block", background: "#E8F2EB", borderRadius: 50,
            padding: "6px 18px", fontSize: 12, color: "#2D6A4F", fontWeight: 600,
            letterSpacing: "1px", textTransform: "uppercase", marginBottom: 16,
          }}>
            How TruGoa works
          </div>
          <h2 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: isMobile ? 36 : "clamp(36px,4vw,56px)",
            fontWeight: 600, color: "#1A1F1C", lineHeight: 1.1, letterSpacing: "-0.5px",
          }}>
            Travel smart. Travel safe.
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: isMobile ? 24 : 32,
        }}>
          {[
            { step: "01", icon: "🔍", title: "Search & Discover", desc: "Browse 500+ verified restaurants, hotels, beaches, and activities across all of Goa — all vetted by our local team.", color: "#E8F2EB", accent: "#2D6A4F" },
            { step: "02", icon: "🛡️", title: "Check & Verify", desc: "Every listing is physically verified. See real photos, honest reviews, and fair prices — no tourist traps, no surprises.", color: "#FEF3C7", accent: "#92700A" },
            { step: "03", icon: "🌴", title: "Explore Confidently", desc: "Use our AI guide to ask anything about Goa. Get instant answers on taxi fares, scam alerts, hidden gems, and more.", color: "#FDE8D8", accent: "#8A3A1A" },
          ].map((item, i) => (
            <div
              key={item.step}
              className={`reveal delay-${i + 1} ${catVisible ? "visible" : ""}`}
              style={{
                background: "white", borderRadius: 24, padding: 32,
                border: "1px solid #E5E0D8",
                boxShadow: "0 2px 20px rgba(26,31,28,0.05)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 20, right: 20,
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 64, fontWeight: 700, color: item.color,
                lineHeight: 1, userSelect: "none",
              }}>
                {item.step}
              </div>
              <div style={{
                width: 56, height: 56, borderRadius: 16, background: item.color,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, marginBottom: 20,
              }}>
                {item.icon}
              </div>
              <h3 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 24, fontWeight: 600, color: "#1A1F1C",
                marginBottom: 10, lineHeight: 1.2,
              }}>
                {item.title}
              </h3>
              <p style={{ fontSize: 14, color: "#4A5550", lineHeight: 1.75 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>