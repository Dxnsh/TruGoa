import {
  Utensils,
  Waves,
  Coffee,
  Compass,
  ShoppingBag,
  Hotel,
  MapPin
} from "lucide-react";

export const mapBusiness = (biz, index) => {
  const category = biz.category?.toLowerCase() || "general";

  const categoryIconMap = {
    restaurant: <Utensils size={24} />,
    cafe: <Coffee size={24} />,
    hotel: <Hotel size={24} />,
    stay: <Hotel size={24} />,
    activity: <Compass size={24} />,
    market: <ShoppingBag size={24} />,
    beach: <Waves size={24} />,
    general: <MapPin size={24} />,
  };

  return {
    id: biz._id || index,
    name: biz.name,
    location: biz.location,
    category: biz.category || "General",
    price: biz.price_range || "Contact for price",
    priceLabel: "per person",
    rating: biz.rating || 0,
    reviews: biz.review_count || 0,
    trust: biz.trust_level,
    badge: biz.trust_level === "verified" ? "top" : null,

    icon: categoryIconMap[category],

    images: biz.images || [],
    tags: biz.tags || ["Goa"],
    desc: biz.description || "A popular place in Goa.",
    localTip: biz.local_tip || "Visit during non-peak hours.",
  };
};