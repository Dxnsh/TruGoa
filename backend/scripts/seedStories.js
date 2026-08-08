import "dotenv/config";
import mongoose from "mongoose";
import Story from "../models/Story.js";

const STORIES = [
  {
    category: "DESTINATIONS",
    slug: "destinations",
    title: "Where Goa Still Breathes",
    desc: "Quiet coastlines, timeless villages and soulful roads.",
    image: "/images/destination.jpg",
    readTime: "6 min",
    manifestoTitle: "Some places do not enter your life loudly. They arrive softly… and stay forever.",
    manifestoText1:
      `The real Goa begins where the crowds disappear.

      It lives in silent coastal roads where the only sound is the wind moving through coconut trees.
      In tiny villages painted with fading colours and old memories.
      In homes where grandparents still sit outside at sunset, watching life pass slowly as if time itself forgot this place exists.`,
    manifestoText2:
      `Early mornings here feel sacred.

      The sky turns soft blue over empty beaches.
      Fishermen return with tired eyes and peaceful hearts.
      The smell of fresh bread escapes from small bakeries before the town wakes up.
      Church bells echo gently through the air while rainwater still rests on old red roads from the night before.

      And for a moment… everything feels still.

      No pressure.
      No rush.
      No need to become someone else.

      Just you, the sea, and the feeling of finally breathing deeply again.`,
    stories: [
      {
        slug: "quiet-beaches-tourists-miss",
        title: "7 Quiet Beaches Tourists Rarely Find",
        excerpt: "Where the sea still feels private.",
        image: "/images/beaches.jpg",
        readTime: "5 min",
        pullQuote: "The kind of quiet that makes you lower your voice without meaning to.",

        location: "Agonda, South Goa",
        latitude: 15.0447,
        longitude: 73.9926,

        introTitle: "South Goa's best-kept secret",
        introBody:
          `Imagine stepping onto a stretch of sand where the loudest sound is the surf itself. That's Agonda and the string of coves south of it — Kakolem, Khola, Cabo de Rama — beaches that never made it onto the package-tour circuit.

          These aren't hidden because they're hard to reach. They're hidden because nobody bothered to build a road straight to them, and that's exactly what kept them whole. No beach clubs, no jet-ski touts, no queue for a sunset photo. Just fishing boats pulled up on the sand and a handful of shacks that close when the owner feels like it.

          Go in the early morning or the low season and you'll understand what Goa's coastline felt like before it became a headline.`,

        activities: [
          {
            title: "Dawn walk along Agonda",
            desc: "Four kilometres of flat, empty sand — best walked barefoot before the shacks open.",
            image: "/images/beaches.jpg",
          },
          {
            title: "Cliff-top views at Cabo de Rama",
            desc: "An old Portuguese fort perched above the water, with a view that costs nothing.",
            image: "/images/hidden-gems.jpg",
          },
          {
            title: "Turtle nesting season",
            desc: "Olive Ridley turtles nest on Agonda between November and March — ask locals where to watch, respectfully, from a distance.",
            image: "/images/explore.jpg",
          },
        ],

        nearestAirport: "Manohar International Airport (Mopa)",
        nearestRailway: "Canacona (Chaudi) Railway Station",
      },
      {
        slug: "villages-worth-visiting",
        title: "Goan Villages Worth Waking Early For",
        excerpt: "Slow mornings and old charm.",
        image: "/images/hidden-gems.jpg",
        readTime: "4 min",
        pullQuote: "Some villages don't perform for visitors. They simply let you watch.",

        location: "Chandor & Fontainhas, Goa",
        latitude: 15.2183,
        longitude: 74.0060,

        introTitle: "Where old Goa still lives",
        introBody:
          `Long before the beaches, Goa was villages — Portuguese-tiled courtyards, spice-scented kitchens, and churches whose bells still set the rhythm of the day. Chandor, Fontainhas and the backroads around Divar Island hold onto that rhythm even now.

          Nothing here is staged for visitors. A grandmother sweeping her doorstep at 6am isn't a photo opportunity, it's Tuesday. That's precisely the appeal — you're not watching a performance of heritage, you're passing through someone's actual, ordinary morning.`,

        activities: [
          {
            title: "Fontainhas heritage walk",
            desc: "Panaji's Latin Quarter — ochre and azure townhouses along cobbled lanes, best walked at sunrise.",
            image: "/images/hidden-gems.jpg",
          },
          {
            title: "Divar Island by ferry",
            desc: "A five-minute free ferry ride into a village with no cars, just paddy fields and one very old church.",
            image: "/images/destination.jpg",
          },
          {
            title: "Chandor's old mansions",
            desc: "Portuguese-era ancestral homes, some still lived in by the families who built them centuries ago.",
            image: "/images/explore.jpg",
          },
        ],

        nearestAirport: "Dabolim (Goa International) Airport",
        nearestRailway: "Margao (Madgaon) Railway Station",
      },
    ],
  },

  {
    category: "FOOD & DRINK",
    slug: "food-drink",
    title: "Where Goa Really Eats",
    desc: "Seafood tables, cafés and places locals trust.",
    image: "/images/food.jpg",
    readTime: "5 min",
    manifestoTitle: "Why This Matters",
    manifestoText1:
      "Some places are not discovered through maps, but through the feeling they leave behind. Goa still lives in quiet coastlines, old villages, and roads that ask you to slow down.",
    manifestoText2:
      "These stories are for travellers seeking depth, and for locals who know Goa is more than what is shown first.",
    stories: [
      {
        slug: "best-seafood-locals-love",
        title: "Seafood Spots Locals Return To",
        excerpt: "Fresh catch and no tourist traps.",
        image: "/images/food.jpg",
        readTime: "4 min",
        pullQuote: "Ask what came in this morning. That's the dish you order.",

        location: "Siolim & Mala, Goa",
        latitude: 15.6217,
        longitude: 73.7500,

        introTitle: "The kitchens that never advertise",
        introBody:
          `The best seafood in Goa is rarely the place with the biggest sign facing the highway. It's a home kitchen in Siolim that only does lunch, or a stall in Mala where the fish curry rice sells out by 2pm and that's that — no reprint, come back tomorrow.

          These are the kitchens locals actually eat at. No laminated menus with photos, no "authentic Goan thali" banners. Just whatever the boats brought in, cooked the way it's always been cooked.`,

        activities: [
          {
            title: "Morning fish market run",
            desc: "Follow a local to the morning market — the best kitchens shop here before 8am.",
            image: "/images/food.jpg",
          },
          {
            title: "Recheado and rava fry tasting",
            desc: "Two ways to cook the same catch — spice-stuffed or crumb-fried. Order both and compare.",
            image: "/images/drinks.jpg",
          },
          {
            title: "Toddy shop hopping",
            desc: "Old-school toddy shops pair seafood with the local palm brew — cheap, unpretentious, and usually the best table in town.",
            image: "/images/explore.jpg",
          },
        ],

        nearestAirport: "Manohar International Airport (Mopa)",
        nearestRailway: "Thivim Railway Station",
      },
    ],
  },

  {
    category: "BEACHES",
    slug: "beaches",
    title: "Golden Shores Beyond The Crowd",
    desc: "Sunrise sands and quieter horizons.",
    image: "/images/beaches.jpg",
    readTime: "5 min",
    manifestoTitle: "Why This Matters",
    manifestoText1:
      "Some places are not discovered through maps, but through the feeling they leave behind. Goa still lives in quiet coastlines, old villages, and roads that ask you to slow down.",
    manifestoText2:
      "These stories are for travellers seeking depth, and for locals who know Goa is more than what is shown first.",
    stories: [
      {
        slug: "sunrise-over-agonda",
        title: "Sunrise Over Agonda",
        excerpt: "The first light, before the shacks open.",
        image: "/images/beaches.jpg",
        readTime: "3 min",
        pullQuote: "You have the whole beach to yourself for about an hour. Take it.",

        location: "Agonda Beach, South Goa",
        latitude: 15.0447,
        longitude: 73.9926,

        introTitle: "The hour before Goa wakes up",
        introBody:
          `There's a version of Agonda that only exists between 6 and 7am — flat gold light, footprints from exactly one dog and one fisherman, and a stillness that the day will slowly erode as the shacks open and the first swimmers arrive.

          It doesn't take planning, just an early alarm. Walk the four kilometres of sand while it's still cool, watch the boats head out, and you'll understand why people who've done this once tend to keep doing it every morning of their trip.`,

        activities: [
          {
            title: "Sunrise beach walk",
            desc: "The full stretch of Agonda, nearly empty, with the tide line freshly reset overnight.",
            image: "/images/beaches.jpg",
          },
          {
            title: "Watch the fishing boats head out",
            desc: "Local crews launch just after first light — a quiet, unhurried scene worth sitting for.",
            image: "/images/explore.jpg",
          },
          {
            title: "Breakfast at a shack that just opened",
            desc: "The first chai of the day, made before the beach fills up.",
            image: "/images/food.jpg",
          },
        ],

        nearestAirport: "Dabolim (Goa International) Airport",
        nearestRailway: "Canacona (Chaudi) Railway Station",
      },
    ],
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  let created = 0;
  for (const story of STORIES) {
    const existing = await Story.findOne({ slug: story.slug });
    if (existing) {
      await Story.updateOne({ slug: story.slug }, story);
      console.log(`Updated: ${story.slug}`);
      continue;
    }
    await Story.create(story);
    created++;
    console.log(`Created: ${story.slug}`);
  }

  console.log(`\nDone. ${created} stories created, ${STORIES.length - created} updated.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
