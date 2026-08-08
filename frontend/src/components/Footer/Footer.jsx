import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import "./Footer.css";

const COLUMNS = [
  {
    title: "Explore",
    links: [
      ["Places", "/explore"],
      ["Experiences", "/explore?category=experiences"],
      ["Beaches", "/explore?category=beaches"],
      ["Villages", "/explore?category=villages"],
      ["Maps", "/explore"],
    ],
  },
  {
    title: "Stories",
    links: [
      ["Travel Stories", "/stories/destinations"],
      ["Local Insights", "/stories/destinations"],
      ["Guides", "/stories/destinations"],
      ["Journal", "/stories/destinations"],
    ],
  },
  {
    title: "AI Guide",
    links: [
      ["GoaGuide AI", "/goaguide"],
      ["Ask Anything", "/goaguide"],
      ["Travel Tips", "/goaguide"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/"],
      ["Our Manifesto", "/"],
      ["Contact", "/"],
    ],
  },
];

const SOCIALS = ["IG", "FB", "YT"];

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");

  return (
    <footer className="tg-footer">
      <div className="tg-footer-inner">
        <div className="tg-footer-grid">
          <div className="tg-footer-brand">
            <div className="tg-footer-logo">
              <span className="tg-footer-logo-tru">Tru</span>
              <span className="tg-footer-logo-goa">Goa</span>
            </div>
            <p className="tg-footer-tagline">
              Curating the soul of Goa — one honest place at a time.
            </p>
            <div className="tg-footer-socials">
              {SOCIALS.map((s) => (
                <span key={s} className="tg-footer-social">{s}</span>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title} className="tg-footer-col">
              <div className="tg-footer-col-title">{col.title}</div>
              {col.links.map(([label, path]) => (
                <span key={label} className="tg-footer-link" onClick={() => navigate(path)}>
                  {label}
                </span>
              ))}
            </div>
          ))}

          <div className="tg-footer-newsletter">
            <div className="tg-footer-col-title">The Goa Letter</div>
            <p className="tg-footer-tagline" style={{ marginBottom: 14 }}>
              Stories. Secrets. Straight to your inbox.
            </p>
            <form
              className="tg-footer-newsletter-form"
              onSubmit={(e) => { e.preventDefault(); setEmail(""); }}
            >
              <input
                type="email"
                required
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" aria-label="Subscribe">
                <Send size={15} strokeWidth={2} />
              </button>
            </form>
          </div>
        </div>

        <div className="tg-footer-rule" />

        <div className="tg-footer-bottom">
          <span>© {new Date().getFullYear()} TruGoa. All rights reserved.</span>
          <div style={{ display: "flex", gap: 20 }}>
            <span className="tg-footer-link" onClick={() => navigate("/")}>Privacy Policy</span>
            <span className="tg-footer-link" onClick={() => navigate("/")}>Terms of Use</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
