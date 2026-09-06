import SEO from "../../components/SEO/SEO";
import "./StaticPages.css";

const CONTACT_EMAIL = "trugoaofficial@gmail.com";

export default function PrivacyPage() {
  return (
    <>
      <SEO
        path="/privacy"
        title="Privacy Policy — TruGoa"
        description="How TruGoa collects, uses and protects your personal information, and the choices you have."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Legal</span>
        <h1 className="tg-static-headline">Privacy Policy</h1>
        <p className="tg-static-subhead">
          How we handle your information, why we hold it, and the control you
          have over it. Last updated 4 September 2026.
        </p>
      </section>

      <div className="tg-static-body">
        <div className="tg-static-section">
          <h2>Overview</h2>
          <p>
            TruGoa (&ldquo;TruGoa&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a
            curated travel guide to Goa. This policy explains what personal
            information we collect, how we use it, and the rights available to
            you. You can browse the entire site without an account. We do not sell
            your personal information and we do not run advertising.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Information we collect</h2>
          <p>
            <strong>Account information.</strong> When you create an account or
            sign in, we collect your name, email address and profile picture so we
            can identify you and keep your activity attached to your account. When
            you sign in through a third-party provider, we receive only your basic
            profile details from that provider — never your password.
          </p>
          <p>
            <strong>Content you provide.</strong> Places you save, reviews and
            ratings you submit, any photos you upload, itineraries you generate or
            save and the preferences behind them, and the questions you ask our
            travel assistant.
          </p>
          <p>
            <strong>Messages you send us.</strong> The name, email address and
            message you provide when you contact us or subscribe to our
            newsletter.
          </p>
          <p>
            <strong>Technical information.</strong> Our servers keep short-lived
            logs that may include your IP address and browser type. We use these
            to keep the service secure, apply rate limits, and diagnose problems.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>How we use your information</h2>
          <p>
            We use your information to provide and maintain the service, to show
            your saved places and itineraries, to publish reviews you choose to
            post, to respond to your messages, to send our newsletter if you have
            asked for it, and to protect the site and its users against abuse.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Service providers</h2>
          <p>
            We rely on a small number of trusted third-party providers to host the
            site, store data securely, deliver images, provide sign-in, and power
            certain features such as our travel assistant. These providers process
            information only on our instructions and only to the extent needed to
            provide their service to us. We do not sell personal information or
            share it with advertisers.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Cookies and local storage</h2>
          <p>
            We store a sign-in token and limited session information in your
            browser so that you stay signed in between visits. Clearing your
            browser data will sign you out. We also use privacy-conscious
            analytics to understand overall traffic in aggregate; this does not
            build an advertising profile of you, and browser-level tracking
            protection will stop it.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>How long we keep it</h2>
          <p>
            Account information, saved places and itineraries are kept until you
            ask us to delete them or close your account. Published reviews are
            kept while they remain public. Technical logs are short-lived and
            rotate automatically.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Your rights</h2>
          <p>
            You may request a copy of the information we hold about you, ask us to
            correct it, or ask us to delete your account and everything attached
            to it. Email{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will
            respond within a reasonable time. You can also stop sharing
            information with us at any time by not signing in.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Children</h2>
          <p>
            TruGoa is not intended for children under 13, and we do not knowingly
            collect information from them. If you believe a child has provided us
            with personal information, please contact us and we will remove it.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Changes to this policy</h2>
          <p>
            We may update this policy from time to time. When we make material
            changes, we will revise the date at the top of this page. Continued
            use of the site after an update means you accept the revised policy.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Contact</h2>
          <p>
            Questions about this policy or your information:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </div>
      </div>
    </>
  );
}
