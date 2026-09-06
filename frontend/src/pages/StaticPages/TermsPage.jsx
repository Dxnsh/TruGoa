import SEO from "../../components/SEO/SEO";
import "./StaticPages.css";

const CONTACT_EMAIL = "trugoaofficial@gmail.com";

export default function TermsPage() {
  return (
    <>
      <SEO
        path="/terms"
        title="Terms of Use — TruGoa"
        description="The terms that govern your use of TruGoa: what we publish, what you contribute, and the limits of what a guide can promise."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Legal</span>
        <h1 className="tg-static-headline">Terms of Use</h1>
        <p className="tg-static-subhead">
          What you can expect from us, and what we expect from you. Last updated
          4 September 2026.
        </p>
      </section>

      <div className="tg-static-body">
        <div className="tg-static-section">
          <h2>About TruGoa</h2>
          <p>
            TruGoa is an editorial guide to Goa. We research and publish listings
            for places we consider worth your time. We are not a booking platform,
            a travel agent or a tour operator, we do not take payment for a place
            to appear, and we do not sell products or services on this site.
          </p>
          <p>
            By accessing or using TruGoa you agree to these terms. If you do not
            agree, please do not use the site.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Accuracy and its limits</h2>
          <p>
            Every listing is checked at the time it is published, but conditions
            change. Opening hours, prices and availability shift with the season,
            and businesses may relocate or close. Information on this site is
            guidance, not a quote or a guarantee. Please confirm anything that
            matters directly with the place before you travel or spend money.
          </p>
          <p>
            Safety notes and other advisories are provided to help but cannot be
            complete. Use your own judgement and take the care you would in any
            unfamiliar place.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Travel assistant and generated itineraries</h2>
          <p>
            Our travel assistant and itinerary planner produce suggestions using
            automated systems. Their output may be incomplete, out of date or
            incorrect. Treat it as a starting point for your own planning, and not
            as a booking, a guarantee of availability, or professional travel
            advice.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Your account</h2>
          <p>
            You may browse TruGoa without an account. If you register, you are
            responsible for activity that occurs under your account and for
            keeping your access secure. Please notify us if you believe your
            account has been compromised. We may suspend or remove an account that
            is used to abuse the site or other people.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Reviews and other contributions</h2>
          <p>
            You retain ownership of the content you submit. By submitting a
            review or other content, you grant us a non-exclusive, worldwide,
            royalty-free licence to publish, display, format and distribute it on
            TruGoa.
          </p>
          <p>Contributions must reflect your own genuine experience. You must not post:</p>
          <p>
            content that is false or misleading; content that is defamatory,
            abusive, hateful or threatening; content that infringes another
            person&rsquo;s intellectual property; other people&rsquo;s personal
            information; spam, advertising or paid reviews; or content intended to
            manipulate a listing&rsquo;s reputation in either direction.
          </p>
          <p>
            We may remove content that breaches these terms, and may do so without
            notice.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Acceptable use</h2>
          <p>
            You must not attempt to disrupt, overload or gain unauthorised access
            to the site or its systems. You must not scrape the catalogue in bulk
            or reuse our editorial content commercially without our prior written
            permission. Automated access beyond ordinary browsing is not
            permitted.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Intellectual property</h2>
          <p>
            The text, curation, photography selection, layout and branding on
            TruGoa are owned by us or our licensors. You may link to any page. You
            may not republish substantial parts of the site as your own.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Places we list</h2>
          <p>
            Listing a business is an editorial decision. It is not an endorsement
            of any transaction you enter into with that business and does not
            imply any commercial relationship between us and them. Any dealings
            between you and a listed business are solely between you and them.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Disclaimer and liability</h2>
          <p>
            TruGoa is provided on an &ldquo;as is&rdquo; and &ldquo;as
            available&rdquo; basis, without warranties of any kind. To the fullest
            extent permitted by law, we are not liable for any loss or damage
            arising from your use of the site, from reliance on information
            published here, or from your dealings with any place we list. Nothing
            in these terms excludes liability that cannot lawfully be excluded.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Changes and availability</h2>
          <p>
            We may change, suspend or withdraw any part of the site at any time,
            and we may update these terms. Material changes will be reflected in
            the date at the top of this page.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of India. The courts of Goa
            shall have exclusive jurisdiction over any dispute arising from them.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Contact</h2>
          <p>
            Questions, corrections or takedown requests:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </>
  );
}
