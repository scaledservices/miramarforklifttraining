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
  /** Spanish overrides for user-facing text (used on /es pages). */
  es?: {
    hours: string;
    equipmentTypes: string[];
    seo: {
      title: string;
      description: string;
    };
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
      street: "8760 Miramar Place",
      city: "San Diego",
      state: "CA",
      zip: "92121",
      full: "8760 Miramar Place, San Diego, CA 92121",
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
    es: {
      hours: "Lun-Vie: 7:00 AM - 5:00 PM",
      equipmentTypes: [
        "Montacargas de Contrapeso de Asiento (LPG)",
        "Reach Truck",
        "Order Picker",
        "Transpaleta Eléctrica (EPJ)",
        "Elevador de Tijera",
        "Elevador Aéreo/de Pluma",
      ],
      seo: {
        title: "Capacitación de Montacargas en San Diego",
        description: "Certificación de montacargas alineada con OSHA en San Diego. Presencial en nuestra instalación de Miramar o en el sitio de su empresa.",
      },
    },
  },
  "las-vegas": {
    slug: "las-vegas",
    displayName: "Las Vegas, NV",
    city: "Las Vegas",
    state: "NV",
    address: {
      street: "3301 W. Martin Ave Suite A",
      city: "Las Vegas",
      state: "NV",
      zip: "89118",
      full: "3301 W. Martin Ave Suite A, Las Vegas, NV 89118",
    },
    phone: "(858) 901-0149",
    phoneTel: "+18589010149",
    hours: "Mon-Fri: 7:00 AM - 5:00 PM",
    active: true,
    supportsInPerson: true,
    supportsOnsite: true,
    equipmentTypes: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Reach Truck",
      "Order Picker",
      "Electric Pallet Jack (EPJ)",
    ],
    heroImage: "/images/las-vegas.jpg",
    seo: {
      title: "Forklift Training in Las Vegas",
      description: "OSHA-aligned forklift certification in Las Vegas. In-person at our facility or on-site at your location.",
    },
    es: {
      hours: "Lun-Vie: 7:00 AM - 5:00 PM",
      equipmentTypes: [
        "Montacargas de Contrapeso de Asiento (LPG)",
        "Reach Truck",
        "Order Picker",
        "Transpaleta Eléctrica (EPJ)",
      ],
      seo: {
        title: "Capacitación de Montacargas en Las Vegas",
        description: "Certificación de montacargas alineada con OSHA en Las Vegas. Presencial en nuestra instalación o en el sitio de su empresa.",
      },
    },
  },
  fresno: {
    slug: "fresno",
    displayName: "Fresno, CA",
    city: "Fresno",
    state: "CA",
    address: {
      street: "3515 N. Sabre Drive",
      city: "Fresno",
      state: "CA",
      zip: "93727",
      full: "3515 N. Sabre Drive, Fresno, CA 93727",
    },
    phone: "(858) 901-0149",
    phoneTel: "+18589010149",
    hours: "By appointment - Call to schedule",
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
    heroImage: "/images/fresno-city.jpg",
    seo: {
      title: "Forklift Training in Fresno",
      description: "OSHA-aligned forklift certification in Fresno. In-person at our facility or on-site at your location.",
    },
    es: {
      hours: "Con cita previa: llame para programar",
      equipmentTypes: [
        "Montacargas de Contrapeso de Asiento (LPG)",
        "Reach Truck",
        "Order Picker",
        "Transpaleta Eléctrica (EPJ)",
        "Elevador de Tijera",
        "Elevador Aéreo/de Pluma",
      ],
      seo: {
        title: "Capacitación de Montacargas en Fresno",
        description: "Certificación de montacargas alineada con OSHA en Fresno. Presencial en nuestra instalación o en el sitio de su empresa.",
      },
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
