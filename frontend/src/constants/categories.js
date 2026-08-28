import { Palmtree, Utensils, BedDouble, Map, Martini, Church, LayoutGrid,Images,Landmark, BookOpen, } from "lucide-react";

export const CATEGORIES = [
  { key: "beaches",   label: "Beaches",     sub: "Sun, sand & sea",      icon: Palmtree },
  { key: "food",      label: "Food & Drink", sub: "Goa on a plate",      icon: Utensils },
  { key: "stays",     label: "Stays",       sub: "Hotels & homestays",   icon: BedDouble },
  { key: "hidden",    label: "Hidden Goa",  sub: "Off the beaten path",  icon: Map },
  { key: "nightlife", label: "Nightlife",   sub: "After dark",           icon: Martini },
  {
    key: "art",
    label: "Art & Galleries",
    sub: "Contemporary art, galleries and creative spaces across Goa.",
    icon: Images,
  },
  {
    key: "museum",
    label: "Museums",
    sub: "Collections, history and culture on display",
    icon: Landmark,
  },
  {
    key: "library",
    label: "Libraries",
    sub: "Reading rooms and quiet corners",
    icon: BookOpen,
  },

  { key: "temples",   label: "Temples",     sub: "Temples & holy places", icon: Church },
  { key: "all",       label: "View All",    sub: "All categories",       icon: LayoutGrid },
  
];

export const OPENABLE_CATEGORY_KEYS = CATEGORIES
  .filter((c) => c.key !== "all")
  .map((c) => c.key);
