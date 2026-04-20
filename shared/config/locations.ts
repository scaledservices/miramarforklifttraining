export interface TrainingLocation {
  slug: string;
  displayName: string;
  city: string;
  state: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    full: string;
  };
  phone: string;
  phoneTel: string;
  hours: string;
  active: boolean;
  supportsInPerson: boolean;
  supportsOnsite: boolean;
  equipmentTypes: string[];
  heroImage: string;
  seo: {
    title: string;
    description: string;
  };
}

export const LOCATION_SLUGS = ["san-diego", "las-vegas", "fresno"] as const;
export type LocationSlug = (typeof LOCATION_SLUGS)[number];

export const LOCATION_TYPES = ["facility", "customer_onsite"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const locations: Record<LocationSlug, TrainingLocation> = {
  "san-diego": {
    slug: "san-diego",
    displayName: "San Diego, CA",
    city: "San Diego",
    state: "CA",
    address: {
      street: "6365 Marindustry Dr #A",
      city: "San Diego",
      state: "CA",
      zip: "92121",
      full: "6365 Marindustry Dr #A, San Diego, CA 92121",
    },
    phone: "(858) 901-0149",
    phoneTel: "+18589010149",
    hours: "Mon–Fri: 7:00 AM – 5:00 PM",
    active: true,
    supportsInPerson: true,
    supportsOnsite: true,
    equipmentTypes: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Reach Truck",
      "Order Picker",
      "Electric Pallet Jack (EPJ)",
      "Scissor Lift",
      "Aerial/Boom Lift",
    ],
    heroImage: "/images/san-diego.jpg",
    seo: {
      title: "Forklift Training in San Diego",
      description: "OSHA-aligned forklift certification in San Diego. In-person at our Miramar facility or on-site at your location.",
    },
  },
  "las-vegas": {
    slug: "las-vegas",
    displayName: "Las Vegas, NV",
    city: "Las Vegas",
    state: "NV",
    address: {
      street: "",
      city: "Las Vegas",
      state: "NV",
      zip: "",
      full: "Las Vegas, NV",
    },
    phone: "(858) 901-0149",
    phoneTel: "+18589010149",
    hours: "Mon–Fri: 7:00 AM – 5:00 PM",
    active: false,
    supportsInPerson: false,
    supportsOnsite: true,
    equipmentTypes: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Reach Truck",
      "Order Picker",
      "Electric Pallet Jack (EPJ)",
      "Scissor Lift",
      "Aerial/Boom Lift",
    ],
    heroImage: "/images/hero-forklift.jpg",
    seo: {
      title: "Forklift Training in Las Vegas",
      description: "OSHA-aligned forklift certification in Las Vegas. On-site training at your facility.",
    },
  },
  fresno: {
    slug: "fresno",
    displayName: "Fresno, CA",
    city: "Fresno",
    state: "CA",
    address: {
      street: "",
      city: "Fresno",
      state: "CA",
      zip: "",
      full: "Fresno, CA",
    },
    phone: "(858) 901-0149",
    phoneTel: "+18589010149",
    hours: "Mon–Fri: 7:00 AM – 5:00 PM",
    active: false,
    supportsInPerson: false,
    supportsOnsite: true,
    equipmentTypes: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Reach Truck",
      "Order Picker",
      "Electric Pallet Jack (EPJ)",
      "Scissor Lift",
      "Aerial/Boom Lift",
    ],
    heroImage: "/images/hero-forklift.jpg",
    seo: {
      title: "Forklift Training in Fresno",
      description: "OSHA-aligned forklift certification in Fresno. On-site training at your facility.",
    },
  },
};

export function getLocation(slug: string): TrainingLocation | undefined {
  return locations[slug as LocationSlug];
}

export function getActiveLocations(): TrainingLocation[] {
  return Object.values(locations).filter((l) => l.active);
}

export function getAllLocations(): TrainingLocation[] {
  return Object.values(locations);
}

export function isValidLocationSlug(slug: string): slug is LocationSlug {
  return LOCATION_SLUGS.includes(slug as LocationSlug);
}

export function isValidLocationType(type: string): type is LocationType {
  return LOCATION_TYPES.includes(type as LocationType);
}
