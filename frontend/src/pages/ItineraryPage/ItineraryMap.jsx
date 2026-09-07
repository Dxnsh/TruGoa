import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// One colour per day, reused past 10 days. Kept in sync with the legend the
// page renders next to the map.
export const DAY_COLORS = [
  "#E5471F", "#2D6A4F", "#4A2882", "#B86A00", "#1A5C38",
  "#9333EA", "#0369A1", "#BE123C", "#4D7C0F", "#C2410C",
];

/**
 * Plots every itinerary stop that has coordinates, numbered within its day and
 * coloured by day, with a dashed line tracing each day's order. The active day
 * is drawn solid; the others dim. Clicking a pin (or its day's line) switches
 * the page to that day.
 *
 * No Leaflet marker images are used — pins are CSS `divIcon`s — so nothing
 * needs the asset-path shim bundlers otherwise require.
 */
export default function ItineraryMap({ days = [], activeDay = 0, onSelectDay }) {
  const elRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const selectRef = useRef(onSelectDay);
  selectRef.current = onSelectDay;

  // Init once.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: "&copy; OpenStreetMap &copy; CARTO",
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    // Tiles can render into a zero-size box if the container is still settling
    // (fonts, the scroll-into-view on the result view) — nudge it once more.
    const t = setTimeout(() => map.invalidateSize(false), 250);
    return () => {
      clearTimeout(t);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Redraw markers whenever the itinerary or the active day changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    // The container may have been laid out (or resized) after init.
    map.invalidateSize(false);

    layerRef.current?.remove();
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    const bounds = [];

    days.forEach((day, di) => {
      const color = DAY_COLORS[di % DAY_COLORS.length];
      const dim = di !== activeDay;
      const pts = (day.slots || []).filter(
        (s) => typeof s.latitude === "number" && typeof s.longitude === "number"
      );

      if (pts.length > 1) {
        L.polyline(
          pts.map((s) => [s.latitude, s.longitude]),
          { color, weight: 3, opacity: dim ? 0.2 : 0.65, dashArray: "1 7", lineCap: "round" }
        )
          .on("click", () => selectRef.current?.(di))
          .addTo(group);
      }

      pts.forEach((s, si) => {
        bounds.push([s.latitude, s.longitude]);
        const icon = L.divIcon({
          className: "ir-map-pinwrap",
          html: `<span class="ir-map-pin" style="background:${color};opacity:${dim ? 0.45 : 1};z-index:${dim ? 1 : 2}">${si + 1}</span>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
          popupAnchor: [0, -12],
        });
        L.marker([s.latitude, s.longitude], { icon })
          .bindPopup(
            `<strong>${s.place}</strong><br>` +
              `<span style="color:#8a8a8a">Day ${day.day}${s.time ? ` · ${s.time}` : ""}</span>` +
              (s.slug ? `<br><a href="/listings/${s.slug}">Open listing &rarr;</a>` : "")
          )
          .on("click", () => selectRef.current?.(di))
          .addTo(group);
      });
    });

    if (bounds.length === 1) {
      map.setView(bounds[0], 13);
    } else if (bounds.length > 1) {
      map.fitBounds(L.latLngBounds(bounds).pad(0.2), { animate: false });
    } else {
      map.setView([15.4, 73.95], 10); // Goa, nothing to plot
    }
  }, [days, activeDay]);

  return <div ref={elRef} className="ir-map" />;
}
