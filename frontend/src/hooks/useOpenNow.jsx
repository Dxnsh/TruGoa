import { useEffect, useState } from "react";
import { isPlaceOpenNow, openLabel, openTone } from "../utils/isPlaceOpenNow";

// Keeps a place's open/closed badge honest on a tab that's been left open.
//
// `place` is a mapped business (or anything carrying `openingHours` plus the
// server's flattened openStatus/closesAt/nextOpenTime). On mount and every
// `intervalMs` after, it re-derives the state from `openingHours` in IST; if
// the object isn't there it falls back to whatever the server last said.
//
// Returns { status, label, tone } — status is "open" | "closed" | "unknown",
// label is the badge text ("Open now" / "Opens 6 PM" / null), tone is
// "open" | "closing-soon" | "closed" | null.
export default function useOpenNow(place, intervalMs = 60_000) {
  const compute = () => {
    if (place?.openingHours && typeof place.openingHours === "object") {
      const r = isPlaceOpenNow(place.openingHours);
      return { status: r.status, label: openLabel(r), tone: openTone(r) };
    }
    // No hours object to recompute from — trust the server's snapshot.
    if (place?.openStatus) {
      return { status: place.openStatus, label: openLabel(place), tone: openTone(place) };
    }
    return { status: "unknown", label: null, tone: null };
  };

  const [state, setState] = useState(compute);

  useEffect(() => {
    setState(compute());
    const id = setInterval(() => setState(compute()), intervalMs);
    return () => clearInterval(id);
    // Re-run when the underlying place changes (new fetch, swipe to next card).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id, place?.slug, place?.openingHours, intervalMs]);

  return state;
}
