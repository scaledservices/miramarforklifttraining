import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";

export type ProductCategory = "online" | "hands-on" | "trainer" | "business";
export type ProductLocation = "san-diego" | "online";
type InternalLocation = ProductLocation | "las-vegas" | "fresno";

export interface BulkPricingTier {
  minSeats: number;
  pricePerSeat: number;
  label: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  courseSlug?: string;
  category: ProductCategory;
  location: ProductLocation;
  shortDescription: string;
  longDescription: string;
  duration: string;
  includes: string[];
  price: number | "call";
  originalPrice?: number;
  priceLabel?: string;
  ctaLabel: string;
  externalPurchaseUrl: string;
  metaTitle: string;
  metaDescription: string;
  featured?: boolean;
  equipmentCovered?: string[];
  classSchedule?: string[];
  languages?: string[];
  address?: string;
  bulkPricing?: BulkPricingTier[];
  supportsTeam?: boolean;
  image?: string;
  imageAlt?: string;
}

interface InternalProduct extends Omit<Product, "location"> {
  location: InternalLocation;
}

export function getBulkPrice(product: Product, seats: number): number {
  if (!product.bulkPricing || product.bulkPricing.length === 0) {
    return typeof product.price === "number" ? product.price : 0;
  }
  let tier = product.bulkPricing[0];
  for (const t of product.bulkPricing) {
    if (seats >= t.minSeats) tier = t;
  }
  return tier.pricePerSeat;
}

export function getBulkTotal(product: Product, seats: number): number {
  return getBulkPrice(product, seats) * seats;
}

const categoryImageFallback: Record<string, string> = {
  online: "/images/online-learning.jpg",
  "hands-on": "/images/training-class.jpg",
  trainer: "/images/trainer-instructor.jpg",
  business: "/images/certification-cards.jpg",
};

export function getProductImage(product: Product): string {
  return product.image || categoryImageFallback[product.category] || "/images/training-class.jpg";
}

const imageAltKeyMap: Record<string, string> = {
  "/images/online-learning.jpg": "productImages.onlineLearning",
  "/images/training-class.jpg": "productImages.trainingClass",
  "/images/trainer-instructor.jpg": "productImages.trainerInstructor",
  "/images/certification-cards.jpg": "productImages.certificationCards",
  "/images/warehouse-facility.jpg": "productImages.warehouseFacility",
  "/images/reach-truck.jpg": "productImages.reachTruck",
  "/images/scissor-lift.jpg": "productImages.scissorLift",
  "/images/certification-success.jpg": "productImages.certificationSuccess",
};

export function getProductImageAltKey(product: Product): string | null {
  const img = getProductImage(product);
  return imageAltKeyMap[img] || null;
}

const ACTIVE_LOCATIONS: InternalLocation[] = ["san-diego", "las-vegas", "fresno", "online"];

const internalCatalog: InternalProduct[] = [
  // ─── ONLINE CERTIFICATION (UNIFIED: INDIVIDUAL + CREW) ───────────
  {
    id: "pit-online",
    title: "Powered Industrial Trucks – Forklift Operator Certification",
    slug: "online-forklift-operator-training",
    courseSlug: "online-forklift-operator-certification",
    category: "online",
    location: "online",
    shortDescription: `Master essential forklift skills with our online, self-paced ${industry.regulatory.body}-compliant course. Receive your industry-recognized certificate immediately upon completion.`,
    longDescription: `Our comprehensive online Powered Industrial Trucks training program is designed to teach essential forklift skills for ${industry.regulatory.body} compliance and career advancement. Delivered through interactive lessons and real-world scenarios, this self-paced course covers safe operation of industrial trucks and meeting ${industry.regulatory.body} rules. Whether you're a new operator or renewing your certification, study on any device and receive your printable certificate instantly upon passing the final assessment. Training your crew? Add multiple seats and save with volume pricing — you'll get a crew management dashboard to invite members, track progress, and download certificates.`,
    duration: "1-2 hours",
    includes: [
      "Interactive modules and visual aids",
      "Real-world case studies and quizzes",
      "Virtual simulations",
      "Comprehensive safety instruction",
      "Final assessment",
      "Industry-recognized certificate upon completion",
      "Access on any device",
      "Unlimited retakes",
      "Crew management dashboard (2+ seats)",
      "Real-time progress tracking (2+ seats)"
    ],
    price: 45,
    priceLabel: "per seat",
    ctaLabel: "Get Certified Now",
    externalPurchaseUrl: "",
    metaTitle: `Online Forklift Operator Certification | ${industry.regulatory.body}-Compliant | ${brand.name}`,
    metaDescription: `Complete your forklift operator certification online for $45.00/seat. ${industry.regulatory.body}-compliant training with instant certificate. Self-paced, 1-2 hours.`,
    featured: true,
    languages: ["English", "Spanish"],
    supportsTeam: true,
    image: "/images/online-learning.jpg",
    imageAlt: "Worker completing online forklift certification on laptop",
    bulkPricing: [
      { minSeats: 1, pricePerSeat: 45, label: "Flat rate" },
    ],
  },

  // ─── HANDS-ON: SAN DIEGO ─────────────────────────────────────────
  {
    id: "std-forklift-sd",
    image: "/images/training-class.jpg",
    imageAlt: "Forklift operator training in San Diego facility",
    title: "Standard Forklift Certification (Sit-down LPG or EPJ)",
    slug: "standard-forklift-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: "Hands-on forklift certification for sit-down counterbalance (LPG) and electric pallet jack operators in San Diego.",
    longDescription: `Get certified on standard sit-down counterbalance forklifts (LPG) or electric pallet jacks (EPJ) with our hands-on training program in San Diego. This course covers ${industry.regulatory.body} regulations, safe and effective forklift operation through interactive learning experiences, presentations, case studies, group discussions, and warehouse simulation training. Receive your ${industry.regulatory.body}-recognized license and wallet-sized operator ID the same day.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction with presentations",
      "Hands-on warehouse simulation training",
      "Case studies and group discussions",
      "Written and practical evaluation",
      `${industry.regulatory.body}-recognized forklift license`,
      "Wallet-sized operator ID card",
      "Job placement network access"
    ],
    price: 280,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Standard Forklift Certification San Diego | Sit-down & EPJ | ${brand.name}`,
    metaDescription: `Hands-on forklift certification in San Diego for $280. Sit-down LPG and EPJ training with same-day ${industry.regulatory.body} certification.`,
    featured: true,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "scissor-aerial-sd",
    image: "/images/scissor-lift.jpg",
    imageAlt: "Scissor lift and aerial boom lift certification training",
    title: "Standard Scissor & Aerial/Boom Lift Certification",
    slug: "scissor-aerial-boom-lift-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: `Get certified on scissor lifts and aerial/boom lifts in San Diego. Hands-on instruction for safe, ${industry.regulatory.body}-compliant lift operation.`,
    longDescription: `Elevate your career with our Standard Scissor & Aerial/Boom Lift Training in San Diego, offering hands-on instruction for safe, ${industry.regulatory.body}-compliant lift operation. This course provides essential knowledge and practical experience to operate aerial lifts safely and efficiently, covering both scissor lifts and aerial/boom lifts. Ideal for first-time operators seeking certification and experienced operators pursuing recertification or advanced training.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction and presentations",
      "Hands-on scissor lift training",
      "Aerial/boom lift operation training",
      "Fall protection procedures",
      "Hazard assessment training",
      "Pre-operation inspection training",
      "Written and practical assessment",
      "Certificate of completion"
    ],
    price: 200,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Scissor & Aerial Boom Lift Certification San Diego | ${brand.name}`,
    metaDescription: `Scissor and aerial/boom lift certification in San Diego for $200. Same-day ${industry.regulatory.body} certification with hands-on training.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "reach-sd",
    image: "/images/reach-truck.jpg",
    imageAlt: "Reach truck operator training in warehouse",
    title: "Reach Training & Certification",
    slug: "reach-training-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: `Hands-on reach truck operator certification in San Diego. Essential skills and ${industry.regulatory.body}-compliant safety training for efficient reach truck operation.`,
    longDescription: `Our Reach Training & Certification in San Diego is a hands-on course that equips you with essential skills and safety knowledge for operating reach trucks efficiently and in compliance with ${industry.regulatory.body} standards. The combination of classroom instruction and hands-on training ensures you are fully prepared for safe warehouse operations. Ideal for first-time operators seeking certification and experienced operators pursuing recertification or advanced training.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction and presentations",
      "Hands-on reach truck training",
      "Narrow aisle operation techniques",
      "Height management training",
      "Pre-operation inspection procedures",
      "Written and practical assessment",
      "Certificate of completion"
    ],
    price: 300,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Reach Truck Training & Certification San Diego | ${brand.name}`,
    metaDescription: `Reach truck operator certification in San Diego for $300. ${industry.regulatory.body}-compliant hands-on training with same-day certification.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "order-picker-sd",
    image: "/images/warehouse-facility.jpg",
    imageAlt: "Order picker training in warehouse facility",
    title: "Order Picker Training & Certification",
    slug: "order-picker-training-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: `Order picker operator training and certification in San Diego. Hands-on program for safe, ${industry.regulatory.body}-compliant order picking operations.`,
    longDescription: `Boost your career with our Order Picker Training & Certification in San Diego, a hands-on program that equips you with the essential skills for safe, ${industry.regulatory.body}-compliant order picking operations. This course includes dynamic presentations, visual aids, real-world case studies, group discussions, hands-on practical training, and comprehensive safety instruction. Upon successful completion, gain exclusive access to a job placement network.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Dynamic presentations and visual aids",
      "Real-world case studies",
      "Group discussions",
      "Hands-on practical training",
      "Comprehensive safety instruction",
      "Written and practical assessment",
      "Certificate of completion",
      "Job placement network access"
    ],
    price: 300,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Order Picker Training & Certification San Diego | ${brand.name}`,
    metaDescription: `Order picker operator certification in San Diego for $300. ${industry.regulatory.body}-compliant hands-on training with same-day certification.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "reach-forklift-sd",
    image: "/images/reach-truck.jpg",
    imageAlt: "Combined reach truck and forklift training session",
    title: "Hands On Reach & Forklift Training (Sit-down LPG + Reach)",
    slug: "reach-forklift-training-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: "Dual-training combo: sit-down LPG forklift and reach truck certification in San Diego. Two certifications in one session.",
    longDescription: "Boost your career with our Hands On Reach & Forklift Training, a comprehensive dual-training program designed to equip you with essential, hands-on skills for operating both sit-down LPG forklifts and reach trucks safely and efficiently. Get certified on two equipment types quickly and unlock exciting opportunities in warehousing and logistics. Training location is at 6365 Marindustry Dr #a, San Diego, CA 92121.",
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift training",
      "Reach truck operation training",
      "Classroom instruction and presentations",
      "Hands-on practical training",
      "Written evaluations and group discussions",
      "Written and practical assessments",
      "Certificates for both equipment types"
    ],
    price: 490,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Reach & Forklift Combo Training San Diego | ${brand.name}`,
    metaDescription: "Dual reach truck and forklift certification in San Diego for $490. Two certifications in one session with hands-on training.",
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "orderpicker-forklift-sd",
    image: "/images/warehouse-facility.jpg",
    imageAlt: "Order picker and forklift combination training",
    title: "Hands On Order Picker & Forklift Training (Sit-down LPG + Order Picker)",
    slug: "order-picker-forklift-training-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: "Dual-training combo: sit-down LPG forklift and order picker certification in San Diego. Two certifications in one session.",
    longDescription: `Our specialized dual-training program in San Diego equips operators with essential skills and knowledge for managing order picking operations and forklift handling, ensuring compliance with ${industry.regulatory.body} regulations. The training includes dynamic presentations, visual aids, real-world case studies, group discussions, hands-on practical training, comprehensive safety instruction, and assessments. Upon successful completion, gain exclusive access to a job placement network.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift training",
      "Order picker operation training",
      "Dynamic presentations and visual aids",
      "Real-world case studies",
      "Hands-on practical training",
      "Comprehensive safety instruction",
      "Certificates for both equipment types",
      "Job placement network access"
    ],
    price: 490,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Order Picker & Forklift Combo Training San Diego | ${brand.name}`,
    metaDescription: "Dual order picker and forklift certification in San Diego for $490. Two certifications in one session with hands-on training.",
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "forklift-scissor-epj-sd",
    image: "/images/training-class.jpg",
    imageAlt: "Multi-equipment forklift and scissor lift certification",
    title: "Forklift, Scissor Lift & EPJ Certification",
    slug: "forklift-scissor-lift-epj-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: "Triple certification: sit-down LPG forklift, scissor lift, and electric pallet jack (EPJ) in San Diego.",
    longDescription: `Get certified on three equipment types in one comprehensive session. This ${industry.regulatory.body}-compliant training covers safe operation, load handling, and workplace safety for sit-down LPG forklifts, scissor lifts, and electric pallet jacks (EPJ). The program provides essential knowledge and practical experience through a combination of classroom instruction and hands-on training to operate multiple types of industrial equipment safely and efficiently.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift certification",
      "Scissor lift certification",
      "Electric pallet jack (EPJ) certification",
      "Classroom instruction and presentations",
      "Hands-on training for all equipment",
      "Written and practical assessments",
      "Certificates for all three equipment types"
    ],
    price: 550,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Forklift, Scissor Lift & EPJ Certification San Diego | ${brand.name}`,
    metaDescription: `Triple certification in San Diego for $550: forklift, scissor lift, and EPJ. Same-day ${industry.regulatory.body} certification with hands-on training.`,
    equipmentCovered: ["Sit-down LPG Forklift", "Scissor Lift", "Electric Pallet Jack (EPJ)"],
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "all-in-one-sd",
    image: "/images/training-class.jpg",
    imageAlt: "Complete equipment certification training in San Diego",
    title: "Forklift, Scissor Lift, Order Picker/Reach & EPJ Certification",
    slug: "complete-equipment-certification-san-diego",
    category: "hands-on",
    location: "san-diego",
    shortDescription: "All-in-one certification: Forklift + Scissor Lift + Order Picker/Reach + EPJ. Maximum value, complete operator qualifications in San Diego.",
    longDescription: `Our most comprehensive training package in San Diego. Get certified to operate sit-down LPG forklifts, scissor lifts (JLG 1930), order pickers/reach trucks, and electric pallet jacks (EPJ) safely and efficiently, ensuring ${industry.regulatory.body} compliance. This all-in-one program gives operators the widest range of equipment qualifications, making them invaluable assets in any warehouse or industrial setting.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down forklift (LPG) certification",
      "Scissor lift (JLG 1930) certification",
      "Order picker or reach truck certification",
      "Electric pallet jack (EPJ) certification",
      "Classroom instruction for all equipment",
      "Hands-on training for all equipment",
      "Written and practical assessments",
      "Certificates for all equipment types"
    ],
    price: 650,
    ctaLabel: "Book Bundle",
    externalPurchaseUrl: "",
    metaTitle: `Complete Equipment Certification Bundle San Diego | ${brand.name}`,
    metaDescription: "All-in-one certification in San Diego for $650: forklift, scissor lift, order picker/reach, and EPJ. Maximum value bundle.",
    featured: true,
    equipmentCovered: ["Sit-down LPG Forklift", "Scissor Lift (JLG 1930)", "Order Picker / Reach Truck", "Electric Pallet Jack (EPJ)"],
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },

  // ─── HANDS-ON: LAS VEGAS ─────────────────────────────────────────
  {
    id: "std-forklift-lv",
    image: "/images/training-class.jpg",
    imageAlt: "Forklift operator training in Las Vegas facility",
    title: "Standard Forklift Certification (Sit-down LPG or EPJ)",
    slug: "standard-forklift-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: "Hands-on forklift certification for sit-down counterbalance (LPG) and electric pallet jack operators in Las Vegas.",
    longDescription: `Get certified on standard sit-down counterbalance forklifts (LPG) or electric pallet jacks (EPJ) with our hands-on training program in Las Vegas. This course covers ${industry.regulatory.body} regulations, safe and effective forklift operation through interactive learning experiences, presentations, case studies, group discussions, and warehouse simulation training. Receive your ${industry.regulatory.body}-recognized license and wallet-sized operator ID the same day.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction with presentations",
      "Hands-on warehouse simulation training",
      "Case studies and group discussions",
      "Written and practical evaluation",
      `${industry.regulatory.body}-recognized forklift license`,
      "Wallet-sized operator ID card",
      "Job placement network access"
    ],
    price: 280,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Standard Forklift Certification Las Vegas | Sit-down & EPJ | ${brand.name}`,
    metaDescription: `Hands-on forklift certification in Las Vegas for $280. Sit-down LPG and EPJ training with same-day ${industry.regulatory.body} certification.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "scissor-aerial-lv",
    image: "/images/scissor-lift.jpg",
    imageAlt: "Scissor lift certification training in Las Vegas",
    title: "Standard Scissor & Aerial/Boom Lift Certification",
    slug: "scissor-aerial-boom-lift-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: `Get certified on scissor lifts and aerial/boom lifts in Las Vegas. Hands-on instruction for safe, ${industry.regulatory.body}-compliant lift operation.`,
    longDescription: `Elevate your career with our Standard Scissor & Aerial/Boom Lift Training in Las Vegas, offering hands-on instruction for safe, ${industry.regulatory.body}-compliant lift operation. Get certified quickly and unlock enhanced job opportunities in industries like construction and maintenance. Ideal for first-time operators and experienced operators pursuing recertification.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction and presentations",
      "Hands-on scissor lift training",
      "Aerial/boom lift operation training",
      "Fall protection procedures",
      "Hazard assessment training",
      "Pre-operation inspection training",
      "Written and practical assessment",
      "Certificate of completion"
    ],
    price: 200,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Scissor & Aerial Boom Lift Certification Las Vegas | ${brand.name}`,
    metaDescription: `Scissor and aerial/boom lift certification in Las Vegas for $200. Same-day ${industry.regulatory.body} certification with hands-on training.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "reach-lv",
    image: "/images/reach-truck.jpg",
    imageAlt: "Reach truck training and certification in Las Vegas",
    title: "Reach Training & Certification",
    slug: "reach-training-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: `Hands-on reach truck operator certification in Las Vegas. Essential skills and ${industry.regulatory.body}-compliant safety training.`,
    longDescription: `Our Reach Training & Certification in Las Vegas is a hands-on course that equips you with essential skills and safety knowledge for operating reach trucks efficiently and in compliance with ${industry.regulatory.body} standards. The combination of classroom instruction and hands-on training ensures you are fully prepared for safe warehouse operations.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction and presentations",
      "Hands-on reach truck training",
      "Narrow aisle operation techniques",
      "Height management training",
      "Pre-operation inspection procedures",
      "Written and practical assessment",
      "Certificate of completion"
    ],
    price: 300,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Reach Truck Training & Certification Las Vegas | ${brand.name}`,
    metaDescription: `Reach truck operator certification in Las Vegas for $300. ${industry.regulatory.body}-compliant hands-on training with same-day certification.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "order-picker-lv",
    image: "/images/warehouse-facility.jpg",
    imageAlt: "Order picker certification in Las Vegas warehouse",
    title: "Order Picker Training & Certification",
    slug: "order-picker-training-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: `Order picker operator training and certification in Las Vegas. Hands-on program for safe, ${industry.regulatory.body}-compliant order picking operations.`,
    longDescription: `Boost your career with our Order Picker Training & Certification in Las Vegas, a hands-on program that equips you with the essential skills for safe, ${industry.regulatory.body}-compliant order picking operations. Get certified quickly and open doors to exciting opportunities in warehousing and logistics.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Dynamic presentations and visual aids",
      "Real-world case studies",
      "Group discussions",
      "Hands-on practical training",
      "Comprehensive safety instruction",
      "Written and practical assessment",
      "Certificate of completion",
      "Job placement network access"
    ],
    price: 300,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Order Picker Training & Certification Las Vegas | ${brand.name}`,
    metaDescription: `Order picker operator certification in Las Vegas for $300. ${industry.regulatory.body}-compliant hands-on training with same-day certification.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "reach-forklift-lv",
    image: "/images/reach-truck.jpg",
    imageAlt: "Combined reach and forklift training in Las Vegas",
    title: "Hands On Reach & Forklift Training (Sit-down LPG + Reach)",
    slug: "reach-forklift-training-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: "Dual-training combo: sit-down LPG forklift and reach truck certification in Las Vegas. Two certifications in one session.",
    longDescription: "Boost your career with our Hands On Reach & Forklift Training in Las Vegas, a comprehensive dual-training program designed to equip you with essential, hands-on skills for operating both sit-down LPG forklifts and reach trucks safely and efficiently. Get certified quickly and unlock exciting opportunities in warehousing and logistics.",
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift training",
      "Reach truck operation training",
      "Classroom instruction and presentations",
      "Hands-on practical training",
      "Written evaluations and group discussions",
      "Written and practical assessments",
      "Certificates for both equipment types"
    ],
    price: 490,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Reach & Forklift Combo Training Las Vegas | ${brand.name}`,
    metaDescription: "Dual reach truck and forklift certification in Las Vegas for $490. Two certifications in one session.",
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "orderpicker-forklift-lv",
    image: "/images/warehouse-facility.jpg",
    imageAlt: "Order picker and forklift training in Las Vegas",
    title: "Hands On Order Picker & Forklift Training (Sit-down LPG + Order Picker)",
    slug: "order-picker-forklift-training-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: "Dual-training combo: sit-down LPG forklift and order picker certification in Las Vegas. Two certifications in one session.",
    longDescription: `Our specialized dual-training program in Las Vegas equips operators with essential skills and knowledge for managing order picking operations and forklift handling, ensuring compliance with ${industry.regulatory.body} regulations. The training includes dynamic presentations, visual aids, real-world case studies, group discussions, hands-on practical training, and comprehensive safety instruction.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift training",
      "Order picker operation training",
      "Dynamic presentations and visual aids",
      "Real-world case studies",
      "Hands-on practical training",
      "Comprehensive safety instruction",
      "Certificates for both equipment types",
      "Job placement network access"
    ],
    price: 490,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Order Picker & Forklift Combo Training Las Vegas | ${brand.name}`,
    metaDescription: "Dual order picker and forklift certification in Las Vegas for $490. Two certifications in one session.",
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "forklift-scissor-epj-lv",
    image: "/images/training-class.jpg",
    imageAlt: "Multi-equipment certification in Las Vegas",
    title: "Forklift, Scissor Lift & EPJ Certification",
    slug: "forklift-scissor-lift-epj-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: "Triple certification: sit-down LPG forklift, scissor lift, and electric pallet jack (EPJ) in Las Vegas.",
    longDescription: `Get certified on three equipment types in one comprehensive session in Las Vegas. This ${industry.regulatory.body}-compliant training covers safe operation, load handling, and workplace safety for sit-down LPG forklifts, scissor lifts, and electric pallet jacks (EPJ). The program provides essential knowledge and practical experience through classroom instruction and hands-on training.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down LPG forklift certification",
      "Scissor lift certification",
      "Electric pallet jack (EPJ) certification",
      "Classroom instruction and presentations",
      "Hands-on training for all equipment",
      "Written and practical assessments",
      "Certificates for all three equipment types"
    ],
    price: 550,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Forklift, Scissor Lift & EPJ Certification Las Vegas | ${brand.name}`,
    metaDescription: `Triple certification in Las Vegas for $550: forklift, scissor lift, and EPJ. Same-day ${industry.regulatory.body} certification.`,
    equipmentCovered: ["Sit-down LPG Forklift", "Scissor Lift", "Electric Pallet Jack (EPJ)"],
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "all-in-one-lv",
    image: "/images/training-class.jpg",
    imageAlt: "Complete equipment certification training in Las Vegas",
    title: "Forklift, Scissor Lift, Order Picker/Reach & EPJ Certification",
    slug: "complete-equipment-certification-las-vegas",
    category: "hands-on",
    location: "las-vegas",
    shortDescription: "All-in-one certification: Forklift + Scissor Lift + Order Picker/Reach + EPJ. Maximum value, complete operator qualifications in Las Vegas.",
    longDescription: `Our most comprehensive training package in Las Vegas. Get certified to operate sit-down LPG forklifts, scissor lifts (JLG 1930), order pickers/reach trucks, and electric pallet jacks (EPJ) safely and efficiently, ensuring ${industry.regulatory.body} compliance. This all-in-one program gives operators the widest range of equipment qualifications.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Sit-down forklift (LPG) certification",
      "Scissor lift (JLG 1930) certification",
      "Order picker or reach truck certification",
      "Electric pallet jack (EPJ) certification",
      "Classroom instruction for all equipment",
      "Hands-on training for all equipment",
      "Written and practical assessments",
      "Certificates for all equipment types"
    ],
    price: 650,
    ctaLabel: "Book Bundle",
    externalPurchaseUrl: "",
    metaTitle: `Complete Equipment Certification Bundle Las Vegas | ${brand.name}`,
    metaDescription: "All-in-one certification in Las Vegas for $650: forklift, scissor lift, order picker/reach, and EPJ.",
    equipmentCovered: ["Sit-down LPG Forklift", "Scissor Lift (JLG 1930)", "Order Picker / Reach Truck", "Electric Pallet Jack (EPJ)"],
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },

  // ─── HANDS-ON: FRESNO ────────────────────────────────────────────
  {
    id: "std-forklift-fresno",
    image: "/images/training-class.jpg",
    imageAlt: "Forklift operator training in Fresno facility",
    title: "Standard Forklift Certification (Sit-down LPG or EPJ)",
    slug: "standard-forklift-certification-fresno",
    category: "hands-on",
    location: "fresno",
    shortDescription: "Hands-on forklift certification for sit-down counterbalance (LPG) and electric pallet jack operators in Fresno.",
    longDescription: `Get certified on standard sit-down counterbalance forklifts (LPG) or electric pallet jacks (EPJ) with our hands-on training program in Fresno, CA. This course covers ${industry.regulatory.body} regulations, safe and effective forklift operation through interactive learning experiences, presentations, case studies, and warehouse simulation training. Receive your ${industry.regulatory.body}-recognized license and wallet-sized operator ID the same day.`,
    duration: "3-4 hrs (beginners) / 1.5-2 hrs (experienced)",
    includes: [
      "Classroom instruction with presentations",
      "Hands-on warehouse simulation training",
      "Case studies and group discussions",
      "Written and practical evaluation",
      `${industry.regulatory.body}-recognized forklift license`,
      "Wallet-sized operator ID card"
    ],
    price: 280,
    ctaLabel: "Book Training",
    externalPurchaseUrl: "",
    metaTitle: `Standard Forklift Certification Fresno | Sit-down & EPJ | ${brand.name}`,
    metaDescription: `Hands-on forklift certification in Fresno, CA for $280. Sit-down LPG and EPJ training with same-day ${industry.regulatory.body} certification.`,
    languages: ["English", "Spanish"],
  },

  // ─── TRAIN THE TRAINER: PROGRAMS ──────────────────────────────────
  {
    id: "ttt-forklift-sd",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Forklift train the trainer certification in San Diego",
    title: "Forklift Train the Trainer Certification",
    slug: "forklift-train-the-trainer-san-diego",
    category: "trainer",
    location: "san-diego",
    shortDescription: "Become a certified forklift trainer in San Diego. Qualify to train and certify forklift operators at your own facility.",
    longDescription: `Our Train the Trainer certification program in San Diego prepares you to become a qualified forklift training instructor. This comprehensive in-person course covers ${industry.regulatory.body} training requirements, proper evaluation techniques, and hands-on instruction methods. Upon completion, you will be authorized to train and certify forklift operators at your workplace. Includes a binder with all materials.`,
    duration: "2-4 hours",
    includes: [
      "Full instructor-led training",
      `${industry.regulatory.body} compliance curriculum`,
      "Trainer certification upon completion",
      "Binder with all training materials",
      "Evaluation methodology training",
      "Hands-on teaching practice",
      "Classroom instruction and practical exercises"
    ],
    price: 750,
    ctaLabel: "Register Now",
    externalPurchaseUrl: "",
    metaTitle: `Forklift Train the Trainer Certification San Diego | ${brand.name}`,
    metaDescription: "Become a certified forklift trainer in San Diego for $750. Comprehensive program with all materials included.",
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "ttt-forklift-lv",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Forklift train the trainer certification in Las Vegas",
    title: "Forklift Train the Trainer Certification",
    slug: "forklift-train-the-trainer-las-vegas",
    category: "trainer",
    location: "las-vegas",
    shortDescription: "Become a certified forklift trainer in Las Vegas. Qualify to train and certify forklift operators at your own facility.",
    longDescription: `Our Train the Trainer certification program in Las Vegas prepares you to become a qualified forklift training instructor. This comprehensive in-person course covers ${industry.regulatory.body} training requirements, proper evaluation techniques, and hands-on instruction methods. Upon completion, you will be authorized to train and certify forklift operators at your workplace. Includes a binder with all materials.`,
    duration: "2-4 hours",
    includes: [
      "Full instructor-led training",
      `${industry.regulatory.body} compliance curriculum`,
      "Trainer certification upon completion",
      "Binder with all training materials",
      "Evaluation methodology training",
      "Hands-on teaching practice",
      "Classroom instruction and practical exercises"
    ],
    price: 750,
    ctaLabel: "Register Now",
    externalPurchaseUrl: "",
    metaTitle: `Forklift Train the Trainer Certification Las Vegas | ${brand.name}`,
    metaDescription: "Become a certified forklift trainer in Las Vegas for $750. Comprehensive program with all materials included.",
    featured: true,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },
  {
    id: "ttt-scissor-sd",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Scissor lift train the trainer certification in San Diego",
    title: "Scissor & Aerial Lift Train the Trainer Certification",
    slug: "scissor-aerial-train-the-trainer-san-diego",
    category: "trainer",
    location: "san-diego",
    shortDescription: "Become a certified scissor and aerial lift trainer in San Diego. Train and certify aerial lift operators at your facility.",
    longDescription: `This program prepares individuals to train and certify aerial lift operators in compliance with ${industry.regulatory.body} regulations. Focusing on safety protocols, instructional techniques, and risk assessment to improve workplace safety and efficiency. Upon completion, you will be authorized to train and certify scissor lift and aerial lift operators at your workplace. Includes a binder with all materials. Training location is at 6365 Marindustry Dr #a, San Diego, CA 92121.`,
    duration: "2-4 hours",
    includes: [
      "Full instructor-led training",
      `${industry.regulatory.body} compliance curriculum for aerial lifts`,
      "Trainer certification upon completion",
      "Binder with all training materials",
      "Safety protocols and risk assessment",
      "Instructional techniques training",
      "Classroom instruction and practical exercises"
    ],
    price: 750,
    ctaLabel: "Register Now",
    externalPurchaseUrl: "",
    metaTitle: `Scissor & Aerial Lift Train the Trainer San Diego | ${brand.name}`,
    metaDescription: `Become a certified scissor and aerial lift trainer in San Diego for $750. ${industry.regulatory.body}-compliant program with all materials.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
    address: "6365 Marindustry Dr #a, San Diego, CA 92121",
  },
  {
    id: "ttt-scissor-lv",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Scissor lift train the trainer certification in Las Vegas",
    title: "Scissor & Aerial Lift Train the Trainer Certification",
    slug: "scissor-aerial-train-the-trainer-las-vegas",
    category: "trainer",
    location: "las-vegas",
    shortDescription: "Become a certified scissor and aerial lift trainer in Las Vegas. Train and certify aerial lift operators at your facility.",
    longDescription: `This program prepares individuals to train and certify aerial lift operators in compliance with ${industry.regulatory.body} regulations. Focusing on safety protocols, instructional techniques, and risk assessment to improve workplace safety and efficiency. Upon completion, you will be authorized to train and certify scissor lift and aerial lift operators at your workplace. Includes a binder with all materials.`,
    duration: "2-4 hours",
    includes: [
      "Full instructor-led training",
      `${industry.regulatory.body} compliance curriculum for aerial lifts`,
      "Trainer certification upon completion",
      "Binder with all training materials",
      "Safety protocols and risk assessment",
      "Instructional techniques training",
      "Classroom instruction and practical exercises"
    ],
    price: 750,
    ctaLabel: "Register Now",
    externalPurchaseUrl: "",
    metaTitle: `Scissor & Aerial Lift Train the Trainer Las Vegas | ${brand.name}`,
    metaDescription: `Become a certified scissor and aerial lift trainer in Las Vegas for $750. ${industry.regulatory.body}-compliant program with all materials.`,
    classSchedule: ["Monday 9:00 AM", "Monday 1:00 PM", "Wednesday 9:00 AM", "Wednesday 1:00 PM", "Friday 9:00 AM", "Friday 1:00 PM"],
    languages: ["English", "Spanish"],
  },

  // ─── TRAIN THE TRAINER: KITS ──────────────────────────────────────
  {
    id: "ttt-forklift-kit",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Forklift train the trainer certification kit materials",
    title: "Forklift Train The Trainer Kit",
    slug: "forklift-train-the-trainer-kit",
    category: "trainer",
    location: "online",
    shortDescription: `Complete ${industry.regulatory.body}-compliant forklift trainer kit with digital presentations, training video, manuals, checklists, tests, and certification supplies.`,
    longDescription: `Our comprehensive Forklift Train the Trainer Kit delivers all the ${industry.regulatory.body}-compliant materials you need for effective forklift operator training. This all-in-one package includes digital presentations, a training video, manuals, checklists, tests, certificates, and wallet cards — perfect for on-site training that keeps your operations safe and efficient. Covers counterbalanced forklifts, reach trucks, pallet trucks, and other powered industrial trucks. Available in English and Spanish.`,
    duration: "Ships to you",
    includes: [
      `${industry.regulatory.body}-approved training documentation`,
      "Digital forklift training presentation",
      "FREE Forklift Operator Training Video ($100 value)",
      "Comprehensive operator and safety manuals",
      "Daily inspection checklist and evaluation forms",
      "Written and practical tests with answer keys",
      "20 Certificates of Achievement",
      "20 wallet cards"
    ],
    price: 350,
    ctaLabel: "Order Trainer Kit",
    externalPurchaseUrl: "",
    metaTitle: `Forklift Train the Trainer Kit | ${industry.regulatory.body}-Compliant Materials | ${brand.name}`,
    metaDescription: "Complete forklift trainer kit for $350. Includes presentations, video, manuals, tests, 20 certificates, and 20 wallet cards.",
    equipmentCovered: ["Counterbalanced Forklifts", "Reach Trucks", "Pallet Trucks", "Other Powered Industrial Trucks"],
    languages: ["English", "Spanish"],
  },
  {
    id: "ttt-scissor-kit",
    image: "/images/trainer-instructor.jpg",
    imageAlt: "Scissor lift train the trainer certification kit materials",
    title: "Scissor Lift Train The Trainer Kit",
    slug: "scissor-lift-train-the-trainer-kit",
    category: "trainer",
    location: "online",
    shortDescription: `Complete ${industry.regulatory.body}-compliant scissor lift trainer kit with digital presentations, training video, manuals, checklists, tests, and certification supplies.`,
    longDescription: `Our comprehensive Scissor Lift Train the Trainer Kit delivers all the ${industry.regulatory.body}-compliant materials you need for effective scissor lift operator training. This all-in-one package includes digital presentations, a training video, manuals, checklists, tests, certificates, and wallet cards — perfect for on-site training that keeps your operations safe and efficient. Covers scissor lifts and related aerial work platforms. Available in English and Spanish.`,
    duration: "Ships to you",
    includes: [
      `${industry.regulatory.body}-approved training documentation`,
      "Digital scissor lift training presentation",
      "FREE Scissor Lift Training Video ($100 value)",
      "Comprehensive operator and safety manuals",
      "Daily inspection checklist and evaluation forms",
      "Written and practical tests with answer keys",
      "20 Certificates of Achievement",
      "20 wallet cards"
    ],
    price: 350,
    ctaLabel: "Order Trainer Kit",
    externalPurchaseUrl: "",
    metaTitle: `Scissor Lift Train the Trainer Kit | ${industry.regulatory.body}-Compliant Materials | ${brand.name}`,
    metaDescription: "Complete scissor lift trainer kit for $350. Includes presentations, video, manuals, tests, 20 certificates, and 20 wallet cards.",
    equipmentCovered: ["Scissor Lifts", "Aerial Work Platforms"],
    languages: ["English", "Spanish"],
  },

  // ─── BUSINESS PRODUCTS ────────────────────────────────────────────
  {
    id: "cert-cards",
    image: "/images/certification-cards.jpg",
    imageAlt: "Forklift operator certification wallet cards",
    title: "Certification Cards",
    slug: "certification-cards",
    category: "business",
    location: "online",
    shortDescription: `${industry.regulatory.body}-compliant wallet-sized forklift certification cards for documenting operator training. Portable proof of certification.`,
    longDescription: `Our ${brand.name} Certification Cards are designed for documenting forklift operator training. These ${industry.regulatory.body}-compliant cards provide easy recordkeeping, portable proof of certification, and cost-effective documentation for your trained operators. Each set includes 20 glossy cards optimized for pens or markers. Available in English and Spanish.`,
    duration: "Ships to you",
    includes: [
      "20 glossy certification cards per set",
      `${industry.regulatory.body}-compliant format`,
      "Optimized for pens or markers",
      "Wallet-sized for portability",
      "Operator name and certification date fields",
      "Available in English and Spanish"
    ],
    price: 12,
    ctaLabel: "Order Cards",
    externalPurchaseUrl: "",
    metaTitle: `Forklift Certification Cards | ${industry.regulatory.body}-Compliant | ${brand.name}`,
    metaDescription: `${industry.regulatory.body}-compliant forklift certification cards for $12/set of 20. Glossy, wallet-sized cards for documenting operator training.`,
    languages: ["English", "Spanish"],
  },
  {
    id: "cert-kit",
    image: "/images/certification-cards.jpg",
    imageAlt: "Complete forklift training certification kit",
    title: `${brand.name} Training Certification Kit`,
    slug: "forklift-training-certification-kit",
    category: "business",
    location: "online",
    shortDescription: `Complete ${industry.regulatory.body}-approved in-house forklift training kit with presentations, video, manuals, tests, certificates, and wallet cards.`,
    longDescription: `Our comprehensive ${brand.name} Training Certification Kit provides everything your organization needs to conduct ${industry.regulatory.body}-compliant in-house forklift operator training. This all-in-one package includes ${industry.regulatory.body}-approved training documentation, digital and printed presentations, a USB with all materials, a FREE training video, operator and safety manuals, inspection checklists, evaluation forms, tests with answer keys, certificates, and wallet cards. Covers counterbalanced forklifts, reach trucks, pallet trucks, and other powered industrial trucks. Available in English and Spanish.`,
    duration: "Ships to you",
    includes: [
      `${industry.regulatory.body}-approved training documentation`,
      "Digital and printed forklift training presentations",
      "USB drive with all materials",
      "FREE Forklift Operator Training Video",
      "Comprehensive operator and safety manuals",
      "Daily inspection checklists and evaluation forms",
      "Written and practical tests with answer keys",
      "20 Certificates of Achievement",
      "20 wallet cards"
    ],
    price: 350,
    ctaLabel: "Order Kit",
    externalPurchaseUrl: "",
    metaTitle: `Forklift Training Certification Kit | In-House Training | ${brand.name}`,
    metaDescription: `Complete ${industry.regulatory.body}-approved forklift training kit for $350. Includes video, presentations, manuals, tests, 20 certificates, and wallet cards.`,
    equipmentCovered: ["Counterbalanced Forklifts", "Reach Trucks", "Pallet Trucks", "Other Powered Industrial Trucks"],
    languages: ["English", "Spanish"],
  },
];

export const catalog: Product[] = internalCatalog.filter(
  (p) => (ACTIVE_LOCATIONS as string[]).includes(p.location)
) as Product[];

export function getProductsByCategory(category: ProductCategory): Product[] {
  return catalog.filter((p) => p.category === category);
}

export function getProductsByLocation(location: ProductLocation): Product[] {
  return catalog.filter((p) => p.location === location);
}

export function getProductBySlug(slug: string): Product | undefined {
  return catalog.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return catalog.filter((p) => p.featured);
}

export function formatPrice(price: number | "call", priceLabel?: string): string {
  if (price === "call") return "Contact for Pricing";
  const formatted = `$${price.toFixed(2)}`;
  return priceLabel ? `${formatted} ${priceLabel}` : formatted;
}
