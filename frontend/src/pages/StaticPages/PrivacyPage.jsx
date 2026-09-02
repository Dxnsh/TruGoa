import SEO from "../../components/SEO/SEO";
import "./StaticPages.css";

// Everything below describes services this application actually uses. Nothing
// here is boilerplate: Google sign-in, Cloudinary, Groq, MongoDB Atlas, Vercel
// Analytics and GA4 (G-2PF4ZTR8DE, loaded in index.html) are all wired up in
// the current code. If a service is removed, remove it from this page too.
export default function PrivacyPage() {
  return (
    <>
      <SEO
        path="/privacy"
        title="Privacy Policy — TruGoa"
        description="What TruGoa collects, why, who it is shared with, and how to have it deleted."
      />

      <section className="tg-static-hero">
        <span className="tg-static-eyebrow">Legal</span>
        <h1 className="tg-static-headline">Privacy Policy</h1>
        <p className="tg-static-subhead">
          What we collect, why we collect it, and what we do not do with it.
          Last updated 3 September 2026.
        </p>
      </section>

      <div className="tg-static-body">
        <div className="tg-static-section">
          <h2>The short version</h2>
          <p>
            TruGoa is a curated guide to Goa. You can read the entire site without
            an account. We do not sell your data, and we do not run advertising.
            The only personal information we hold is what you give us when you sign
            in, save a place, write a review or send us a message.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>What we collect</h2>
          <p>
            <strong>If you sign in with Google.</strong> We receive your name, email
            address and profile picture from Google, and store them so we can show
            who you are and keep your saved places attached to you. We never receive
            your Google password.
          </p>
          <p>
            <strong>If you save places.</strong> A list of the listings you have
            saved, stored against your account.
          </p>
          <p>
            <strong>If you write a review.</strong> Your name, the rating and text
            you wrote, any city or country you chose to add, any photos you attached,
            and which listings you have marked as helpful. Reviews are public.
          </p>
          <p>
            <strong>If you generate or save an itinerary.</strong> The preferences you
            picked — trip length, budget band, vibe, interests, travel style — and the
            resulting itinerary, so you can come back to it.
          </p>
          <p>
            <strong>If you use GoaGuide AI.</strong> The messages you send in that
            conversation, for as long as it takes to answer them.
          </p>
          <p>
            <strong>If you contact us.</strong> Your name, email address and message.
          </p>
          <p>
            <strong>Automatically.</strong> Our servers keep short-lived request logs
            containing IP addresses, which we use to apply rate limits and to
            investigate errors and abuse.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Who we share it with</h2>
          <p>
            We use a small number of third-party services to run the site. Each one
            receives only what it needs:
          </p>
          <p>
            <strong>Google (Sign-In).</strong> Handles authentication when you choose
            to sign in. Governed by Google's own privacy policy.
          </p>
          <p>
            <strong>MongoDB Atlas.</strong> Our database. Everything described above
            is stored there.
          </p>
          <p>
            <strong>Cloudinary.</strong> Hosts the images on the site, including any
            photos attached to a review.
          </p>
          <p>
            <strong>Groq.</strong> Runs the language model behind GoaGuide AI and the
            itinerary planner. The messages and preferences you submit are sent to
            Groq to generate a reply.
          </p>
          <p>
            <strong>Vercel.</strong> Hosts the website and provides Vercel Analytics,
            which counts page views without using cookies or building a profile of you.
          </p>
          <p>
            <strong>Render.</strong> Hosts our API.
          </p>
          <p>
            <strong>Google Analytics 4.</strong> Measures how the site is used, in
            aggregate. GA4 sets cookies and collects a trimmed IP address. If you would
            rather not be counted, browser-level tracking protection or an ad blocker
            will stop it, and Google publishes an opt-out browser add-on.
          </p>
          <p>
            We do not sell personal information, and we do not share it with advertisers.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Cookies and local storage</h2>
          <p>
            We keep your sign-in token and a small amount of session information in
            your browser's local storage so you stay signed in between visits.
            Clearing your browser data signs you out. Google Analytics sets its own
            cookies as described above; nothing else on TruGoa does.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>How long we keep it</h2>
          <p>
            Account information, saved places and itineraries are kept until you ask
            us to delete them. Reviews are kept while they are published. Request logs
            are short-lived and rotate automatically.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Your choices</h2>
          <p>
            You can ask us for a copy of what we hold about you, ask us to correct it,
            or ask us to delete your account and everything attached to it. Email{" "}
            <a href="mailto:hello@trugoa.in">hello@trugoa.in</a> and we will action it.
            You can stop sharing data with us at any time by not signing in — the site
            works without an account.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Children</h2>
          <p>
            TruGoa is not intended for children under 13, and we do not knowingly
            collect information from them.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Changes</h2>
          <p>
            If this policy changes materially we will update the date at the top of
            this page. Continued use of the site after a change means you accept it.
          </p>
        </div>

        <div className="tg-static-section">
          <h2>Contact</h2>
          <p>
            Questions about any of this: <a href="mailto:hello@trugoa.in">hello@trugoa.in</a>.
          </p>
        </div>
      </div>
    </>
  );
}
