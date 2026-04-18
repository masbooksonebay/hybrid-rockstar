export type VendorStatus = "active" | "coming_soon" | "disabled";

export interface Vendor {
  slug: string;
  name: string;
  tagline: string;
  url: string | null;
  officialPartner: boolean;
  status: VendorStatus;
}

export type CategoryKey =
  | "shoes"
  | "apparel"
  | "wearables"
  | "race_equipment"
  | "home_training_gear"
  | "nutrition_fuel";

export interface Category {
  key: CategoryKey;
  label: string;
  icon: string;
  vendors: Vendor[];
}

export const CATEGORIES: Category[] = [
  {
    key: "shoes",
    label: "SHOES",
    icon: "footsteps-outline",
    vendors: [
      {
        slug: "puma-shoes",
        name: "PUMA",
        tagline: "HYROX race kit and footwear",
        url: "https://us.puma.com",
        officialPartner: true,
        status: "active",
      },
      {
        slug: "nike",
        name: "Nike",
        tagline: "Running shoes for training and race day",
        url: "https://www.nike.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "saucony",
        name: "Saucony",
        tagline: "Energy-return racing shoes",
        url: "https://www.saucony.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "nobull",
        name: "Nobull",
        tagline: "Hybrid training shoes",
        url: "https://www.nobullproject.com",
        officialPartner: false,
        status: "active",
      },
    ],
  },
  {
    key: "apparel",
    label: "APPAREL",
    icon: "shirt-outline",
    vendors: [
      {
        slug: "puma-apparel",
        name: "PUMA",
        tagline: "HYROX race kit and footwear",
        url: "https://us.puma.com",
        officialPartner: true,
        status: "active",
      },
      {
        slug: "northern-spirit",
        name: "NorthernSpirit",
        tagline: "Hyrox-native technical apparel",
        url: "https://northernspirit.co",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "hybrid-rockstar-shop",
        name: "Hybrid Rockstar Shop",
        tagline: "Coming soon",
        url: null,
        officialPartner: false,
        status: "coming_soon",
      },
    ],
  },
  {
    key: "wearables",
    label: "WEARABLES",
    icon: "watch-outline",
    vendors: [
      {
        slug: "garmin",
        name: "Garmin",
        tagline: "GPS watches for training and racing",
        url: "https://www.garmin.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "amazfit",
        name: "Amazfit",
        tagline: "Official HYROX wearable partner",
        url: "https://us.amazfit.com",
        officialPartner: true,
        status: "active",
      },
    ],
  },
  {
    key: "race_equipment",
    label: "RACE EQUIPMENT",
    icon: "fitness-outline",
    vendors: [
      {
        slug: "centr",
        name: "Centr",
        tagline: "Official HYROX race equipment",
        url: "https://centr.com",
        officialPartner: true,
        status: "active",
      },
      {
        slug: "concept2",
        name: "Concept2",
        tagline: "Official HYROX SkiErg and Rower",
        url: "https://www.concept2.com",
        officialPartner: true,
        status: "active",
      },
    ],
  },
  {
    key: "home_training_gear",
    label: "HOME TRAINING GEAR",
    icon: "barbell-outline",
    vendors: [
      {
        slug: "rogue-fitness",
        name: "Rogue Fitness",
        tagline: "Premium race-grade training gear",
        url: "https://www.roguefitness.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "rep-fitness",
        name: "REP Fitness",
        tagline: "Quality equipment at competitive pricing",
        url: "https://www.repfitness.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "titan-fitness",
        name: "Titan Fitness",
        tagline: "Budget home setups for hybrid athletes",
        url: "https://www.titan.fitness",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "goruck",
        name: "Goruck",
        tagline: "Near-indestructible sandbags",
        url: "https://www.goruck.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "assault-fitness",
        name: "Assault Fitness",
        tagline: "Air bikes and assault runners",
        url: "https://assaultfitness.com",
        officialPartner: false,
        status: "active",
      },
    ],
  },
  {
    key: "nutrition_fuel",
    label: "NUTRITION & FUEL",
    icon: "cafe-outline",
    vendors: [
      {
        slug: "the-feed",
        name: "The Feed",
        tagline: "Endurance nutrition marketplace",
        url: "https://thefeed.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "maurten",
        name: "Maurten",
        tagline: "Race-day hydrogel fueling",
        url: "https://www.maurten.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "lmnt",
        name: "LMNT",
        tagline: "Sodium-forward electrolytes",
        url: "https://drinklmnt.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "bpn",
        name: "BPN (Bare Performance Nutrition)",
        tagline: "Clean supplements for endurance athletes",
        url: "https://www.bareperformancenutrition.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "nutricost",
        name: "Nutricost",
        tagline: "Budget-friendly supplements",
        url: "https://www.nutricost.com",
        officialPartner: false,
        status: "active",
      },
      {
        slug: "myprotein",
        name: "MyProtein",
        tagline: "Official HYROX nutrition partner",
        url: "https://us.myprotein.com",
        officialPartner: true,
        status: "active",
      },
      {
        slug: "red-bull",
        name: "Red Bull",
        tagline: "Official HYROX energy partner",
        url: "https://www.redbull.com",
        officialPartner: true,
        status: "active",
      },
    ],
  },
];

export const DEFAULT_OPEN_CATEGORIES: CategoryKey[] = ["shoes", "nutrition_fuel"];
