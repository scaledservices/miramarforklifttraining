export const industry = {
  name: "Forklift Certification",
  equipmentType: "Powered Industrial Truck",
  operatorTitle: "Forklift Operator",

  regulatory: {
    body: "OSHA",
    bodyFull: "Occupational Safety and Health Administration",
    standard: "29 CFR 1910.178",
    standardDescription: "Powered Industrial Trucks",
    certificationValidity: "3 years",
    renewalPeriod: "3 years",
    complianceText: "in accordance with OSHA Standard 29 CFR 1910.178",
    alignmentLabel: "OSHA-aligned",
  },

  secondaryStandard: {
    body: "ANSI",
    bodyFull: "American National Standards Institute",
    standard: "ANSI/ITSDF B56.1",
  },

  equipmentClasses: [
    { id: "class-1", name: "Electric Motor Rider Trucks", oshaClass: 1 },
    { id: "class-2", name: "Electric Motor Narrow Aisle Trucks", oshaClass: 2 },
    { id: "class-3", name: "Electric Motor Hand/Hand-Rider Trucks", oshaClass: 3 },
    { id: "class-4", name: "Internal Combustion Engine Trucks — Cushion Tires", oshaClass: 4 },
    { id: "class-5", name: "Internal Combustion Engine Trucks — Pneumatic Tires", oshaClass: 5 },
    { id: "class-6", name: "Electric and Internal Combustion Tractors", oshaClass: 6 },
    { id: "class-7", name: "Rough Terrain Forklift Trucks", oshaClass: 7 },
  ],

  equipmentTypes: [
    "Sit-down Counterbalance Forklift (LPG)",
    "Reach Truck",
    "Order Picker",
    "Electric Pallet Jack (EPJ)",
    "Scissor Lift",
    "Aerial/Boom Lift",
  ],

  certificationTypes: [
    { id: "online", name: "Online Certification", description: "Formal instruction portion of regulatory-required training" },
    { id: "hands-on", name: "Hands-On Certification", description: "Practical evaluation with live equipment" },
    { id: "train-the-trainer", name: "Train the Trainer", description: "Qualify to train and certify operators at your facility" },
    { id: "bundle", name: "Complete Equipment Bundle", description: "Multi-equipment certification program" },
  ],

  trainingTopics: [
    "Equipment types and operating principles",
    "Load handling and stability",
    "Workplace hazard recognition",
    "Pre-operation inspection procedures",
    "Refueling and battery charging safety",
    "Pedestrian safety",
  ],
} as const;

export type Industry = typeof industry;
