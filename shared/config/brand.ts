import { getActiveLocations } from "./locations";
import { BOOKING_PRODUCT_PRICES } from "./bookingPricing";

export const brand = {
  name: "Miramar Forklift Training",
  legalEntity: "Miramar Forklift Training",
  domain: "miramarforklift.com",
  tagline: "San Diego's Trusted Forklift Training Provider",
  description: "OSHA-aligned forklift operator certification and training in San Diego. In-person and on-site programs with same-day certification. 10+ years of experience.",

  support: {
    email: "online@miramarforklift.com",
    infoEmail: "online@miramarforklift.com",
    phone: "(858) 901-0149",
    phoneE164: "+1-858-901-0149",
    phoneTel: "+18589010149",
  },

  address: {
    street: "6365 Marindustry Dr #A",
    city: "San Diego",
    state: "CA",
    zip: "92121",
    full: "6365 Marindustry Dr #A, San Diego, CA 92121",
  },

  emails: {
    noreply: (typeof process !== "undefined" && process.env?.FROM_EMAIL_OVERRIDE) || "noreply@miramarforklift.com",
  // staging → FROM_EMAIL_OVERRIDE=noreply@resend.dev (bypasses domain verification)
    fromName: "Miramar Forklift Training",
    get from() {
      return `${brand.emails.fromName} <${brand.emails.noreply}>`;
    },
  },

  logo: {
    navbar: "/images/miramar-navbar-56h.png",
    mark: "/images/miramar-navbar-44h.png",
    full: "/images/miramar-logo-transparent.png",
    fullDark: "/images/miramar-logo-darkbg.png",
    favicon: "/favicon.png",
    serverFile: "miramar-logo-transparent.png",
  },

  og: {
    defaultImage: "/images/hero-forklift.jpg",
  },

  social: {
    facebook: "",
    instagram: "",
    linkedin: "",
    twitter: "",
    youtube: "",
  },

  locations: getActiveLocations().map(l => ({ name: l.displayName, slug: l.slug })),

  prefixes: {
    orderNumber: "MFT",
    invoiceNumber: "INV",
  },

  // Display pricing derives from the authoritative charge table in
  // bookingPricing.ts — never hardcode numbers here. LocationPage renders
  // this grid, so it must match what the booking wizard actually charges.
  pricing: {
    inPerson: {
      standard: { name: "Standard Forklift", price: BOOKING_PRODUCT_PRICES["standard-forklift-certification-san-diego"] },
      scissorAerial: { name: "Scissor Lift + Aerial", price: BOOKING_PRODUCT_PRICES["scissor-aerial-boom-lift-certification-san-diego"] },
      reachForklift: { name: "Reach Truck + Forklift", price: BOOKING_PRODUCT_PRICES["reach-forklift-training-san-diego"] },
      orderPickerForklift: { name: "Order Picker + Forklift", price: BOOKING_PRODUCT_PRICES["order-picker-forklift-training-san-diego"] },
      forkliftScissorEpj: { name: "Forklift + Scissor Lift + EPJ", price: BOOKING_PRODUCT_PRICES["forklift-scissor-lift-epj-certification-san-diego"] },
      fullMultiEquipment: { name: "Full Multi-Equipment", price: BOOKING_PRODUCT_PRICES["complete-equipment-certification-san-diego"] },
    },
  },

  salesReps: ["Stan", "Peter"],
} as const;

export type Brand = typeof brand;
