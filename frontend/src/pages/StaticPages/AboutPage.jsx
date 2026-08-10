import { useNavigate } from "react-router-dom";
import SEO from "../../components/SEO/SEO";
import { PrimaryButton, SecondaryButton } from "../../Theme";
import "./StaticPages.css";

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        path="/about"
        title="About TruGoa — A quieter way to find Goa"
        description="TruGoa is a curated travel guide to Goa. Not a booking site. A small, carefully kept collection of the places worth your time."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">About</span>
        <h1 className="tg-static-headline">There's a Goa beyond words.</h1>
        <p className="tg-static-subhead">
          Most people arrive here with a hotel booked and no idea what happens next.
          TruGoa exists for everything that comes after the booking.
        </p>
      </section>

      <div className="tg-static-body">
        <div className="tg-static-section">
          <p>
            Goa is not one place. It is a hundred small ones, folded into each other —
            a bakery that opens at six and sells out by eight, a stretch of sand that
            only makes sense in October, a chapel on a hill where the light does
            something you will think about for years.
          </p>
          <p>None of that is on the first page of a search result.</p>
          <p>
            What you find instead is a list. Twenty thousand stays, sorted by price.
            Two hundred restaurants, sorted by whoever paid the most to be sorted
            first. You scroll until you are tired, then you pick something safe, and
            you go home having seen a version of Goa that was assembled by an
            algorithm that has never been here.
          </p>
          <p>We built TruGoa because we thought that was a strange way to spend a holiday.</p>
        </div>

        <div className="tg-static-section">
          <h3>What we are</h3>
          <p>
            TruGoa is a curated travel guide to Goa. We do not sell rooms, we do not
            take commissions on tables, and we do not run a directory. We keep a small
            collection of places we believe in, and we tell you honestly why each one
            is on the list.
          </p>
          <p>
            Thirty stays instead of twenty thousand. Twenty restaurants instead of two
            hundred. The number is small on purpose — a recommendation only means
            something if it costs us something to give.
          </p>
          <p>
            Every place is chosen the slow way: the food, the room, the service, the
            light in the afternoon, the story behind who built it. If it is only
            photogenic, it does not make the list. If it is only famous, it definitely
            does not.
          </p>
        </div>

        <div className="tg-static-section">
          <h3>What we are not</h3>
          <p>
            We are not a booking engine. We are not a review aggregator. We are not a
            blog chasing whatever is trending this season, and we are not a sponsored
            list wearing an editorial costume.
          </p>
          <p>If a place is on TruGoa, it is because it earned it.</p>
        </div>

        <div className="tg-static-section">
          <h3>My Goa Friend</h3>
          <p>
            Somewhere in your trip you will have a question that no guide answers. It
            is raining and you have a free afternoon. You landed at eleven at night
            and you're hungry. You have three days, one of them with your parents.
            North or South — you genuinely cannot tell.
          </p>
          <p>
            That is what <em>My Goa Friend</em> is for. Not a chatbot — a friend who
            happens to live here, who knows which beach is calm in August and which
            road floods, and who will tell you plainly when the famous answer is the
            wrong one for you.
          </p>
        </div>

        <div className="tg-static-section tg-static-founder">
          <h3>Who's behind it</h3>
          <p>
            Dinesh Patil — home is in Goa. Family here, and the kind of long
            familiarity you only get from years of Sunday drives to nowhere in
            particular.
          </p>
          <p>
            TruGoa started as a small frustration: watching visitors work very hard
            to have an ordinary trip, in a place that is anything but. It is being
            built slowly, one place at a time, by someone who has to live with the
            recommendations.
          </p>
        </div>
      </div>

      <div className="tg-static-closing">
        <p>
          We are not trying to be the biggest guide to Goa. We are trying to be the
          one you trust.
        </p>
        <div className="tg-static-cta-row">
          <PrimaryButton onClick={() => navigate("/manifesto")}>
            Read our manifesto →
          </PrimaryButton>
          <SecondaryButton onClick={() => navigate("/explore")}>
            Start exploring →
          </SecondaryButton>
        </div>
      </div>

      <p className="tg-static-footer-line">
        There's a Goa beyond words. Let us take you there.
      </p>
    </>
  );
}
