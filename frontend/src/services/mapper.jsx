import {
  Utensils, Waves, Coffee, Compass,
  ShoppingBag, Hotel, MapPin, Moon, Landmark, Church,
} from "lucide-react";

// Maps a raw MongoDB Business document → clean frontend object
// All components (BizCard, DetailPage) read from this shape
export const mapBusiness = (biz, index) => {
  const category = biz.category?.toLowerCase() || "general";
  

  const categoryIconMap = {
    restaurant: <Utensils  size={24} />,
    cafe:       <Coffee    size={24} />,
    hotel:      <Hotel     size={24} />,
    stay:       <Hotel     size={24} />,
    activity:   <Compass   size={24} />,
    market:     <ShoppingBag size={24} />,
    beach:      <Waves     size={24} />,
    nightlife:  <Moon      size={24} />,
    heritage:   <Landmark  size={24} />,
    spiritual:  <Church    size={24} />,
    general:    <MapPin    size={24} />,
  };

  return {
    // ── Identity
    id:          biz._id    || index,
    slug:        biz.slug   || "",
    name:        biz.name   || "",
    category:    biz.category    || "general",
    subCategory: biz.subCategory || "",
    icon:        categoryIconMap[category] || categoryIconMap.general,

    // ── Content
    tagline:     biz.tagline     || "",
    desc:        biz.description || "A verified place in Goa.",
    story:       biz.story       || "",
    localTip:    biz.localTip    || "",
    highlights:  biz.highlights  || [],
    mustTry:     biz.mustTry     || [],
    bestTime:    biz.bestTime    || "",
    idealFor:    biz.idealFor    || [],
    visitDuration: biz.visitDuration || "",

    // ── Location
    location:     biz.location    || "",
    area:         biz.area        || "",
    latitude:     biz.latitude    || null,
    longitude:    biz.longitude   || null,
    googleMapUrl: biz.googleMapUrl || "",

    // ── Pricing
    price:       biz.priceRange  || "Contact for price",
    priceLevel:  biz.priceLevel  || "mid",

    // ── Practical
    // Structured per-day hours (drives the open/closed badge + filter) and the
    // freeform note shown on the detail page. `openingHours` used to be the
    // freeform string — that's `openingHoursNote` now.
    openingHours:     biz.openingHours || null,
    openingHoursNote: biz.openingHoursNote || "",
    phone:        biz.phone        || "",
    website:      biz.website      || "",

    // ── Open state (computed server-side in IST, refreshed client-side by
    //    useOpenNow for long-lived tabs)
    isOpenNow:       biz.isOpenNow ?? null,
    openStatus:      biz.openStatus || (biz.openingHours ? null : "unknown"),
    opensAt:         biz.opensAt || null,
    closesAt:        biz.closesAt || null,
    closesInMinutes: biz.closesInMinutes ?? null,
    nextOpenTime:    biz.nextOpenTime || null,

    // ── Media
    // Media
      // ── Media
      image:
        biz.heroImage ||
        biz.gallery?.[0]?.url ||
        biz.gallery?.[0] ||
        null,

      heroImage:
        biz.heroImage ||
        biz.gallery?.[0]?.url ||
        null,

      images: biz.gallery || [],

    // ── Safety
    scamAlert:   biz.scamAlert  || null,
    safetyTip:   biz.safetyTip  || null,

   // ── Trust
        verified:    biz.verified   || false,
        featured:    biz.featured   || false,
        editorPick:  biz.editorPick || false,
        trust:       biz.verified ? "verified" : "unverified",
        badge:
          biz.editorPick
            ? "editor"
            : biz.featured
            ? "top"
            : null,

        // ── Tags
        tags: biz.tags || [],

        // ── Stats
        rating:      biz.rating      || 0,
        reviews:     biz.reviewCount || 0,
  };
};