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
  /** "About our training center" paragraph shown on the location page. */
  about: string;
  seo: {
    title: string;
    description: string;
  };
  /** Spanish overrides for user-facing text (used on /es pages). */
  es?: {
    hours: string;
    equipmentTypes: string[];
    about: string;
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
    about:
      "Our San Diego training center at 8760 Miramar Place offers hands-on forklift classes with a same-day certificate and wallet card. Most employers choose onsite training: our trainer comes to your warehouse or job site anywhere in the San Diego area and certifies your crew on the equipment they use every day. Equipment covered here includes sit-down counterbalance forklifts, reach trucks, order pickers, electric pallet jacks, scissor lifts and aerial/boom lifts.",
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
      about:
        "Nuestro centro de capacitación en San Diego, en 8760 Miramar Place, ofrece clases prácticas de montacargas con certificado y tarjeta de billetera el mismo día. La mayoría de los empleadores eligen la capacitación en sitio: nuestro instructor va a su almacén o lugar de trabajo en cualquier parte del área de San Diego y certifica a su equipo en el equipo que usan todos los días. El equipo que cubrimos aquí incluye montacargas de contrapeso de asiento, reach trucks, order pickers, transpaletas eléctricas, elevadores de tijera y elevadores aéreos/de pluma.",
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
    about:
      "Our Las Vegas training center at 3301 W Martin Ave Ste A offers hands-on forklift classes with a same-day certificate and wallet card. Most employers choose onsite training: our trainer comes to your warehouse or job site anywhere in the Las Vegas area and certifies your crew on the equipment they use every day. Equipment covered here includes sit-down counterbalance forklifts, reach trucks, order pickers and electric pallet jacks.",
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
      about:
        "Nuestro centro de capacitación en Las Vegas, en 3301 W Martin Ave Ste A, ofrece clases prácticas de montacargas con certificado y tarjeta de billetera el mismo día. La mayoría de los empleadores eligen la capacitación en sitio: nuestro instructor va a su almacén o lugar de trabajo en cualquier parte del área de Las Vegas y certifica a su equipo en el equipo que usan todos los días. El equipo que cubrimos aquí incluye montacargas de contrapeso de asiento, reach trucks, order pickers y transpaletas eléctricas.",
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
    about:
      "Our Fresno training location at 3515 N. Sabre Drive offers hands-on forklift classes by appointment, with a same-day certificate and wallet card. Most employers choose onsite training: our trainer comes to your warehouse or job site anywhere in the Fresno area and certifies your crew on the equipment they use every day. Call us to schedule a class or request a quote for onsite training.",
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
      about:
        "Nuestra ubicación de capacitación en Fresno, en 3515 N. Sabre Drive, ofrece clases prácticas de montacargas con cita previa, con certificado y tarjeta de billetera el mismo día. La mayoría de los empleadores eligen la capacitación en sitio: nuestro instructor va a su almacén o lugar de trabajo en cualquier parte del área de Fresno y certifica a su equipo en el equipo que usan todos los días. Llámenos para programar una clase o solicite una cotización para capacitación en sitio.",
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
