import type { InsertSeoPage } from "../shared/schema";

export const STATES = [
  { name: "Alabama", abbr: "AL" }, { name: "Alaska", abbr: "AK" }, { name: "Arizona", abbr: "AZ" },
  { name: "Arkansas", abbr: "AR" }, { name: "California", abbr: "CA" }, { name: "Colorado", abbr: "CO" },
  { name: "Connecticut", abbr: "CT" }, { name: "Delaware", abbr: "DE" }, { name: "Florida", abbr: "FL" },
  { name: "Georgia", abbr: "GA" }, { name: "Hawaii", abbr: "HI" }, { name: "Idaho", abbr: "ID" },
  { name: "Illinois", abbr: "IL" }, { name: "Indiana", abbr: "IN" }, { name: "Iowa", abbr: "IA" },
  { name: "Kansas", abbr: "KS" }, { name: "Kentucky", abbr: "KY" }, { name: "Louisiana", abbr: "LA" },
  { name: "Maine", abbr: "ME" }, { name: "Maryland", abbr: "MD" }, { name: "Massachusetts", abbr: "MA" },
  { name: "Michigan", abbr: "MI" }, { name: "Minnesota", abbr: "MN" }, { name: "Mississippi", abbr: "MS" },
  { name: "Missouri", abbr: "MO" }, { name: "Montana", abbr: "MT" }, { name: "Nebraska", abbr: "NE" },
  { name: "Nevada", abbr: "NV" }, { name: "New Hampshire", abbr: "NH" }, { name: "New Jersey", abbr: "NJ" },
  { name: "New Mexico", abbr: "NM" }, { name: "New York", abbr: "NY" }, { name: "North Carolina", abbr: "NC" },
  { name: "North Dakota", abbr: "ND" }, { name: "Ohio", abbr: "OH" }, { name: "Oklahoma", abbr: "OK" },
  { name: "Oregon", abbr: "OR" }, { name: "Pennsylvania", abbr: "PA" }, { name: "Rhode Island", abbr: "RI" },
  { name: "South Carolina", abbr: "SC" }, { name: "South Dakota", abbr: "SD" }, { name: "Tennessee", abbr: "TN" },
  { name: "Texas", abbr: "TX" }, { name: "Utah", abbr: "UT" }, { name: "Vermont", abbr: "VT" },
  { name: "Virginia", abbr: "VA" }, { name: "Washington", abbr: "WA" }, { name: "West Virginia", abbr: "WV" },
  { name: "Wisconsin", abbr: "WI" }, { name: "Wyoming", abbr: "WY" },
];

export const CITIES: { city: string; state: string }[] = [
  { city: "Los Angeles", state: "California" }, { city: "San Diego", state: "California" },
  { city: "San Francisco", state: "California" }, { city: "San Jose", state: "California" },
  { city: "Sacramento", state: "California" }, { city: "Fresno", state: "California" },
  { city: "Long Beach", state: "California" }, { city: "Oakland", state: "California" },
  { city: "Riverside", state: "California" }, { city: "Stockton", state: "California" },
  { city: "Anaheim", state: "California" }, { city: "Irvine", state: "California" },
  { city: "Chula Vista", state: "California" }, { city: "Escondido", state: "California" },
  { city: "Carlsbad", state: "California" }, { city: "Oceanside", state: "California" },
  { city: "El Cajon", state: "California" }, { city: "National City", state: "California" },
  { city: "Vista", state: "California" }, { city: "San Marcos", state: "California" },
  { city: "Temecula", state: "California" }, { city: "Murrieta", state: "California" },
  { city: "Corona", state: "California" }, { city: "Ontario", state: "California" },
  { city: "Rancho Cucamonga", state: "California" }, { city: "Fontana", state: "California" },
  { city: "San Bernardino", state: "California" }, { city: "Pomona", state: "California" },
  { city: "Pasadena", state: "California" }, { city: "Torrance", state: "California" },
  { city: "Downey", state: "California" }, { city: "Norwalk", state: "California" },
  { city: "Whittier", state: "California" }, { city: "Compton", state: "California" },
  { city: "Inglewood", state: "California" }, { city: "El Monte", state: "California" },
  { city: "West Covina", state: "California" }, { city: "Palmdale", state: "California" },
  { city: "Lancaster", state: "California" }, { city: "Santa Clarita", state: "California" },
  { city: "Glendale", state: "California" }, { city: "Burbank", state: "California" },
  { city: "Oxnard", state: "California" }, { city: "Ventura", state: "California" },
  { city: "Thousand Oaks", state: "California" }, { city: "Simi Valley", state: "California" },
  { city: "Huntington Beach", state: "California" }, { city: "Garden Grove", state: "California" },
  { city: "Santa Ana", state: "California" }, { city: "Costa Mesa", state: "California" },
  { city: "Mission Viejo", state: "California" }, { city: "Bakersfield", state: "California" },
  { city: "Visalia", state: "California" },
  { city: "New York City", state: "New York" }, { city: "Buffalo", state: "New York" },
  { city: "Rochester", state: "New York" }, { city: "Albany", state: "New York" },
  { city: "Houston", state: "Texas" }, { city: "Dallas", state: "Texas" },
  { city: "San Antonio", state: "Texas" }, { city: "Austin", state: "Texas" },
  { city: "Fort Worth", state: "Texas" }, { city: "El Paso", state: "Texas" },
  { city: "Chicago", state: "Illinois" }, { city: "Aurora", state: "Illinois" },
  { city: "Rockford", state: "Illinois" }, { city: "Naperville", state: "Illinois" },
  { city: "Phoenix", state: "Arizona" }, { city: "Tucson", state: "Arizona" },
  { city: "Mesa", state: "Arizona" }, { city: "Chandler", state: "Arizona" },
  { city: "Philadelphia", state: "Pennsylvania" }, { city: "Pittsburgh", state: "Pennsylvania" },
  { city: "Jacksonville", state: "Florida" }, { city: "Miami", state: "Florida" },
  { city: "Tampa", state: "Florida" }, { city: "Orlando", state: "Florida" },
  { city: "St. Petersburg", state: "Florida" }, { city: "Fort Lauderdale", state: "Florida" },
  { city: "Columbus", state: "Ohio" }, { city: "Cleveland", state: "Ohio" },
  { city: "Cincinnati", state: "Ohio" }, { city: "Toledo", state: "Ohio" },
  { city: "Indianapolis", state: "Indiana" }, { city: "Fort Wayne", state: "Indiana" },
  { city: "Charlotte", state: "North Carolina" }, { city: "Raleigh", state: "North Carolina" },
  { city: "Denver", state: "Colorado" }, { city: "Colorado Springs", state: "Colorado" },
  { city: "Seattle", state: "Washington" }, { city: "Tacoma", state: "Washington" },
  { city: "Spokane", state: "Washington" },
  { city: "Nashville", state: "Tennessee" }, { city: "Memphis", state: "Tennessee" },
  { city: "Detroit", state: "Michigan" }, { city: "Grand Rapids", state: "Michigan" },
  { city: "Portland", state: "Oregon" }, { city: "Eugene", state: "Oregon" },
  { city: "Las Vegas", state: "Nevada" }, { city: "Reno", state: "Nevada" },
  { city: "Henderson", state: "Nevada" }, { city: "North Las Vegas", state: "Nevada" },
  { city: "Sparks", state: "Nevada" }, { city: "Carson City", state: "Nevada" },
  { city: "Elko", state: "Nevada" }, { city: "Mesquite", state: "Nevada" },
  { city: "Atlanta", state: "Georgia" }, { city: "Savannah", state: "Georgia" },
  { city: "Boston", state: "Massachusetts" }, { city: "Worcester", state: "Massachusetts" },
  { city: "Baltimore", state: "Maryland" },
  { city: "Minneapolis", state: "Minnesota" }, { city: "St. Paul", state: "Minnesota" },
  { city: "Kansas City", state: "Missouri" }, { city: "St. Louis", state: "Missouri" },
  { city: "New Orleans", state: "Louisiana" }, { city: "Baton Rouge", state: "Louisiana" },
  { city: "Salt Lake City", state: "Utah" },
  { city: "Oklahoma City", state: "Oklahoma" }, { city: "Tulsa", state: "Oklahoma" },
  { city: "Milwaukee", state: "Wisconsin" }, { city: "Madison", state: "Wisconsin" },
  { city: "Albuquerque", state: "New Mexico" },
  { city: "Omaha", state: "Nebraska" },
  { city: "Louisville", state: "Kentucky" }, { city: "Lexington", state: "Kentucky" },
  { city: "Hartford", state: "Connecticut" },
  { city: "Richmond", state: "Virginia" }, { city: "Virginia Beach", state: "Virginia" },
  { city: "Charleston", state: "South Carolina" }, { city: "Columbia", state: "South Carolina" },
  { city: "Birmingham", state: "Alabama" }, { city: "Huntsville", state: "Alabama" },
  { city: "Little Rock", state: "Arkansas" },
  { city: "Des Moines", state: "Iowa" },
  { city: "Boise", state: "Idaho" },
  { city: "Honolulu", state: "Hawaii" },
  { city: "Anchorage", state: "Alaska" },
  { city: "Jackson", state: "Mississippi" },
  { city: "Sioux Falls", state: "South Dakota" },
  { city: "Fargo", state: "North Dakota" },
  { city: "Billings", state: "Montana" },
  { city: "Cheyenne", state: "Wyoming" },
  { city: "Burlington", state: "Vermont" },
  { city: "Manchester", state: "New Hampshire" },
  { city: "Portland", state: "Maine" },
  { city: "Wilmington", state: "Delaware" },
  { city: "Providence", state: "Rhode Island" },
  { city: "Charleston", state: "West Virginia" },
];

export const INDUSTRIES = [
  { key: "warehouse", label: "Warehouse & Distribution" },
  { key: "construction", label: "Construction" },
  { key: "manufacturing", label: "Manufacturing" },
  { key: "retail", label: "Retail & Big Box Stores" },
  { key: "logistics", label: "Logistics & Freight" },
];

export const EQUIPMENT_TYPES = [
  { key: "sit-down-counterbalance", label: "Sit-Down Counterbalance Forklift" },
  { key: "stand-up-reach-truck", label: "Stand-Up Reach Truck" },
  { key: "electric-pallet-jack", label: "Electric Pallet Jack" },
  { key: "order-picker", label: "Order Picker" },
  { key: "rough-terrain-forklift", label: "Rough Terrain Forklift" },
];

function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function generatePriorityPages(): InsertSeoPage[] {
  return [
    {
      slug: "forklift-certification-online",
      templateKey: "TEMPLATE_COURSE",
      published: true,
      title: "Online Forklift Certification — OSHA-Compliant Training | $59.99",
      metaDescription: "Get your forklift certification online in as little as one day. Our OSHA-compliant training covers all required topics per 29 CFR 1910.178. Certificate with QR verification included.",
      heroH1: "Online Forklift Certification",
      heroSubtitle: "Complete your OSHA-compliant forklift operator training online. Study at your own pace, earn your certificate the same day.",
      introParagraph: "ForkliftCertified offers a comprehensive online forklift certification program designed to meet OSHA Standard 29 CFR 1910.178 requirements for formal instruction. Our program covers all required knowledge-based training topics including vehicle inspections, load handling, stability principles, pedestrian safety, and workplace hazards. Upon completion, you receive a digital certificate with QR-code verification that employers can instantly confirm.",
      primaryKeyword: "online forklift certification",
      secondaryKeywords: ["forklift certification online", "osha forklift training", "forklift license online"],
      canonicalSlug: "forklift-certification-online",
      bodySections: [
        { type: "step_list", heading: "How It Works", steps: [
          { title: "Create Your Account", description: "Sign up and purchase the certification course for a one-time fee of $59.99." },
          { title: "Complete Online Training", description: "Work through 8 modules covering all OSHA-required topics at your own pace." },
          { title: "Pass the Final Exam", description: "Score 80% or higher on the certification exam. Three attempts included." },
          { title: "Get Certified", description: "Download your certificate immediately. QR-verified and employer-ready." },
        ]},
        { type: "icon_list", heading: "What's Included", items: [
          "8-module comprehensive course covering all OSHA 29 CFR 1910.178 topics",
          "Interactive knowledge checkpoints after each module",
          "Final certification exam with up to 3 attempts",
          "Digital certificate with unique QR verification code",
          "Employer documentation packet (evaluation checklists, authorization forms)",
          "OSHA regulations reference document",
          "Lifetime access to course materials for refresher training",
        ]},
        { type: "comparison_table", heading: "Why Choose ForkliftCertified?", columns: [
          { label: "OSHA-compliant curriculum", ours: "✓", others: "Varies" },
          { label: "QR-verified certificates", ours: "✓", others: "✗" },
          { label: "Employer documentation kit", ours: "✓", others: "✗" },
          { label: "Same-day certification", ours: "✓", others: "3-5 days" },
          { label: "Course access duration", ours: "Lifetime", others: "30-90 days" },
          { label: "Price", ours: "$59.99", others: "$80-$150" },
        ]},
        { type: "callout", variant: "info", heading: "Important: Employer Evaluation Required", content: "OSHA requires three components for operator certification: formal instruction (our online course), practical training, and evaluation. The employer must complete the hands-on evaluation at your worksite. We provide all the documentation tools your employer needs." },
      ],
      faqJson: [
        { q: "How long does the online forklift certification take?", a: "Most students complete the course in 4-6 hours, though you can take as long as you need. You can pause and resume at any time." },
        { q: "Is the online certification OSHA-compliant?", a: "Yes. Our training program covers all topics required by OSHA Standard 29 CFR 1910.178 for the formal instruction component of operator certification." },
        { q: "Do I receive a certificate immediately?", a: "Yes. Once you pass the final exam, your digital certificate is available for immediate download. It includes a unique QR code for employer verification." },
        { q: "Can my employer verify my certification?", a: "Yes. Each certificate has a unique verification code and QR code that links to our verification page, where employers can instantly confirm your certification status." },
        { q: "What if I fail the exam?", a: "You have up to 3 attempts to pass the final exam with a score of 80% or higher. You can review the course material between attempts." },
        { q: "Is the forklift certification valid in all states?", a: "OSHA is a federal agency, so the training requirements under 29 CFR 1910.178 apply nationwide. Some states may have additional requirements." },
      ],
    },
    {
      slug: "forklift-certification-cost",
      templateKey: "TEMPLATE_PRICING",
      published: true,
      title: "Forklift Certification Cost — $59.99 Complete Program | ForkliftCertified",
      metaDescription: "How much does forklift certification cost? Our complete OSHA-compliant online certification is $59.99 with no hidden fees. Includes certificate, employer docs, and lifetime access.",
      heroH1: "How Much Does Forklift Certification Cost?",
      heroSubtitle: "Transparent pricing with no hidden fees. Everything you need for $59.99.",
      introParagraph: "Forklift certification costs vary widely depending on the provider, format, and location. In-person classes typically range from $150-$300, while online programs range from $40-$150. At ForkliftCertified, our complete online certification program costs $59.99 — a one-time payment that includes the full course, certification exam, digital certificate, and employer documentation kit.",
      primaryKeyword: "forklift certification cost",
      secondaryKeywords: ["how much is forklift certification", "forklift training cost", "forklift license cost"],
      bodySections: [
        { type: "comparison_table", heading: "Cost Comparison", columns: [
          { label: "Complete online certification", ours: "$59.99", others: "$80-$150" },
          { label: "In-person classroom training", ours: "N/A", others: "$150-$300" },
          { label: "On-site group training", ours: "Volume discounts", others: "$200-$500/person" },
          { label: "Hidden renewal fees", ours: "None", others: "Common" },
          { label: "Certificate included", ours: "✓ Included", others: "Often extra" },
        ]},
        { type: "icon_list", heading: "What Your $59.99 Includes", items: [
          "Complete 8-module OSHA-compliant training course",
          "Final certification exam (up to 3 attempts)",
          "Digital certificate with QR verification",
          "Employer documentation packet",
          "Lifetime access to course materials",
          "No recurring fees or hidden charges",
        ]},
        { type: "callout", variant: "tip", heading: "Group Discounts Available", content: "Training 5 or more operators? Contact us about volume pricing for businesses and group training programs." },
      ],
      faqJson: [
        { q: "Why does forklift certification cost vary so much?", a: "Costs vary based on training format (online vs. in-person), provider reputation, included materials, and location. Online programs are typically less expensive because they don't require physical facilities or instructors." },
        { q: "Are there any hidden fees?", a: "No. Our $59.99 price includes everything: the full training course, certification exam, digital certificate, and employer documentation kit. There are no renewal fees or surprise charges." },
        { q: "Is cheaper certification less legitimate?", a: "Not necessarily. What matters is that the training covers all OSHA-required topics. Our program is designed to meet all requirements of 29 CFR 1910.178 at a fraction of the cost of in-person training." },
        { q: "Does my employer pay for forklift certification?", a: "Many employers cover the cost of forklift certification as a business expense. OSHA requires employers to provide training at no cost to employees. Check with your employer — they may reimburse you or purchase training directly." },
      ],
    },
    {
      slug: "forklift-certification-near-me",
      templateKey: "TEMPLATE_NEAR_ME_HUB",
      published: true,
      title: "Forklift Certification Near Me — Find Training in Your Area | ForkliftCertified",
      metaDescription: "Find forklift certification near you. Online training available nationwide plus in-person locations. Get certified the same day with OSHA-compliant training.",
      heroH1: "Forklift Certification Near Me",
      heroSubtitle: "Whether you prefer online or in-person training, we have options near you. Our online certification is available in all 50 states.",
      introParagraph: "Looking for forklift certification near you? ForkliftCertified offers OSHA-compliant training accessible from anywhere. Our online certification program lets you complete your training from home or work, while our in-person locations in select cities provide hands-on training options. Select your state below to find training options in your area.",
      primaryKeyword: "forklift certification near me",
      secondaryKeywords: ["forklift training near me", "forklift license near me", "forklift classes near me"],
      bodySections: [
        { type: "icon_list", heading: "Training Options", items: [
          "Online certification available in all 50 states — start immediately",
          "Same-day certification upon course completion",
          "In-person training available at select locations",
          "Group training for businesses with 5+ operators",
        ]},
      ],
      faqJson: [
        { q: "Can I get forklift certified online instead of in person?", a: "Yes. OSHA allows the formal instruction portion of forklift training to be completed online. Our program covers all required topics. Note that your employer must still complete the hands-on practical evaluation at your worksite." },
        { q: "Is forklift certification the same in every state?", a: "OSHA is a federal standard, so the core training requirements apply nationwide. Some states have additional workplace safety requirements. Our program meets the federal standard that applies in all states." },
        { q: "How quickly can I get certified?", a: "With our online program, most students complete the course and receive their certificate the same day. The course typically takes 4-6 hours." },
      ],
    },
    {
      slug: "forklift-certification-requirements",
      templateKey: "TEMPLATE_GUIDE",
      published: true,
      title: "Forklift Certification Requirements — OSHA 29 CFR 1910.178 Guide",
      metaDescription: "Complete guide to forklift certification requirements under OSHA. Learn about the three required training components, age requirements, and employer responsibilities.",
      heroH1: "Forklift Certification Requirements",
      heroSubtitle: "Everything you need to know about OSHA's forklift operator certification requirements.",
      introParagraph: "OSHA Standard 29 CFR 1910.178 establishes the requirements for powered industrial truck (forklift) operator training and certification. Under this standard, employers must ensure that each operator is competent to operate a forklift safely. Understanding these requirements is essential for both operators and employers.",
      primaryKeyword: "forklift certification requirements",
      secondaryKeywords: ["osha forklift requirements", "forklift training requirements", "forklift license requirements"],
      bodySections: [
        { type: "step_list", heading: "Three Required Training Components", steps: [
          { title: "Formal Instruction", description: "Classroom or online training covering all required knowledge topics: vehicle types, operating instructions, hazards, stability, inspections, and OSHA regulations. This is the component our online course fulfills." },
          { title: "Practical Training", description: "Hands-on demonstrations and exercises using the actual equipment the operator will use. This must be conducted at or near the worksite by a qualified trainer." },
          { title: "Evaluation", description: "The employer must evaluate the operator's ability to safely operate the forklift in the actual workplace environment. Our documentation kit includes evaluation checklists." },
        ]},
        { type: "icon_list", heading: "Key Requirements", items: [
          "Operators must be at least 18 years old (OSHA requirement for general industry)",
          "Training must be provided by persons with the knowledge, training, and experience to train operators",
          "Certification must be renewed at least every 3 years",
          "Refresher training is required after accidents, near-misses, or observed unsafe behavior",
          "Employers must keep records of operator training and certification",
          "Training must cover both truck-related and workplace-related topics",
        ]},
        { type: "callout", variant: "warning", heading: "Employer Responsibility", content: "OSHA places the responsibility for forklift operator training squarely on the employer. Employers who allow untrained operators to use forklifts face significant penalties. Our program helps employers fulfill the formal instruction requirement efficiently." },
      ],
      faqJson: [
        { q: "What are the age requirements for forklift certification?", a: "Under OSHA general industry standards, forklift operators must be at least 18 years old. In construction, the minimum age may vary by state. Agricultural exemptions may apply in some cases." },
        { q: "How often does forklift certification need to be renewed?", a: "OSHA requires evaluation of forklift operators at least every three years. Additionally, refresher training is required if an accident occurs, unsafe operation is observed, or workplace conditions change." },
        { q: "Who is responsible for forklift training — the employee or employer?", a: "The employer is responsible for ensuring operators are trained and certified. OSHA requires employers to provide forklift training at no cost to the employee." },
      ],
    },
    {
      slug: "how-to-get-forklift-certified",
      templateKey: "TEMPLATE_GUIDE",
      published: true,
      title: "How to Get Forklift Certified — Step-by-Step Guide | ForkliftCertified",
      metaDescription: "Step-by-step guide to getting your forklift certification. Learn the process, requirements, costs, and how to choose the right training program.",
      heroH1: "How to Get Forklift Certified",
      heroSubtitle: "A straightforward, step-by-step guide to earning your forklift operator certification.",
      introParagraph: "Getting forklift certified is a straightforward process. Whether you're looking to start a new career, meet a job requirement, or update your skills, this guide walks you through everything you need to know — from choosing a training program to receiving your certification.",
      primaryKeyword: "how to get forklift certified",
      secondaryKeywords: ["how to get a forklift license", "forklift certification process", "forklift training steps"],
      bodySections: [
        { type: "step_list", heading: "Steps to Get Certified", steps: [
          { title: "Choose a Training Program", description: "Select an OSHA-compliant training provider. Online programs like ours offer convenience and same-day certification." },
          { title: "Complete the Formal Instruction", description: "Complete the knowledge-based training covering all OSHA-required topics. Our online course has 8 modules and takes 4-6 hours." },
          { title: "Pass the Certification Exam", description: "Demonstrate your knowledge by passing the final exam with a score of 80% or higher." },
          { title: "Receive Your Certificate", description: "Download your digital certificate with QR-code verification. This proves you completed the formal instruction component." },
          { title: "Complete Employer Evaluation", description: "Your employer must conduct a hands-on practical evaluation at your worksite before authorizing you to operate." },
        ]},
        { type: "callout", variant: "tip", heading: "Pro Tip", content: "Choose a training program that provides employer documentation tools. This makes it easy for your supervisor to complete the required practical evaluation and keep proper records." },
      ],
      faqJson: [
        { q: "How long does it take to get forklift certified?", a: "The online training typically takes 4-6 hours to complete. Your employer's practical evaluation may take an additional 1-2 hours. Many people complete the entire process in a single day." },
        { q: "Do I need any prior experience?", a: "No prior experience is needed for the formal instruction component. However, practical experience operating a forklift under supervision is beneficial for the employer evaluation." },
        { q: "Is forklift certification difficult?", a: "Most people find the training straightforward. Our course is designed to be thorough but accessible. You need to score 80% on the exam, and you get up to 3 attempts." },
      ],
    },
    {
      slug: "forklift-certification-card",
      templateKey: "TEMPLATE_CARD_REPLACEMENT",
      published: true,
      title: "Forklift Certification Wallet Card — Professional Operator ID",
      metaDescription: "Order a professional wallet-sized forklift certification card. Durable PVC card with your name, certification number, and QR verification code.",
      heroH1: "Forklift Certification Wallet Card",
      heroSubtitle: "Carry proof of your certification wherever you go. Professional PVC wallet card shipped to your door.",
      introParagraph: "After completing your forklift certification, you receive a digital certificate that can be downloaded and printed. For a professional, durable option, you can order a wallet-sized certification card made from PVC plastic. This card fits in your wallet and provides instant proof of certification on any job site.",
      primaryKeyword: "forklift certification card",
      secondaryKeywords: ["forklift wallet card", "forklift operator card", "forklift license card"],
      bodySections: [
        { type: "icon_list", heading: "Card Features", items: [
          "Professional PVC plastic construction — same material as credit cards",
          "Your full name and certification number printed on the card",
          "QR code for instant employer verification",
          "Certification issue and expiration dates",
          "Compact wallet size — always have your proof of training",
        ]},
      ],
      faqJson: [
        { q: "Do I need a wallet card to prove my certification?", a: "No, the wallet card is optional. Your digital certificate is your official proof of training completion. The wallet card is a convenient way to carry proof on the job." },
        { q: "How long does shipping take?", a: "Wallet cards are typically processed within 1-2 business days and shipped via USPS. Standard shipping takes 5-7 business days; expedited options are available." },
      ],
    },
    {
      slug: "forklift-certification-verification",
      templateKey: "TEMPLATE_VERIFICATION_EXPLAINER",
      published: true,
      title: "Verify Forklift Certification — Instant QR Code Verification",
      metaDescription: "Instantly verify a forklift operator's certification using our QR code system. Employers can confirm certification status, training completion, and expiration dates.",
      heroH1: "Forklift Certification Verification",
      heroSubtitle: "Instantly verify any ForkliftCertified operator's certification status.",
      introParagraph: "Our QR-code verification system allows employers and safety managers to instantly confirm a forklift operator's certification status. Each certificate issued through ForkliftCertified includes a unique verification code and QR code that links directly to our verification page.",
      primaryKeyword: "verify forklift certification",
      secondaryKeywords: ["forklift certification verification", "check forklift license", "forklift cert verification"],
      bodySections: [
        { type: "step_list", heading: "How Verification Works", steps: [
          { title: "Scan the QR Code", description: "Use any smartphone camera to scan the QR code on the operator's certificate or wallet card." },
          { title: "View Certification Details", description: "The verification page displays the operator's name, certification number, completion date, and expiration date." },
          { title: "Confirm Status", description: "See at a glance whether the certification is active, expired, or revoked." },
        ]},
        { type: "callout", variant: "info", heading: "For Employers", content: "Keep verification records as part of your OSHA compliance documentation. Our system provides instant, verifiable proof that operators have completed the formal instruction component of their certification." },
      ],
      faqJson: [
        { q: "Is the verification system free to use?", a: "Yes. Employers and safety managers can verify certifications at no cost by scanning the QR code or entering the certificate number on our verification page." },
        { q: "What information is shown on the verification page?", a: "The verification page shows the operator's name, certificate number, training completion date, certificate expiration date, and current status (active/expired)." },
      ],
    },
    {
      slug: "osha-forklift-training",
      templateKey: "TEMPLATE_OSHA_COMPLIANCE",
      published: true,
      title: "OSHA Forklift Training Requirements — 29 CFR 1910.178 Compliance",
      metaDescription: "Understand OSHA forklift training requirements under 29 CFR 1910.178. Learn what's required for compliance, employer responsibilities, and penalties for non-compliance.",
      heroH1: "OSHA Forklift Training Requirements",
      heroSubtitle: "A comprehensive guide to OSHA Standard 29 CFR 1910.178 and what it means for your business.",
      introParagraph: "OSHA Standard 29 CFR 1910.178 requires that all powered industrial truck (forklift) operators receive proper training before being authorized to operate. This standard applies to all employers where forklifts are used and covers training requirements, evaluation procedures, and ongoing certification obligations.",
      primaryKeyword: "osha forklift training",
      secondaryKeywords: ["osha forklift requirements", "29 cfr 1910.178", "osha forklift certification"],
      bodySections: [
        { type: "icon_list", heading: "OSHA-Required Training Topics", items: [
          "Operating instructions, warnings, and precautions for the types of trucks the operator will use",
          "Differences between truck and automobile operation",
          "Truck controls and instrumentation",
          "Engine or motor operation, steering, and maneuvering",
          "Visibility, including restrictions due to loading",
          "Fork and attachment adaptation, operation, and limitations",
          "Vehicle capacity, stability, and vehicle inspection and maintenance",
          "Refueling and battery charging/changing",
          "Operating limitations and hazard recognition",
          "Pedestrian traffic in areas where the vehicle will be operated",
          "Surface conditions where the vehicle will be operated",
        ]},
        { type: "callout", variant: "warning", heading: "Penalties for Non-Compliance", content: "OSHA can issue penalties up to $16,131 per serious violation and up to $161,323 for willful or repeat violations. Forklift-related violations are consistently among OSHA's top 10 most cited standards." },
      ],
      faqJson: [
        { q: "What does OSHA require for forklift training?", a: "OSHA requires three components: formal instruction (classroom or online training), practical training (hands-on demonstrations), and evaluation (employer assessment of the operator in the workplace)." },
        { q: "How often does OSHA require forklift retraining?", a: "Operators must be re-evaluated at least every three years. Additionally, refresher training is required after accidents, near-misses, observed unsafe behavior, or changes in workplace conditions or equipment." },
        { q: "Can forklift training be done online per OSHA?", a: "Yes. OSHA does not specify the format for the formal instruction component. Online training that covers all required topics is acceptable for the knowledge-based portion. The employer must still conduct hands-on practical evaluation." },
      ],
    },
    {
      slug: "group-forklift-training",
      templateKey: "TEMPLATE_GROUP_TRAINING",
      published: true,
      title: "Group Forklift Training — Volume Pricing for Businesses",
      metaDescription: "Train your team with group forklift certification. Volume pricing, progress tracking, and compliance reporting for businesses training 5+ operators.",
      heroH1: "Group Forklift Training for Businesses",
      heroSubtitle: "Efficiently train and certify your entire forklift operator team with volume discounts and management tools.",
      introParagraph: "Training multiple forklift operators? Our group training platform makes it easy to manage certification for your entire team. Group administrators can invite operators, track progress, monitor completion, and access all certificates from a single dashboard. Volume pricing is available for organizations training 5 or more operators.",
      primaryKeyword: "group forklift training",
      secondaryKeywords: ["bulk forklift training", "corporate forklift certification", "team forklift training"],
      bodySections: [
        { type: "icon_list", heading: "Group Training Features", items: [
          "Volume pricing for 5+ operators",
          "Centralized admin dashboard for tracking progress",
          "Invite operators by email — they get instant course access",
          "Monitor completion status and exam scores in real-time",
          "Download all certificates from one place",
          "Employer documentation kit included for each operator",
          "Compliance reporting for OSHA record-keeping",
        ]},
        { type: "step_list", heading: "How Group Training Works", steps: [
          { title: "Create a Group Account", description: "Sign up as a group administrator. Set up your organization and select the number of seats you need." },
          { title: "Invite Your Team", description: "Send email invitations to your operators. They'll receive immediate access to the training course." },
          { title: "Track Progress", description: "Monitor each operator's progress through the course from your admin dashboard." },
          { title: "Manage Certificates", description: "Access all completed certificates, track expiration dates, and manage recertification schedules." },
        ]},
      ],
      faqJson: [
        { q: "What group sizes qualify for volume pricing?", a: "Volume pricing is available for groups of 5 or more operators. Contact us for custom pricing based on your team size." },
        { q: "Can I add operators to an existing group later?", a: "Yes. Group administrators can add additional seats and invite new operators at any time." },
        { q: "Do I get a single invoice for group training?", a: "Yes. Group orders are consolidated into a single invoice for easy processing and record-keeping." },
      ],
    },
  ];
}

export function generateStatePages(): InsertSeoPage[] {
  return STATES.map(s => {
    const stateSlug = slugify(`forklift-certification-${s.name}`);
    const stateCities = CITIES.filter(c => c.state === s.name);
    const cityLinks = stateCities.map(c => ({
      slug: slugify(`forklift-certification-${c.city}-${s.abbr.toLowerCase()}`),
      label: c.city,
    }));

    return {
      slug: stateSlug,
      templateKey: "TEMPLATE_LOCATION_STATE",
      published: true,
      title: `Forklift Certification in ${s.name} — OSHA-Compliant Training`,
      metaDescription: `Get your forklift certification in ${s.name}. OSHA-compliant online training available statewide. Same-day certification for $59.99.`,
      heroH1: `Forklift Certification in ${s.name}`,
      heroSubtitle: `OSHA-compliant forklift operator training available throughout ${s.name}. Online certification with same-day results.`,
      introParagraph: `Whether you're in ${stateCities.length > 0 ? stateCities.slice(0, 3).map(c => c.city).join(", ") + ", or anywhere else in" : ""} ${s.name}, our online forklift certification program is available to you. OSHA Standard 29 CFR 1910.178 is a federal regulation that applies in all 50 states, meaning your certification is recognized by employers throughout ${s.name} and nationwide.`,
      primaryKeyword: `forklift certification ${s.name.toLowerCase()}`,
      secondaryKeywords: [`forklift training ${s.name.toLowerCase()}`, `forklift license ${s.name.toLowerCase()}`],
      state: s.name,
      bodySections: [
        { type: "icon_list", heading: `${s.name} Forklift Training Options`, items: [
          `Online certification — available statewide in ${s.name}, start immediately`,
          "Complete the course at your own pace from any location",
          "Same-day certification upon successful completion",
          "Certificate includes QR verification for employers",
          `Meets federal OSHA requirements applicable in ${s.name}`,
        ]},
        ...(cityLinks.length > 0 ? [{ type: "rich_text", heading: `Forklift Certification Locations in ${s.name}`, content: `<p>We serve forklift operators throughout ${s.name}, including ${stateCities.map(c => c.city).join(", ")}. Our online program is accessible from any city or town in the state.</p>` }] : []),
        { type: "callout", variant: "info", heading: `${s.name} Workplace Safety`, content: `${s.name} employers must comply with federal OSHA standards for forklift operator training. Our program helps employers in ${s.name} meet the formal instruction requirement efficiently and affordably.` },
      ],
      faqJson: [
        { q: `Is forklift certification required in ${s.name}?`, a: `Yes. Federal OSHA Standard 29 CFR 1910.178 requires forklift operator training nationwide, including ${s.name}. Employers must ensure all operators are properly trained and certified.` },
        { q: `How much does forklift certification cost in ${s.name}?`, a: `Our online certification is $59.99 — available to all ${s.name} residents. This is typically less expensive than in-person training programs which range from $150-$300.` },
        { q: `Can I use an online forklift certification in ${s.name}?`, a: `Yes. OSHA does not mandate a specific format for the formal instruction component. Online training is accepted throughout ${s.name} as long as it covers all required topics, which our program does.` },
      ],
      internalLinks: cityLinks.length > 0 ? cityLinks : null,
    };
  });
}

const ONSITE_STATES = ["California", "Nevada"];

const REGIONAL_LOCATION_MAP: Record<string, string> = {
  "Los Angeles": "southern-california", "San Diego": "southern-california", "Long Beach": "southern-california",
  "Riverside": "southern-california", "Anaheim": "southern-california", "Irvine": "southern-california",
  "Chula Vista": "southern-california", "Escondido": "southern-california", "Carlsbad": "southern-california",
  "Oceanside": "southern-california", "El Cajon": "southern-california", "National City": "southern-california",
  "Vista": "southern-california", "San Marcos": "southern-california", "Temecula": "southern-california",
  "Murrieta": "southern-california", "Corona": "southern-california", "Ontario": "southern-california",
  "Rancho Cucamonga": "southern-california", "Fontana": "southern-california", "San Bernardino": "southern-california",
  "Pomona": "southern-california", "Pasadena": "southern-california", "Torrance": "southern-california",
  "Downey": "southern-california", "Norwalk": "southern-california", "Whittier": "southern-california",
  "Compton": "southern-california", "Inglewood": "southern-california", "El Monte": "southern-california",
  "West Covina": "southern-california", "Palmdale": "southern-california", "Lancaster": "southern-california",
  "Santa Clarita": "southern-california", "Glendale": "southern-california", "Burbank": "southern-california",
  "Oxnard": "southern-california", "Ventura": "southern-california", "Thousand Oaks": "southern-california",
  "Simi Valley": "southern-california", "Huntington Beach": "southern-california", "Garden Grove": "southern-california",
  "Santa Ana": "southern-california", "Costa Mesa": "southern-california", "Mission Viejo": "southern-california",
  "Fresno": "central-california", "Bakersfield": "central-california", "Visalia": "central-california",
  "Stockton": "central-california",
  "Las Vegas": "southern-nevada", "Henderson": "southern-nevada", "North Las Vegas": "southern-nevada",
  "Reno": "southern-nevada", "Sparks": "southern-nevada", "Carson City": "southern-nevada",
  "Elko": "southern-nevada", "Mesquite": "southern-nevada",
};

export function generateCityPages(): InsertSeoPage[] {
  return CITIES.map(c => {
    const stateObj = STATES.find(s => s.name === c.state);
    const abbr = stateObj?.abbr.toLowerCase() || "";
    const citySlug = slugify(`forklift-certification-${c.city}-${abbr}`);
    const stateSlug = slugify(`forklift-certification-${c.state}`);
    const isOnsiteArea = ONSITE_STATES.includes(c.state);
    const regionalSlug = REGIONAL_LOCATION_MAP[c.city] || null;

    const introParagraph = isOnsiteArea
      ? `Looking for forklift certification in ${c.city}? ForkliftCertified offers both online and hands-on onsite training options for the ${c.city} area. Complete your OSHA-compliant online certification from anywhere, or book in-person hands-on training at your facility. Our comprehensive programs cover all required topics under 29 CFR 1910.178, and you can earn your certificate the same day.`
      : `Looking for forklift certification in ${c.city}? ForkliftCertified offers OSHA-compliant online training that you can complete from anywhere in the ${c.city} metropolitan area. Our comprehensive course covers all required topics under 29 CFR 1910.178, and you can earn your certificate the same day you complete the training.`;

    const bodySections: any[] = [];

    if (isOnsiteArea) {
      bodySections.push({
        type: "icon_list", heading: `Training Options in ${c.city}`, items: [
          `Online certification — study from anywhere in ${c.city}, available 24/7`,
          `Onsite hands-on training — we come to your ${c.city} facility`,
          "Same-day OSHA-compliant certification upon completion",
          `Certificate recognized by ${c.city} area employers`,
          "Employer documentation kit included for compliance records",
        ],
      });
      bodySections.push({
        type: "icon_list", heading: "Available Hands-On Training Programs", items: [
          "Standard Forklift (Sit-Down LPG) & Electric Pallet Jack Certification",
          "Scissor Lift & Aerial/Boom Lift Certification",
          "Reach Truck Operator Certification",
          "Order Picker Operator Certification",
          "Combo packages — get certified on multiple equipment types in one session",
        ],
      });
      bodySections.push({
        type: "callout", variant: "tip", heading: "Book Onsite Training", content: `We offer hands-on forklift training at your ${c.city} location. Our certified trainers bring all the materials and conduct OSHA-compliant training right at your facility. Check availability and book your session online.`,
      });
    } else {
      bodySections.push({
        type: "icon_list", heading: `Why Choose Online Certification in ${c.city}?`, items: [
          `No need to travel to a training center in ${c.city} — train from your home or office`,
          "Complete the course at your own pace, 24/7 availability",
          "Same OSHA-compliant content as in-person courses at a fraction of the cost",
          `Certificate recognized by ${c.city} area employers`,
          "Employer documentation kit included for hands-on evaluation",
        ],
      });
    }

    bodySections.push({
      type: "callout", variant: "info", heading: "Local Industry", content: `${c.city} has a strong demand for certified forklift operators across warehousing, distribution, manufacturing, and construction sectors. Having your certification ready makes you more competitive in the ${c.city} job market.`,
    });

    const faqJson = [
      { q: `Where can I get forklift certified in ${c.city}?`, a: isOnsiteArea
        ? `You can complete your forklift certification online from anywhere in ${c.city}, or book hands-on onsite training where our certified trainers come to your facility. Both options provide same-day OSHA-compliant certification.`
        : `You can complete your forklift certification online from anywhere in ${c.city}. Our program is available 24/7, so you can train at your convenience.` },
      { q: `How much does forklift certification cost in ${c.city}?`, a: isOnsiteArea
        ? `Our online certification is $59.99 per person. Hands-on onsite training starts at $200 per person depending on the equipment type and number of participants. Volume discounts are available for groups.`
        : `Our online certification is $59.99 — the same price regardless of your location. In-person training centers in ${c.city} typically charge $150-$300.` },
      { q: `Is online forklift certification valid for ${c.city} employers?`, a: `Yes. OSHA certification requirements are federal and apply uniformly. ${c.city} employers accept online formal instruction as part of the three-component certification process.` },
    ];

    if (isOnsiteArea) {
      faqJson.push({ q: `Do you offer onsite forklift training in ${c.city}?`, a: `Yes. We provide hands-on forklift training at your ${c.city} location. Our certified trainers bring all necessary materials and conduct OSHA-compliant training right at your facility. Available training includes standard forklift, reach truck, order picker, scissor lift, and combo packages.` });
    }

    const internalLinks: Array<{ slug: string; label: string }> = [{ slug: stateSlug, label: `All ${c.state} locations` }];
    if (regionalSlug) {
      internalLinks.push({ slug: `locations/${regionalSlug}`, label: `${regionalSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} training` });
    }
    if (isOnsiteArea) {
      internalLinks.push({ slug: "book-training/forklift-certification-san-diego", label: "Book hands-on training" });
    }

    return {
      slug: citySlug,
      templateKey: "TEMPLATE_LOCATION_CITY",
      published: true,
      title: isOnsiteArea
        ? `Forklift Certification in ${c.city}, ${stateObj?.abbr || c.state} — Online & Onsite Training`
        : `Forklift Certification in ${c.city}, ${stateObj?.abbr || c.state} — OSHA Training`,
      metaDescription: isOnsiteArea
        ? `Get forklift certified in ${c.city}, ${c.state}. Online training ($59.99) and hands-on onsite certification available. Same-day OSHA-compliant certification.`
        : `Get forklift certified in ${c.city}, ${c.state}. OSHA-compliant online training with same-day certification. $59.99 one-time fee.`,
      heroH1: `Forklift Certification in ${c.city}, ${stateObj?.abbr || c.state}`,
      heroSubtitle: isOnsiteArea
        ? `Online and hands-on onsite forklift training for ${c.city} area workers. Get certified today.`
        : `OSHA-compliant forklift operator training for ${c.city} area workers. Get certified online today.`,
      introParagraph,
      primaryKeyword: `forklift certification ${c.city.toLowerCase()}`,
      secondaryKeywords: isOnsiteArea
        ? [`forklift training ${c.city.toLowerCase()}`, `forklift license ${c.city.toLowerCase()}`, `onsite forklift training ${c.city.toLowerCase()}`]
        : [`forklift training ${c.city.toLowerCase()}`, `forklift license ${c.city.toLowerCase()}`],
      city: c.city,
      state: c.state,
      bodySections,
      faqJson,
      internalLinks,
    };
  });
}

export function generateIndustryPages(): InsertSeoPage[] {
  const industryContent: Record<string, { intro: string; items: string[]; faqs: Array<{ q: string; a: string }> }> = {
    warehouse: {
      intro: "Warehouse and distribution center operations rely heavily on forklift operators. From receiving to shipping, certified operators are essential for maintaining safe, efficient operations. OSHA records show that warehousing has one of the highest rates of forklift-related injuries, making proper training critical.",
      items: [
        "Narrow aisle navigation and racking safety", "Dock loading and unloading procedures",
        "Inventory management and load stacking", "Pedestrian awareness in high-traffic areas",
        "Cold storage operations (if applicable)", "Order picking and putaway procedures",
      ],
      faqs: [
        { q: "Do warehouse workers need forklift certification?", a: "Yes. Any employee who operates a forklift in a warehouse setting must be trained and certified per OSHA 29 CFR 1910.178. This applies to all warehouse environments." },
        { q: "What types of forklifts are used in warehouses?", a: "Common warehouse forklifts include sit-down counterbalance trucks, stand-up reach trucks, order pickers, and electric pallet jacks. Our training covers general principles applicable to all types." },
      ],
    },
    construction: {
      intro: "Construction sites present unique challenges for forklift operators, including uneven terrain, overhead hazards, and changing work environments. OSHA's construction standards (29 CFR 1926) work alongside the general industry standard to ensure safe forklift operations on construction sites.",
      items: [
        "Rough terrain and uneven surface operation", "Overhead hazard awareness and clearance management",
        "Working near trenches and excavations", "Coordination with crane operations",
        "Material handling for construction materials", "Site-specific hazard assessment",
      ],
      faqs: [
        { q: "Do construction workers need forklift certification?", a: "Yes. Forklift operators on construction sites must be certified under OSHA standards. Construction sites have additional hazards that make proper training even more critical." },
        { q: "Is construction forklift certification different from warehouse certification?", a: "The core OSHA training requirements are the same. However, construction operators often need additional site-specific training for rough terrain operations and construction-specific hazards." },
      ],
    },
    manufacturing: {
      intro: "Manufacturing facilities rely on forklifts for material movement throughout the production process. From raw material receiving to finished goods shipping, certified operators help prevent accidents and maintain production efficiency. Manufacturing environments present unique challenges including tight spaces, production line proximity, and hazardous materials.",
      items: [
        "Production floor navigation and line-side delivery", "Raw material and finished goods handling",
        "Hazardous material transport considerations", "Quality control area operations",
        "Shift change safety protocols", "Machine shop and assembly area forklift use",
      ],
      faqs: [
        { q: "What forklift training do manufacturing workers need?", a: "Manufacturing forklift operators need OSHA 29 CFR 1910.178 certification covering all standard topics, plus site-specific training for their manufacturing environment." },
        { q: "How does forklift certification improve manufacturing safety?", a: "Properly trained operators reduce accident rates, minimize product damage, and help maintain efficient production flow. OSHA data shows that proper training significantly reduces forklift-related incidents." },
      ],
    },
    retail: {
      intro: "Retail operations, especially big box stores and distribution centers, rely on forklifts for stocking, inventory management, and customer order fulfillment. Retail environments present unique safety challenges due to customer proximity and varied product types.",
      items: [
        "Customer area safety and awareness", "Overnight stocking operations",
        "Pallet racking and high-stack inventory", "Seasonal high-volume operations",
        "Back room and sales floor transitions", "Large and oversized item handling",
      ],
      faqs: [
        { q: "Do retail workers need forklift certification?", a: "Yes. Any retail employee who operates a forklift, including in back rooms and loading docks, must be OSHA-certified. This includes stores like Home Depot, Walmart, Costco, and similar retailers." },
        { q: "What additional training do retail forklift operators need?", a: "Retail operators may need additional training on customer-area safety, as they often work near shoppers. Site-specific training should cover store layout, customer traffic patterns, and emergency procedures." },
      ],
    },
    logistics: {
      intro: "The logistics and freight industry depends on forklift operators for loading, unloading, and organizing shipments at warehouses, ports, rail yards, and distribution hubs. The fast-paced nature of logistics operations makes proper training especially important for preventing accidents.",
      items: [
        "Truck and trailer loading/unloading", "Container yard operations",
        "Cross-docking procedures", "Last-mile distribution center operations",
        "Intermodal transfer operations", "Time-sensitive cargo handling",
      ],
      faqs: [
        { q: "Is forklift certification required for freight workers?", a: "Yes. Any worker who operates a forklift in a logistics or freight operation must be OSHA-certified, regardless of whether they work at a warehouse, loading dock, or freight yard." },
        { q: "How does forklift training improve logistics operations?", a: "Trained operators work more efficiently, reduce product damage, and prevent costly accidents. In logistics, where speed and accuracy are critical, proper certification helps maintain safe throughput." },
      ],
    },
  };

  return INDUSTRIES.map(ind => {
    const content = industryContent[ind.key];
    return {
      slug: `forklift-certification-${ind.key}`,
      templateKey: "TEMPLATE_INDUSTRY",
      published: true,
      title: `Forklift Certification for ${ind.label} — OSHA Training`,
      metaDescription: `OSHA-compliant forklift certification for ${ind.label.toLowerCase()} workers. Online training covering industry-specific topics. $59.99 with same-day certification.`,
      heroH1: `Forklift Certification for ${ind.label}`,
      heroSubtitle: `Specialized OSHA-compliant training for forklift operators in ${ind.label.toLowerCase()} environments.`,
      introParagraph: content.intro,
      primaryKeyword: `forklift certification ${ind.key}`,
      secondaryKeywords: [`${ind.key} forklift training`, `forklift license ${ind.key}`],
      industry: ind.label,
      bodySections: [
        { type: "icon_list", heading: `${ind.label} Training Topics`, items: content.items },
        { type: "callout", variant: "info", heading: "Industry-Specific Training", content: `While our online course covers all OSHA-required topics applicable to ${ind.label.toLowerCase()} operations, your employer should also provide site-specific practical training for your particular workplace.` },
      ],
      faqJson: content.faqs,
    };
  });
}

export function generateEquipmentPages(): InsertSeoPage[] {
  const equipContent: Record<string, { intro: string; items: string[]; faqs: Array<{ q: string; a: string }> }> = {
    "sit-down-counterbalance": {
      intro: "The sit-down counterbalance forklift is the most common type of powered industrial truck. Used across virtually every industry, these versatile machines use a counterweight at the rear of the vehicle to balance loads carried on forks at the front. Understanding their operation is fundamental to forklift certification.",
      items: [
        "Counterbalance weight distribution and stability triangle", "Proper load centering and fork positioning",
        "Mast tilt operations and load height management", "Turning radius and steering in confined spaces",
        "Indoor and outdoor operation differences", "Capacity plate reading and load weight assessment",
      ],
      faqs: [
        { q: "What is a sit-down counterbalance forklift?", a: "A sit-down counterbalance forklift is the traditional forklift design where the operator sits in a cab and the machine uses a heavy counterweight to balance the load on the forks. They're available in electric, propane, and diesel models." },
        { q: "What certification do I need for a sit-down forklift?", a: "You need standard OSHA 29 CFR 1910.178 certification, which our online course provides. Your employer must also provide practical training on the specific model you'll operate." },
      ],
    },
    "stand-up-reach-truck": {
      intro: "Stand-up reach trucks are designed for narrow aisle warehouse operations. The operator stands while operating the truck, which can extend its forks forward to reach into racking. These trucks require specific training due to their unique operating characteristics and narrow aisle environments.",
      items: [
        "Stand-up operating position and controls", "Reach mechanism operation and limitations",
        "Narrow aisle navigation and clearance management", "High-stack racking operations",
        "Wire guidance and rail systems", "Battery management and charging procedures",
      ],
      faqs: [
        { q: "Is a reach truck the same as a regular forklift?", a: "No. A reach truck is a specialized type of forklift designed for narrow aisle warehouse operations. The operator stands rather than sits, and the forks can extend forward to reach into storage racks." },
        { q: "Do I need special certification for a reach truck?", a: "The same OSHA 29 CFR 1910.178 certification applies. However, your employer must provide specific practical training on the reach truck model you'll operate, as the controls differ from sit-down forklifts." },
      ],
    },
    "electric-pallet-jack": {
      intro: "Electric pallet jacks (also called powered pallet trucks or walkies) are essential tools in warehousing and retail. While they may seem simpler than full-sized forklifts, OSHA considers them powered industrial trucks, and operators must be properly trained and certified.",
      items: [
        "Walk-behind vs. ride-on pallet jack operation", "Speed control and directional changes",
        "Load center and weight distribution", "Dock plate and ramp operations",
        "Pedestrian awareness in congested areas", "Battery charging safety",
      ],
      faqs: [
        { q: "Do you need certification for an electric pallet jack?", a: "Yes. OSHA classifies electric pallet jacks as powered industrial trucks, so operators must be trained and certified under 29 CFR 1910.178." },
        { q: "Is pallet jack training the same as forklift training?", a: "The core OSHA training requirements are the same. However, practical training should cover pallet jack-specific operations, which differ from sit-down forklift operation." },
      ],
    },
    "order-picker": {
      intro: "Order pickers lift the operator along with the forks to allow direct access to products at various heights. Because the operator is elevated, order picker training must emphasize fall protection, harness use, and elevated platform safety in addition to standard forklift topics.",
      items: [
        "Elevated platform safety and fall protection", "Harness and lanyard use requirements",
        "Operating at height — stability considerations", "Order picking techniques and efficiency",
        "Guard rail and safety gate operation", "Maximum platform height limitations",
      ],
      faqs: [
        { q: "What is an order picker forklift?", a: "An order picker is a type of forklift that elevates the operator to the height of the stored products, allowing direct access for picking individual items. They're commonly used in warehouse order fulfillment operations." },
        { q: "Do order picker operators need fall protection training?", a: "Yes. Because operators are elevated, order picker training must include fall protection, harness use, and elevated platform safety procedures in addition to standard forklift certification." },
      ],
    },
    "rough-terrain-forklift": {
      intro: "Rough terrain forklifts are designed for outdoor use on uneven, unpaved, or challenging surfaces. Common on construction sites, lumber yards, and agricultural operations, these machines require specialized training due to their unique stability and operating characteristics.",
      items: [
        "Operating on uneven and unpaved surfaces", "Tire types and terrain assessment",
        "Stability on grades and slopes", "Outdoor weather and visibility considerations",
        "Load handling on soft ground", "Construction site coordination and communication",
      ],
      faqs: [
        { q: "What is a rough terrain forklift?", a: "A rough terrain forklift is designed for outdoor use on unpaved or uneven surfaces. They feature large pneumatic tires, higher ground clearance, and enhanced stability systems. Common in construction and lumber operations." },
        { q: "Is rough terrain forklift certification different?", a: "The core OSHA certification requirements are the same. However, practical training must cover rough terrain-specific topics including operating on grades, soft surfaces, and outdoor conditions." },
      ],
    },
  };

  return EQUIPMENT_TYPES.map(eq => {
    const content = equipContent[eq.key];
    return {
      slug: `${eq.key}-forklift-training`,
      templateKey: "TEMPLATE_EQUIPMENT",
      published: true,
      title: `${eq.label} Training — OSHA Certification | ForkliftCertified`,
      metaDescription: `Get certified to operate a ${eq.label.toLowerCase()}. OSHA-compliant online training covering ${eq.label.toLowerCase()}-specific topics. $59.99 with same-day certification.`,
      heroH1: `${eq.label} Training & Certification`,
      heroSubtitle: `OSHA-compliant training covering ${eq.label.toLowerCase()} operation, safety, and best practices.`,
      introParagraph: content.intro,
      primaryKeyword: `${eq.key} forklift training`,
      secondaryKeywords: [`${eq.key} forklift certification`, `${eq.label.toLowerCase()} training`],
      equipmentType: eq.label,
      bodySections: [
        { type: "icon_list", heading: `${eq.label} Training Topics`, items: content.items },
        { type: "callout", variant: "info", heading: "Practical Training Required", content: `After completing the online certification, your employer must provide hands-on practical training on the specific ${eq.label.toLowerCase()} model you'll operate. Our employer documentation kit includes evaluation checklists designed for this purpose.` },
      ],
      faqJson: content.faqs,
    };
  });
}

export function getAllSeoPages(): InsertSeoPage[] {
  return [
    ...generatePriorityPages(),
    ...generateStatePages(),
    ...generateCityPages(),
    ...generateIndustryPages(),
    ...generateEquipmentPages(),
  ];
}
