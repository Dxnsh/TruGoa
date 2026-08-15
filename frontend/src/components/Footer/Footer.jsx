import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Plus } from "lucide-react";
import "./Footer.css";

/* lucide dropped brand logos in v1, so the three social marks are inline. */
const IconInstagram = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
    <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.6" cy="6.4" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

const IconX = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.66l7.73-8.84L1.24 2.25h6.83l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.12H5.05l12.03 15.65Z" />
  </svg>
);

const IconLinkedIn = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
    <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.71h.05c.53-.95 1.83-1.96 3.76-1.96 4.02 0 4.76 2.5 4.76 5.76V21h-4v-5.6c0-1.34-.03-3.06-1.9-3.06-1.9 0-2.2 1.46-2.2 2.96V21h-4V9Z" />
  </svg>
);

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
    title: "Guides & GoaGuide AI",
    links: [
      ["Travel Guides", "/guides"],
      ["Local Insights", "/guides"],
      ["Journal", "/guides"],
      ["GoaGuide AI", "/goaguide"],
      ["Ask Anything", "/goaguide"],
      ["Travel Tips", "/goaguide"],
    ],
  },
  {
    title: "Company",
    links: [
      ["About Us", "/about"],
      ["Our Manifesto", "/manifesto"],
      ["Contact", "/contact"],
    ],
  },
];

const SOCIALS = [
  { label: "Instagram", Icon: IconInstagram, href: "https://www.instagram.com/trugoa?utm_source=qr&igsh=eGQ5dHAxdmhtY3Bz" },
  { label: "X",         Icon: IconX,         href: "https://x.com/TruGoa_" },
  { label: "LinkedIn",  Icon: IconLinkedIn,  href: "https://www.linkedin.com/company/trugoa/" },
];

export default function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  // Mobile collapses each link group behind a "+". On desktop the CSS keeps
  // every panel open, so this state simply goes unused there.
  const [openCol, setOpenCol] = useState(null);

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
              Curating the soul of Goa &mdash; one honest place at a time.
            </p>
            <div className="tg-footer-socials">
              {SOCIALS.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  className="tg-footer-social"
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon width={17} height={17} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col, i) => (
            <div
              key={col.title}
              className={`tg-footer-col ${openCol === i ? "open" : ""}`}
            >
              <button
                className="tg-footer-col-head"
                onClick={() => setOpenCol(openCol === i ? null : i)}
                aria-expanded={openCol === i}
              >
                <span className="tg-footer-col-title">{col.title}</span>
                <span className="tg-footer-col-plus">
                  <Plus size={15} strokeWidth={2} />
                </span>
              </button>

              <div className="tg-footer-col-panel">
                <div className="tg-footer-col-links">
                  {col.links.map(([label, path]) => (
                    <span
                      key={label}
                      className="tg-footer-link"
                      onClick={() => navigate(path)}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="tg-footer-newsletter">
            <div className="tg-footer-col-title">The Goa Letter</div>
            <p className="tg-footer-tagline">
              Stories &amp; secrets, straight to your inbox.
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
                <ArrowRight size={16} strokeWidth={2.2} />
              </button>
            </form>
          </div>
        </div>

        <div className="tg-footer-rule" />

        <div className="tg-footer-bottom">
          <span>© {new Date().getFullYear()} TruGoa. All rights reserved.</span>
          <div className="tg-footer-legal">
            <span className="tg-footer-legal-link" onClick={() => navigate("/")}>Privacy</span>
            <span className="tg-footer-legal-sep">·</span>
            <span className="tg-footer-legal-link" onClick={() => navigate("/")}>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
