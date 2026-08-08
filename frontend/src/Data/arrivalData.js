import {
  Plane,
  Train,
  Bus,
  Hotel,
  KeyRound,
  UtensilsCrossed,
  Compass,
} from "lucide-react";

export const ARRIVAL_OPTIONS = [
  {
    id: "flight",
    title: "Flight",
    subtitle: "Mopa / Dabolim Airport",
    icon: Plane,

    steps: [
      {
        title: "You've Arrived",
        icon: Plane,
        description:
          "Welcome to Goa. Collect your luggage and head towards the arrival gate.",
      },
      {
        title: "Reach Your Stay",
        icon: Hotel,
        description:
          "Travel to your hotel and get settled before starting your adventure.",
      },
      {
        title: "Check In",
        icon: KeyRound,
        description:
          "Complete your check-in, leave your luggage and relax.",
      },
      {
        title: "Grab a Meal",
        icon: UtensilsCrossed,
        description:
          "Enjoy your first Goan meal before heading out.",
      },
      {
        title: "Start Exploring",
        icon: Compass,
        description:
          "You're all set. Let your Goa journey begin.",
      },
    ],
  },

  {
    id: "train",
    title: "Train",
    subtitle: "Madgaon Railway Station",
    icon: Train,
    steps: [],
  },

  {
    id: "bus",
    title: "Bus",
    subtitle: "Kadamba Bus Stand",
    icon: Bus,
    steps: [],
  },
];