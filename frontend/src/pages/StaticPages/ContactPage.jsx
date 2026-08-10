import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import SEO from "../../components/SEO/SEO";
import { PrimaryButton } from "../../Theme";
import "./StaticPages.css";

const TOPICS = [
  "Planning a trip",
  "Recommending a place",
  "My business",
  "Press & partnerships",
  "Something else",
];

const EMPTY_FORM = { name: "", email: "", topic: TOPICS[0], message: "" };

export default function ContactPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [status, setStatus] = useState(null); // null | "success" | "error"

  const handleChange = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setForm(EMPTY_FORM);
  };

  return (
    <>
      <SEO
        path="/contact"
        title="Contact TruGoa"
        description="Questions, recommendations, partnerships, or a place you think we've missed — write to us."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Contact</span>
        <h1 className="tg-static-headline">Tell us something.</h1>
        <p className="tg-static-subhead">
          A question, a correction, a place we've missed. We read everything, and we
          reply to most of it.
        </p>
      </section>

      <div className="tg-contact-reasons">
        <div className="tg-contact-reason">
          <h4>Planning a trip</h4>
          <p>
            Stuck between North and South, or trying to fit Goa into three days? Ask
            My Goa Friend first — it's instant and it knows the ground. If it can't
            help, write to us.
          </p>
          <Link to="/journey">→ /journey</Link>
        </div>
        <div className="tg-contact-reason">
          <h4>You know a place we don't</h4>
          <p>
            This is our favourite kind of email. If you've eaten somewhere that
            stayed with you, or stayed somewhere run with real care, tell us. We
            visit before we list — but every good listing starts with someone caring
            enough to write in.
          </p>
        </div>
        <div className="tg-contact-reason">
          <h4>You run a business in Goa</h4>
          <p>
            We don't sell placements, and we can't be paid to include you. What we
            can do is come and see for ourselves. Tell us what you've built and what
            makes it different, and we'll take it from there.
          </p>
        </div>
        <div className="tg-contact-reason">
          <h4>Press, partnerships, everything else</h4>
          <p>
            Writing about Goa, or working on something that fits how we do things?
            We're open to it.
          </p>
        </div>
      </div>

      <div className="tg-contact-columns">
        <div>
          <div className="tg-contact-direct-item">
            <div className="tg-contact-direct-label">Email</div>
            <div className="tg-contact-direct-value">
              <a href="mailto:trugoaofficial@gmail.com">trugoaofficial@gmail.com</a>
            </div>
            <div className="tg-contact-direct-note">We reply within 2 working days.</div>
          </div>
          <div className="tg-contact-direct-item">
            <div className="tg-contact-direct-label">Phone / WhatsApp</div>
            <div className="tg-contact-direct-value">
              <a href="tel:+919322116372">+91 93221 16372</a>
            </div>
            <div className="tg-contact-direct-note">10am – 7pm IST, Monday to Saturday</div>
          </div>
          <div className="tg-contact-direct-item">
            <div className="tg-contact-direct-label">Based in</div>
            <div className="tg-contact-direct-value">Goa, India</div>
          </div>
          <div className="tg-contact-direct-item">
            <div className="tg-contact-direct-label">Social</div>
            <div className="tg-contact-direct-value">
              <a href="https://www.instagram.com/trugoa?utm_source=qr&igsh=eGQ5dHAxdmhtY3Bz" target="_blank" rel="noopener noreferrer">Instagram</a>
              {" · "}
              <a href="https://x.com/TruGoa_" target="_blank" rel="noopener noreferrer">X</a>
              {" · "}
              <a href="https://www.linkedin.com/company/trugoa/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>

        <form className="tg-contact-form" onSubmit={handleSubmit}>
          <div className="tg-contact-field">
            <label htmlFor="name">Name</label>
            <input id="name" value={form.name} onChange={handleChange("name")} placeholder="Your name" />
          </div>
          <div className="tg-contact-field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={handleChange("email")} placeholder="you@example.com" />
          </div>
          <div className="tg-contact-field">
            <label htmlFor="topic">I'm writing about</label>
            <select id="topic" value={form.topic} onChange={handleChange("topic")}>
              {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="tg-contact-field">
            <label htmlFor="message">Message</label>
            <textarea id="message" value={form.message} onChange={handleChange("message")} placeholder="Tell us what's on your mind..." />
          </div>

          {status === "success" && (
            <div className="tg-contact-status success">
              Thank you — it's with us. You'll hear back within 2 working days.
            </div>
          )}
          {status === "error" && (
            <div className="tg-contact-status error">
              Something went wrong on our end. Write to trugoaofficial@gmail.com and we'll pick it up there.
            </div>
          )}

          <PrimaryButton style={{ alignSelf: "flex-start" }}>Send</PrimaryButton>
        </form>
      </div>

      <p className="tg-static-footer-line" style={{ cursor: "pointer" }} onClick={() => navigate("/")}>
        There's a Goa beyond words. Let us take you there.
      </p>
    </>
  );
}
