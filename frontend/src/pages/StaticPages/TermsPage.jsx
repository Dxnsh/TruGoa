import SEO from "../../components/SEO/SEO";
import "./StaticPages.css";

export default function TermsPage() {
  return (
    <>
      <SEO
        path="/terms"
        title="Terms of Use — TruGoa"
        description="The terms you agree to when using TruGoa: what we publish, what you contribute, and the limits of what a guide can promise."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Legal</span>
        <h1 className="tg-static-headline">Terms of Use</h1>
        <p className="tg-static-subhead">
          The plain-language version of what you can expect from us, and what we
          expect from you. Last updated 3 September 2026.
        </p>
      </section>

      <div className="tg-static-body">
        <div className="tg-static-section">
          <h2>What TruGoa is</h2>
          <p>
            TruGoa is an editorial guide to Goa. We research and publish listings for
            places we think are worth your time. We are not a booking platform, a
            travel agent or a tour operator. We do not take payment for a place to
            appear, and we do not sell anything on this site.
          </p>
          <p>
            By using TruGoa you agree to these terms. If you do not agree with them,
            please do not use the site.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Accuracy, and its limits</h2>
          <p>
            Every listing is checked when it is written, but Goa changes. Opening
            hours shift with the season, prices go up, kitchens close and businesses
            move or shut entirely. Prices and timings on this site are guidance, not
            quotes. Confirm anything that matters directly with the place before you
            travel or spend money.
          </p>
          <p>
            The safety notes and scam warnings we publish are there to help, but they
            cannot be complete. Use your own judgement, and take the usual care you
            would anywhere unfamiliar.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>GoaGuide AI and generated itineraries</h2>
          <p>
            GoaGuide AI and the itinerary planner produce suggestions using a language
            model. They can be wrong, out of date, or confidently mistaken. Treat what
            they produce as a starting point for your own planning, never as a booking,
            a guarantee of availability, or professional travel advice.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Your account</h2>
          <p>
            You can browse TruGoa without an account. If you sign in, you are
            responsible for what happens under your account. Tell us if you think
            someone else has access to it. We may suspend or remove an account that is
            being used to abuse the site or other people.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Reviews and anything else you post</h2>
          <p>
            When you post a review you keep ownership of what you wrote, and you give
            us permission to publish, display and format it on TruGoa.
          </p>
          <p>Reviews must be your own honest experience. Do not post:</p>
          <p>
            Anything untrue or deliberately misleading; anything defamatory, abusive,
            hateful or threatening; anything that infringes someone else's copyright;
            other people's personal information; spam, advertising or paid reviews;
            or content posted to manipulate a listing's reputation in either direction.
          </p>
          <p>
            Images attached to reviews must be uploaded through TruGoa. We remove
            content that breaks these rules, and we may do so without notice.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Acceptable use</h2>
          <p>
            Do not attempt to break, overload or gain unauthorised access to the site
            or its API. Do not scrape the catalogue in bulk or reuse our editorial
            content commercially without asking us first. Automated access beyond
            ordinary browsing is not permitted.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Our content</h2>
          <p>
            The writing, photography selection, structure and branding on TruGoa
            belong to us. You are welcome to link to any page. You may not republish
            substantial parts of the site as your own.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Places we list</h2>
          <p>
            Listing a business is editorial, not an endorsement of any transaction you
            have with it, and it does not mean we have any relationship with them. What
            happens between you and a restaurant, hotel or operator is between you and
            them.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Liability</h2>
          <p>
            TruGoa is provided as it is, without warranties. To the extent the law
            allows, we are not liable for loss arising from your use of the site, from
            relying on information published here, or from your dealings with any place
            we list. Nothing here limits liability that cannot legally be limited.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Changes and availability</h2>
          <p>
            We may change, suspend or withdraw any part of the site at any time, and we
            may update these terms. Material changes will be reflected in the date at
            the top of this page.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of India, and the courts of Goa have
            jurisdiction over any dispute arising from them.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Contact</h2>
          <p>
            Questions, corrections or takedown requests:{" "}
            <a href="mailto:hello@trugoa.in">hello@trugoa.in</a>.
          </p>
        </div>
      </div>
    </>
  );
}
