import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO/SEO";
import { PrimaryButton } from "../../Theme";
import "./StaticPages.css";

const COMMITMENTS = [
  {
    n: "I",
    title: "Curation over aggregation.",
    text: "Anyone can list everything. Listing everything is the same as recommending nothing. We would rather show you nine places and be right about all nine.",
  },
  {
    n: "II",
    title: "Experiences over bookings.",
    text: "A room is where you sleep. It is not why you came. We care about the hours in between — the morning you didn't plan, the meal you still talk about.",
  },
  {
    n: "III",
    title: "Trust over traffic.",
    text: "We will never sell a position on this site. The day a recommendation can be bought is the day TruGoa stops being worth reading, and we would rather grow slowly than be worth nothing quickly.",
  },
  {
    n: "IV",
    title: "Honesty, including the inconvenient kind.",
    text: "If a beach is beautiful and crowded, we will say both. If the famous place is not worth the queue, we will say that too. A guide that only praises is an advertisement.",
  },
  {
    n: "V",
    title: "Quality is a number.",
    text: "Curation is not a mood, it is a limit. Thirty stays. Twenty restaurants. When something better arrives, something else comes off the list.",
  },
  {
    n: "VI",
    title: "Discover Goa like a local, not like a list.",
    text: "The best of this place is not hidden — it is just unadvertised. Our job is to close that gap without turning quiet places into loud ones.",
  },
  {
    n: "VII",
    title: "Timeless over trending.",
    text: "We are not designing for this year. No urgency banners, no countdowns, no manufactured scarcity. Nothing here is trying to rush you.",
  },
  {
    n: "VIII",
    title: "Respect the place you're visiting.",
    text: "Goa is somebody's home before it is anybody's holiday. We recommend accordingly — the businesses that treat their people well, the beaches that can hold visitors without breaking, the traditions that deserve to be observed rather than consumed.",
  },
  {
    n: "IX",
    title: "Build slowly, and exceptionally well.",
    text: "We would rather ship one perfect guide this month than ten average ones. Everything here is made by hand, and it shows in both directions.",
  },
];

export default function ManifestoPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        path="/manifesto"
        title="The TruGoa Manifesto"
        description="Nine things we believe about travel, curation, and Goa — and the standards we hold ourselves to."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Our Manifesto</span>
        <h1 className="tg-static-headline">What we believe.</h1>
        <p className="tg-static-subhead">
          Nine commitments. We wrote them down so you can hold us to them.
        </p>
      </section>

      <div className="tg-static-body">
        {COMMITMENTS.map((c) => (
          <div className="tg-manifesto-item" key={c.n}>
            <h3>{c.n}. {c.title}</h3>
            <p>{c.text}</p>
          </div>
        ))}
      </div>

      <div className="tg-static-closing">
        <p>
          Every recommendation on TruGoa should make you think: if TruGoa says it's
          worth it, it's worth it.
        </p>
        <p style={{ fontSize: 15, fontStyle: "normal", fontFamily: "var(--font-body)", color: "var(--color-text-muted)", marginTop: -14 }}>
          That sentence is the whole product. Everything else is in service of it.
        </p>
        <div className="tg-static-cta-row">
          <PrimaryButton onClick={() => navigate("/explore")}>
            See what we've curated →
          </PrimaryButton>
        </div>
      </div>

      <p className="tg-static-footer-line">
        There's a Goa beyond words. Let us take you there.
      </p>
    </>
  );
}
