import { Helmet } from "react-helmet-async";

const SITE_NAME = "TruGoa";
const SITE_URL = "https://trugoa.in";
const DEFAULT_DESCRIPTION =
  "TruGoa is the trusted local guide to Goa — verified restaurants, cafes, stays, beaches and experiences, with honest tips locals actually use.";
const DEFAULT_IMAGE = `${SITE_URL}/images/Hero-img.jpg`;

/**
 * Drop this in any page to control <title>, meta description, canonical URL,
 * Open Graph/Twitter tags, and optional JSON-LD structured data.
 *
 * `path` is the route path (e.g. "/listings/britto-baga"), used to build the
 * canonical URL — pass it rather than reading window.location so it works
 * identically during any future SSR/prerender pass.
 */
export default function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "",
  image = DEFAULT_IMAGE,
  type = "website",
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Real Goa, Verified Local`;
  const canonical = `${SITE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}

export { SITE_NAME, SITE_URL, DEFAULT_DESCRIPTION, DEFAULT_IMAGE };
