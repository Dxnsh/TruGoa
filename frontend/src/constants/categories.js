import { Palmtree, Utensils, BedDouble, Map, Martini, LayoutGrid } from "lucide-react";

// Shared by the homepage shortcut row and the Explore page's own category
// strip. Both render the same set and the homepage links into Explore using
// `key`, so keeping one definition here stops the two lists drifting apart and
// producing links that open a section that doesn't exist.
export const CATEGORIES = [
  { key: "beaches",   label: "Beaches",     sub: "Sun, sand & sea",      icon: Palmtree },
  { key: "food",      label: "Food & Drink", sub: "Goa on a plate",      icon: Utensils },
  { key: "stays",     label: "Stays",       sub: "Hotels & homestays",   icon: BedDouble },
  { key: "hidden",    label: "Hidden Goa",  sub: "Off the beaten path",  icon: Map },
  { key: "nightlife", label: "Nightlife",   sub: "After dark",           icon: Martini },
  { key: "all",       label: "View All",    sub: "All categories",       icon: LayoutGrid },
];

// "all" is the reset option — it clears the filter rather than opening a
// section of its own, so it's excluded from the openable keys.
export const OPENABLE_CATEGORY_KEYS = CATEGORIES
  .filter((c) => c.key !== "all")
  .map((c) => c.key);
