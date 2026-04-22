{/* ── CATEGORIES ──────────────────────────────────────── */}
      <div style={{ background: "#0A1F12", padding: isMobile ? "56px 0" : "72px 0", overflow: "hidden" }}>
        <div style={{ padding: isMobile ? "0 24px 32px" : `0 clamp(32px,6vw,96px) 40px` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{
                fontSize: 11, color: "#F0B429", fontWeight: 600,
                letterSpacing: "2px", textTransform: "uppercase", marginBottom: 12,
              }}>
                Browse by Category
              </div>
              <h2 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: isMobile ? 32 : "clamp(32px,4vw,52px)",
                fontWeight: 600, color: "white", lineHeight: 1.1,
              }}>
                What are you looking for?
              </h2>
            </div>
            <span
              onClick={() => navigate("/listings")}
              style={{
                fontSize: 14, color: "#F0B429", fontWeight: 500,
                cursor: "pointer", borderBottom: "1px solid rgba(240,180,41,0.4)",
                paddingBottom: 2,
              }}
            >
              View all places →
            </span>
          </div>
        </div>

        {/* horizontal scroll strip — category chips only, no BizCard grid here */}
        <div
          className="no-scrollbar"
          style={{
            display: "flex", gap: 16, overflowX: "auto",
            padding: isMobile ? "8px 24px 24px" : `8px clamp(32px,6vw,96px) 24px`,
          }}
        >
          {CATEGORIES.map((c, i) => {
            const isActive = activeCategory === c.label;
            return (
              <div
                key={c.label}
                className="cat-chip"
                onClick={() => setActiveCategory(c.label)}
                style={{
                  flexShrink: 0,
                  width: isMobile ? 130 : 160,
                  background: isActive ? "#F0B429" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${isActive ? "#F0B429" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 20, padding: "20px 16px",
                  cursor: "pointer", textAlign: "center",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isActive ? "#1A1F1C" : "rgba(255,255,255,0.8)",
                  marginBottom: 4,
                }}>
                  {c.label}
                </div>
                <div style={{
                  fontSize: 11,
                  color: isActive ? "rgba(26,31,28,0.6)" : "rgba(255,255,255,0.35)",
                }}>
                  {businesses.filter(b =>
                    c.label === "All" || b.category?.toLowerCase().includes(
                      c.label.replace(/s$/, "").toLowerCase()
                    )
                  ).length} places
                </div>
              </div>
            );
          })}
        </div>
      </div>