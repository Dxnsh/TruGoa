import { useNavigate } from "react-router-dom";
import '././homepage.css'

const HeroSection = ({
  isMobile,
  searchQuery,
  setSearchQuery,
  handleSearch,
}) => {
  const navigate = useNavigate();

  const floatingCards = [
    { emoji: "🍽️", label: "Restaurants", sub: "48 places", cls: "card-float-1", pos: { top: "15%", left: "6%" } },
    { emoji: "🏖️", label: "Beaches", sub: "12 spots", cls: "card-float-2", pos: { top: "12%", right: "8%" } },
    { emoji: "☕", label: "Cafés", sub: "24 spots", cls: "card-float-3", pos: { bottom: "22%", left: "4%" } },
    { emoji: "🎯", label: "Activities", sub: "30 things", cls: "card-float-4", pos: { bottom: "18%", right: "5%" } },
    { emoji: "🛍️", label: "Markets", sub: "8 markets", cls: "card-float-5", pos: { top: "50%", left: "2%" } },
  ];

  return (
    <section className="hero-section">
      {/* Animated Background Blobs */}
      <div className="hero-blob hero-blob-1"></div>
      <div className="hero-blob hero-blob-2"></div>
      <div className="hero-blob hero-blob-3"></div>

      {/* Giant GOA watermark */}
      <div
        className="hero-watermark"
        style={{
          fontSize: isMobile ? "52vw" : "32vw",
        }}
      >
        GOA
      </div>

      {/* Noise Texture */}
      <div className="hero-noise"></div>

      {/* Floating Cards Desktop Only */}
      {!isMobile &&
        floatingCards.map((card, i) => (
          <div
            key={i}
            className={`hero-float-card ${card.cls}`}
            style={card.pos}
            onClick={() =>
              navigate(
                `/listings?category=${encodeURIComponent(card.label)}`
              )
            }
          >
            <div className="hero-float-icon">{card.emoji}</div>
            <div className="hero-float-title">{card.label}</div>
            <div className="hero-float-sub">{card.sub}</div>
          </div>
        ))}

      {/* Center Content */}
      <div className="hero-content">
        {/* Trust Badge */}
        <div className="hero-pill">
          <span className="hero-dot"></span>
          <span>Trusted by 50,000+ tourists</span>
        </div>

        {/* Headline */}
        <h1 className="hero-title">Discover Goa</h1>
        <h1 className="hero-title hero-title-gold">
          without the scams.
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Verified businesses. Fair prices. AI-powered local knowledge.
          Hidden gems most tourists never find.
        </p>

        {/* Search */}
        <div className="hero-search">
          <span className="hero-search-icon">🔍</span>

          <input
            className="search-input"
            type="text"
            placeholder="Search restaurants, hotels, beaches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />

          <button className="hero-search-btn" onClick={handleSearch}>
            Search Goa
          </button>
        </div>

        {/* Quick Tags */}
        <div className="hero-tags">
          {[
            "🍽️ Restaurants",
            "🏖️ Beaches",
            "🎯 Activities",
            "☕ Cafés",
            "🛍️ Markets",
          ].map((tag) => (
            <button
              key={tag}
              className="hero-tag"
              onClick={() => navigate("/listings")}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="hero-scroll">
        <span>Scroll</span>
        <div className="hero-scroll-line"></div>
      </div>

      {/* Bottom Fade */}
      <div className="hero-fade"></div>
    </section>
  );
};

export default HeroSection;