export interface StepDef {
  title: string;
  type: "lesson" | "video" | "checkpoint" | "download" | "exam" | "content";
  config: any;
  estimatedMinutes: number;
  module: string;
  questions?: QuestionDef[];
}

export interface QuestionDef {
  question: string;
  type: "mcq_single" | "mcq_multi";
  options: string[];
  correctAnswers: string;
  explanation: string;
}

export const CANONICAL_COURSE = {
  title: "Online Forklift Operator Certification",
  slug: "online-forklift-operator-certification",
  description: "Comprehensive OSHA-compliant powered industrial truck (forklift) operator training. Covers formal instruction, safety procedures, load handling, and employer documentation. Complete video training, knowledge checks, and pass the final exam to receive your industry-recognized certification. Note: OSHA also requires employer-conducted practical training and evaluation.",
  category: "forklift",
  price: "59.99",
};

const img = (name: string) => `/images/training/${name}`;

function lessonHtml(opts: {
  title: string;
  image: string;
  sections: { heading?: string; content: string }[];
  takeaways: string[];
  tip?: string;
  warning?: string;
}): string {
  const tipBlock = opts.tip ? `<div class="callout callout-tip"><strong>💡 Tip:</strong> ${opts.tip}</div>` : "";
  const warnBlock = opts.warning ? `<div class="callout callout-warning"><strong>⚠️ Warning:</strong> ${opts.warning}</div>` : "";
  const sectionHtml = opts.sections.map(s =>
    (s.heading ? `<h3>${s.heading}</h3>` : "") + s.content
  ).join("\n");
  const takeawayItems = opts.takeaways.map(t => `<li>${t}</li>`).join("");

  return `<div class="lesson-content">
<img src="${opts.image}" alt="${opts.title}" class="lesson-hero-image" />
<h2>${opts.title}</h2>
${sectionHtml}
${tipBlock}
${warnBlock}
<div class="key-takeaways">
<h4>📝 Key Takeaways</h4>
<ul>${takeawayItems}</ul>
</div>
</div>`;
}

export const COURSE_STEPS: StepDef[] = [
  // ═══ MODULE 0: Welcome + OSHA Compliance ═══
  {
    module: "Welcome & OSHA Compliance",
    title: "Welcome to Forklift Operator Certification",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Welcome to Forklift Operator Certification",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "About This Course", content: "<p>Welcome! This online course provides the <strong>formal instruction</strong> portion of OSHA-compliant powered industrial truck (PIT/forklift) operator certification. The course takes approximately <strong>45–60 minutes</strong> to complete.</p>" },
          { heading: "What's Included", content: "<ul><li>Interactive training modules covering all OSHA-required topics</li><li>Knowledge check quizzes throughout</li><li>Final certification exam (80% passing score)</li><li>Digital certificate with QR-verified credential</li><li>Employer documentation packet for practical evaluation</li></ul>" },
          { heading: "What's NOT Included", content: "<p>OSHA requires <strong>three components</strong> for full certification: (1) formal instruction (this course), (2) practical/hands-on training, and (3) an evaluation of operator performance. Your employer must conduct the hands-on portion at your worksite. We provide all the forms they need in Module 7.</p>" },
          { heading: "How to Navigate", content: "<p>Complete each step in order. You can track your progress using the sidebar. If you need to stop, your progress is saved automatically. You can retake the final exam up to 3 times.</p>" },
        ],
        takeaways: [
          "This course covers the formal instruction requirement",
          "Your employer must also conduct hands-on training and evaluation",
          "Complete all modules and pass the final exam at 80% or higher",
          "Your progress saves automatically — resume anytime",
        ],
      }),
    },
  },
  {
    module: "Welcome & OSHA Compliance",
    title: "OSHA Compliance: What This Course Covers",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "OSHA Compliance: What This Course Covers",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "OSHA's Three-Part Requirement", content: "<p>Under <strong>29 CFR 1910.178(l)</strong>, OSHA requires all forklift operators to receive:</p><ol><li><strong>Formal instruction</strong> — classroom or online training covering safety topics (this course)</li><li><strong>Practical training</strong> — hands-on experience operating the specific equipment at the worksite</li><li><strong>Evaluation</strong> — a supervisor must observe and evaluate the operator's competence</li></ol>" },
          { heading: "What We Provide", content: "<ul><li>Complete formal instruction covering all OSHA-required topics</li><li>Knowledge assessment via final exam</li><li>Certificate of completion for the formal instruction portion</li><li>Employer documentation packet including evaluation checklists, permits, and attendance sheets</li></ul>" },
          { heading: "What Your Employer Must Do", content: "<p>After completing this course, your employer/supervisor must:</p><ul><li>Provide practical, hands-on training on the specific equipment you will operate</li><li>Evaluate your performance in the actual workplace</li><li>Complete and maintain the required documentation (provided in Module 7)</li><li>Re-evaluate operators at least every 3 years</li></ul>" },
          { content: "<p><em>Important: This online course alone does not fully satisfy OSHA requirements. The practical training and evaluation must be completed by your employer at your worksite.</em></p>" },
        ],
        takeaways: [
          "OSHA requires formal instruction + practical training + evaluation",
          "This course covers the formal instruction and knowledge assessment",
          "Your employer must complete hands-on training and evaluation",
          "Operators must be re-evaluated at least every 3 years",
        ],
        warning: "Do not operate a forklift until your employer has completed your hands-on training and evaluation.",
      }),
    },
  },
  {
    module: "Welcome & OSHA Compliance",
    title: "Knowledge Check: OSHA Requirements",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "OSHA training for forklift operators requires formal instruction, practical training, AND an evaluation.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "OSHA requires all three components: formal instruction, practical/hands-on training, and an evaluation of operator performance." },
      { question: "This online course replaces the need for hands-on evaluation by your employer.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "This course covers formal instruction only. Your employer must still conduct hands-on training and evaluation at your worksite." },
      { question: "If you are unsure about an operation, you should ask your supervisor before proceeding.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Always consult your supervisor when uncertain. Operating a forklift without proper knowledge creates serious safety risks." },
    ],
  },

  // ═══ MODULE 1: Forklift Basics + Responsibilities ═══
  {
    module: "Forklift Basics & Responsibilities",
    title: "What is a Powered Industrial Truck (PIT)?",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "What is a Powered Industrial Truck (PIT)?",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Definition", content: "<p>A <strong>Powered Industrial Truck (PIT)</strong> is any mobile, self-propelled vehicle used to carry, push, pull, lift, stack, or tier materials. Common names include forklift, pallet jack, rider truck, fork truck, and lift truck.</p><p>PITs may be powered by electric motors or internal combustion engines (propane, gasoline, diesel).</p>" },
          { heading: "OSHA Equipment Classifications", content: "<ul><li><strong>Class I:</strong> Electric Motor Rider Trucks</li><li><strong>Class II:</strong> Electric Motor Narrow Aisle Trucks</li><li><strong>Class III:</strong> Walkie/Rider Pallet Jacks and Stackers</li><li><strong>Class IV:</strong> Internal Combustion (IC) Rider Trucks — Cushion Tires</li><li><strong>Class V:</strong> IC Engine Trucks — Pneumatic Tires</li><li><strong>Class VI:</strong> IC Engine Tractors</li><li><strong>Class VII:</strong> Rough Terrain Forklift Trucks</li></ul>" },
          { heading: "Who Can Operate", content: "<p>Only <strong>trained and authorized</strong> employees may operate a PIT. You must be at least <strong>18 years old</strong>. Your certification is valid for <strong>3 years</strong>, after which you must be re-evaluated.</p>" },
          { heading: "Employer vs. Operator Responsibilities", content: "<ul><li><strong>Employer:</strong> Must provide training, ensure equipment is maintained, enforce safety rules</li><li><strong>Operator:</strong> Must follow all safety rules, perform pre-shift inspections, report hazards and incidents immediately</li></ul>" },
        ],
        takeaways: [
          "A PIT is any powered vehicle used to move, lift, or stack materials",
          "There are 7 OSHA classifications of powered industrial trucks",
          "Operators must be 18+ years old, trained, and authorized",
          "Certification is valid for 3 years",
        ],
      }),
    },
  },
  {
    module: "Forklift Basics & Responsibilities",
    title: "Authorization & Safe Work Culture",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Authorization & Safe Work Culture",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Reporting Hazards", content: "<p>As an operator, you are responsible for immediately reporting any unsafe conditions: damaged equipment, spills, obstructions, poor lighting, or near-miss incidents. Never assume someone else will report it.</p>" },
          { heading: "No Passengers — Ever", content: "<p>Your forklift is designed to safely transport <strong>only one person — the operator</strong>. Never allow riders on the forks, sides, or any part of the truck unless using an OSHA-approved safety platform with guardrails, toe boards, and a fall protection harness.</p>" },
          { heading: "Stay Alert", content: "<ul><li>No cell phone use while operating</li><li>No headphones or earbuds</li><li>No horseplay or stunt driving</li><li>Keep your entire body inside the protective cage at all times</li><li>Never operate under the influence of drugs or alcohol</li></ul>" },
          { heading: "OSHA Enforcement", content: "<p>OSHA can conduct <strong>unannounced inspections</strong>. Fines for uncertified operators can reach <strong>$7,000 per day per unqualified employee</strong>, retroactive to the hire date. A single uncertified operator working for one year could result in nearly <strong>$2 million</strong> in fines.</p>" },
        ],
        takeaways: [
          "Report all hazards and incidents immediately",
          "No passengers unless using an approved safety platform",
          "Stay alert — no phones, headphones, or horseplay",
          "OSHA fines for non-compliance are severe",
        ],
        warning: "Stunt driving and horseplay are strictly prohibited and can result in termination and OSHA violations.",
      }),
    },
  },
  {
    module: "Forklift Basics & Responsibilities",
    title: "Knowledge Check: Basics & Responsibilities",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "When is it acceptable to carry a passenger on a forklift?", type: "mcq_single", options: ["When driving slowly", "When an OSHA-approved safety platform with guardrails is properly attached", "During emergencies", "When the supervisor approves"], correctAnswers: "When an OSHA-approved safety platform with guardrails is properly attached", explanation: "Passengers are never allowed unless using an OSHA-approved work platform with guardrails, toe boards, and fall protection." },
      { question: "If you notice a minor oil leak on the forklift during pre-shift inspection, you should:", type: "mcq_single", options: ["Continue working and report at end of shift", "Report it immediately and do not operate until cleared", "Clean it up and keep working", "Only report if it gets worse"], correctAnswers: "Report it immediately and do not operate until cleared", explanation: "Any safety concern must be reported immediately. Vehicles should not be operated until they are deemed safe." },
      { question: "Your entire body must remain inside the forklift's protective cage at all times while operating.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Keep all body parts inside the operator's area to avoid crush hazards with the mast, overhead guard, or surrounding objects." },
    ],
  },

  // ═══ MODULE 2: Stability + Load Handling ═══
  {
    module: "Stability & Load Handling",
    title: "Stability Triangle and Center of Gravity",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Stability Triangle and Center of Gravity",
        image: img("stability-triangle.svg"),
        sections: [
          { heading: "What is the Stability Triangle?", content: "<p>The <strong>stability triangle</strong> is the three-point base formed by the two front axle ends and the rear axle pivot point. As long as the combined center of gravity of the truck and its load stays within this triangle, the forklift remains stable.</p>" },
          { heading: "Tip-Over Risk", content: "<p>When the center of gravity shifts outside the stability triangle — due to overloading, sharp turns, or operating on slopes — the forklift can <strong>tip over</strong>. Tip-overs are one of the leading causes of forklift fatalities.</p><ul><li>Never make sharp turns at speed</li><li>Reduce speed before turning</li><li>Be extra cautious on ramps, slopes, and uneven surfaces</li></ul>" },
          { heading: "Lateral Stability", content: "<p>Turning too quickly shifts the center of gravity sideways. The higher the load, the more unstable the truck becomes during turns. Always <strong>slow down before turning</strong>, not during the turn.</p>" },
        ],
        takeaways: [
          "The stability triangle is formed by the front axle ends and rear axle pivot",
          "Keep the center of gravity within the triangle to prevent tip-overs",
          "Reduce speed before turns — sharp turns cause lateral instability",
          "Higher loads mean greater tip-over risk during turns",
        ],
        warning: "Tip-overs are among the leading causes of forklift operator fatalities. Always respect the stability triangle.",
      }),
    },
  },
  {
    module: "Stability & Load Handling",
    title: "Rated Capacity & Data Plate",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Rated Capacity & Data Plate",
        image: img("load-center.svg"),
        sections: [
          { heading: "The Data Plate", content: "<p>Every forklift has a manufacturer's <strong>data plate</strong> indicating the maximum lifting capacity at various load centers. Before lifting any load, verify your forklift is rated to handle its weight.</p>" },
          { heading: "Load Center", content: "<p>The <strong>load center</strong> is the distance from the fork's vertical face to the center of the load. A forklift's capacity decreases as the load center increases. Always verify you're using the right equipment for the weight and size of the load.</p>" },
          { heading: "Attachments Reduce Capacity", content: "<p>Using attachments (clamps, rotators, fork extensions) changes the truck's center of gravity and <strong>reduces the rated capacity</strong>. Always check the adjusted capacity when using any attachment.</p>" },
          { heading: "Never Overload", content: "<p>Exceeding the rated capacity greatly increases the risk of instability and tip-over. Display weight limits clearly on the vehicle. If a load seems too heavy or unbalanced, do not attempt to lift it — get a higher-capacity truck.</p>" },
        ],
        takeaways: [
          "Always check the data plate for rated capacity before lifting",
          "Capacity decreases as load center distance increases",
          "Attachments reduce the forklift's rated capacity",
          "Never exceed the rated capacity — use a larger truck if needed",
        ],
      }),
    },
  },
  {
    module: "Stability & Load Handling",
    title: "Picking Up and Carrying Loads Safely",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Picking Up and Carrying Loads Safely",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Fork Position", content: "<p>Carry forks as low as possible — typically <strong>4 to 6 inches</strong> from the ground. This lowers the center of gravity and reduces the risk of tip-over.</p>" },
          { heading: "Mast Tilt", content: "<p>Tilt the mast slightly back when traveling with a load to stabilize it. Never tilt loads forward except when depositing them. Excessive forward tilt can cause the truck to tip.</p>" },
          { heading: "Visibility", content: "<p>If a load blocks your forward view, <strong>drive in reverse</strong> to maintain a clear line of sight. Use spotters when navigating tight spaces or areas with limited visibility.</p>" },
          { heading: "Securing Loads", content: "<p>Before transporting any load, ensure it is <strong>properly secured and balanced</strong>. You may need shrink-wrap or straps to prevent shifting or spilling during transport. Never move an unsecured load.</p>" },
        ],
        takeaways: [
          "Carry forks 4–6 inches from the ground",
          "Tilt the mast back when traveling with a load",
          "Drive in reverse if the load blocks your forward view",
          "Always ensure loads are secured before moving",
        ],
        tip: "When you can't see past the load, travel in reverse and use a spotter for tight areas.",
      }),
    },
  },
  {
    module: "Stability & Load Handling",
    title: "Knowledge Check: Stability & Loads",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "When traveling with a load, forks should be:", type: "mcq_single", options: ["Raised as high as possible", "At eye level", "4 to 6 inches from the ground", "Touching the ground"], correctAnswers: "4 to 6 inches from the ground", explanation: "Carrying forks 4–6 inches from the ground keeps the center of gravity low and reduces tip-over risk." },
      { question: "Using attachments on a forklift affects the:", type: "mcq_single", options: ["Color of the forklift", "Rated capacity — it is reduced", "Horn volume", "Tire pressure"], correctAnswers: "Rated capacity — it is reduced", explanation: "Attachments change the center of gravity and reduce the forklift's rated lifting capacity." },
      { question: "You should slow down before entering a turn, not during the turn.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Slowing down during a turn increases lateral instability. Always reduce speed before you begin turning." },
      { question: "If a load is too heavy for your forklift, you should:", type: "mcq_single", options: ["Try to lift it carefully", "Use a larger-capacity truck", "Add counterweight to the back", "Drive faster for momentum"], correctAnswers: "Use a larger-capacity truck", explanation: "Never exceed rated capacity. Get the right equipment for the job." },
    ],
  },

  // ═══ MODULE 3: Pre-Operation Inspection + Fueling/Charging ═══
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Pre-Shift Inspection Checklist",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Pre-Shift Inspection Checklist",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Your Responsibility", content: "<p>As the operator, it is <strong>your responsibility</strong> to conduct a daily safety inspection before using the machine. This must be done at the <strong>start of each shift</strong>.</p>" },
          { heading: "Walk-Around Inspection", content: "<p>Walk around the entire vehicle, checking for:</p><ul><li><strong>Tires:</strong> Check for damage, proper inflation</li><li><strong>Forks:</strong> Inspect for cracks, bends, or excessive wear</li><li><strong>Chains & hydraulics:</strong> Check for leaks, damage</li><li><strong>Lights, horn, and backup alarm:</strong> Test functionality</li><li><strong>Brakes:</strong> Test both service and parking brakes</li><li><strong>Steering:</strong> Check for responsiveness</li><li><strong>Fluid levels:</strong> Check fuel, oil, coolant, hydraulic fluid</li><li><strong>Seat belt:</strong> Ensure it functions properly</li></ul>" },
          { heading: "Tag Out Unsafe Equipment", content: "<p>If you find any safety issue, <strong>do not operate the forklift</strong>. Report the problem to your supervisor or maintenance team immediately. Tag out the equipment so no one else uses it until repairs are completed.</p>" },
        ],
        takeaways: [
          "Pre-shift inspection is required before every shift",
          "Check tires, forks, chains, hydraulics, lights, horn, brakes, steering",
          "Tag out and report any unsafe equipment immediately",
          "Never operate a forklift that fails inspection",
        ],
        tip: "Always buckle your seat belt before starting the engine — it's your primary protection in a tip-over.",
      }),
    },
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Maintenance and Repairs",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Maintenance and Repairs",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Repair Before Use", content: "<p>If a safety issue is identified during inspection, <strong>repairs must be made before the equipment is used</strong>. Never operate a forklift with known defects.</p>" },
          { heading: "Fluid Leaks", content: "<p>Do not operate any vehicle with <strong>fuel, oil, or hydraulic leaks</strong>. Hydraulic leaks can lead to sudden loss of load control, creating an extremely dangerous situation.</p>" },
          { heading: "Document and Report", content: "<p>All maintenance issues must be documented and reported. This creates a paper trail for compliance and helps prevent recurring issues.</p>" },
        ],
        takeaways: [
          "Repairs must be completed before the equipment is used",
          "Never operate a forklift with any fluid leaks",
          "Document all maintenance issues for compliance",
        ],
      }),
    },
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Fueling and Charging Safety",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Fueling and Charging Safety (LPG / Electric)",
        image: img("ppe-gloves.svg"),
        sections: [
          { heading: "Designated Areas Only", content: "<p>Refueling and recharging must <strong>only occur in designated areas</strong> with proper ventilation. Never refuel in general work areas.</p>" },
          { heading: "PPE Requirements", content: "<ul><li>Wear <strong>gloves</strong> when handling LPG tanks</li><li>Wear <strong>eye protection</strong> as applicable</li><li>Follow your facility's specific PPE requirements</li></ul>" },
          { heading: "No Smoking", content: "<p>Employees are <strong>strictly prohibited from smoking</strong> or using any open flame while operating a forklift. Sparks or open flames must remain at least <strong>50 feet away</strong> from fueling stations and battery recharging areas.</p>" },
          { heading: "LPG Safety", content: "<p>When changing propane tanks: check for leaks, ensure proper connection, and verify the tank is secured. Report any gas smell immediately.</p>" },
          { heading: "Electric Battery Safety", content: "<p>When charging batteries: turn off the charger before connecting/disconnecting. Electric batteries produce hydrogen gas during charging — ensure adequate ventilation to prevent explosion risk.</p>" },
        ],
        takeaways: [
          "Refuel/recharge only in designated, ventilated areas",
          "Wear gloves when handling LPG tanks",
          "No smoking within 50 feet of fueling/charging areas",
          "Always check for leaks after connecting LPG tanks",
        ],
        warning: "No smoking, open flames, or sparks near fueling or charging areas. Hydrogen gas from charging batteries is highly explosive.",
      }),
    },
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Knowledge Check: Inspections & Fueling",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "If a safety issue is found during pre-shift inspection, repairs must be completed:", type: "mcq_single", options: ["By end of day", "Before the equipment is used", "Within a week", "Only if a supervisor requests it"], correctAnswers: "Before the equipment is used", explanation: "Repairs must be made before use if the equipment is unsafe. Never operate a defective forklift." },
      { question: "Gloves should be worn when handling LPG (propane) tanks.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "LPG can cause frostbite on contact with skin. Gloves provide essential protection." },
      { question: "Is it acceptable to smoke near a forklift charging station as long as you're careful?", type: "mcq_single", options: ["Yes, if no gas is visible", "No, never within 50 feet", "Only during breaks", "Only outdoors"], correctAnswers: "No, never within 50 feet", explanation: "Smoking and open flames must remain at least 50 feet from fueling and charging areas due to explosive gas risk." },
    ],
  },

  // ═══ MODULE 4: Safe Driving + Pedestrians + Intersections ═══
  {
    module: "Safe Driving & Pedestrians",
    title: "Speed, Space, and Awareness",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Speed, Space, and Awareness",
        image: img("safe-driving.svg"),
        sections: [
          { heading: "Speed Limits", content: "<p>The maximum safe speed for operating a forklift is typically <strong>5 mph</strong>. Forklifts are designed to move heavy loads, not to race. Focus on working <strong>efficiently, not faster</strong>.</p>" },
          { heading: "Stopping Distance", content: "<p>Maintain adequate stopping distance at all times. Keep at least <strong>three vehicle lengths</strong> or a <strong>3-second gap</strong> between vehicles.</p>" },
          { heading: "Surface Conditions", content: "<p>Be aware of wet floors, debris, oil spills, and uneven surfaces. These conditions significantly increase stopping distance and tip-over risk. Slow down and navigate carefully.</p>" },
        ],
        takeaways: [
          "Maximum safe speed is typically 5 mph",
          "Maintain at least 3 vehicle lengths between trucks",
          "Wet floors and debris increase stopping distance",
          "Efficiency comes from smooth operation, not speed",
        ],
      }),
    },
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Intersections, Blind Spots, and Horn Use",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Intersections, Blind Spots, and Horn Use",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Approach With Caution", content: "<p>At every intersection, blind corner, or area with limited visibility: <strong>slow down, sound your horn, and look both ways</strong> before proceeding.</p>" },
          { heading: "Mirrors and Visibility", content: "<p>Use available mirrors and look in the direction of travel. If a load blocks your forward view, travel in reverse. Never pass at intersections, blind spots, or hazardous areas.</p>" },
          { heading: "Horn Protocol", content: "<p>The horn is a <strong>warning device</strong>, not a demand for right-of-way. Sound it at intersections, blind corners, doorways, and whenever pedestrians may be present. Use it to alert others to your presence.</p>" },
        ],
        takeaways: [
          "Slow down, honk, and look at every intersection",
          "Use mirrors and drive in reverse when view is blocked",
          "The horn warns others — it doesn't give you right-of-way",
          "Never pass at intersections or blind spots",
        ],
      }),
    },
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Pedestrian Right of Way",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Pedestrian Right of Way",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Pedestrians Always Have Priority", content: "<p>Pedestrians <strong>always have the right of way</strong>. Never drive toward a person near a fixed object. Always ensure people are clear before moving.</p>" },
          { heading: "Communication", content: "<ul><li>Make <strong>eye contact</strong> with pedestrians before proceeding</li><li>Sound the horn as a <strong>warning</strong>, not as a demand to move</li><li>Wait for pedestrians to acknowledge you and move to safety</li></ul>" },
          { heading: "Pedestrian Zones", content: "<p>Be especially alert in areas where pedestrians commonly walk: near break rooms, restrooms, offices, shipping/receiving areas, and anywhere workers cross forklift paths.</p>" },
        ],
        takeaways: [
          "Pedestrians always have the right of way",
          "Make eye contact before proceeding near people",
          "Sound the horn as a warning, not a demand",
          "Be extra alert near break rooms, offices, and crossing areas",
        ],
      }),
    },
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Direction Changes and Smooth Handling",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Direction Changes and Smooth Handling",
        image: img("safe-driving.svg"),
        sections: [
          { heading: "Complete Stop Before Direction Change", content: "<p>Always come to a <strong>complete stop</strong> before changing from forward to reverse or vice versa. Abrupt direction changes can cause loads to shift or fall, and increase tip-over risk.</p>" },
          { heading: "Smooth Movements", content: "<p>Smooth acceleration, braking, and steering prevent load shifts, spills, and tip-overs. Jerky movements are the enemy of stability.</p>" },
          { heading: "Do Not Accelerate While Turning", content: "<p>Accelerating during a turn significantly increases the risk of tipping. The unique weight distribution of a forklift, combined with a heavy load, makes it easy to lose control if not handled carefully.</p>" },
        ],
        takeaways: [
          "Come to a complete stop before changing direction",
          "Smooth acceleration and braking prevent load shifts",
          "Never accelerate while turning",
          "Jerky movements increase tip-over risk",
        ],
      }),
    },
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Knowledge Check: Safe Driving",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "The primary purpose of the forklift horn is to:", type: "mcq_single", options: ["Demand right of way", "Warn others of your presence", "Signal that you're speeding", "Request pedestrians to move faster"], correctAnswers: "Warn others of your presence", explanation: "The horn is a warning device to alert others to the forklift's presence, not a demand for right-of-way." },
      { question: "Pedestrians always have the right of way around forklifts.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Pedestrians always have priority. Operators must yield to pedestrians at all times." },
      { question: "When approaching an intersection, you should:", type: "mcq_single", options: ["Speed up to clear it quickly", "Stop, sound horn, and look both ways", "Flash your headlights", "Assume no one is coming"], correctAnswers: "Stop, sound horn, and look both ways", explanation: "Operators must slow down/stop, sound the horn, and look before proceeding through any intersection." },
      { question: "The safest way to change direction (forward to reverse) is to:", type: "mcq_single", options: ["Come to a complete stop first", "Shift quickly while moving", "Turn the steering wheel sharply", "Accelerate through the change"], correctAnswers: "Come to a complete stop first", explanation: "Always stop completely before changing direction to prevent load shifts and maintain stability." },
      { question: "It's okay to speed if no one else is around.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "Speed limits apply at all times regardless of whether other people are present. Hazards can appear unexpectedly." },
    ],
  },

  // ═══ MODULE 5: Ramps, Docks, Trailers, and Elevated Work ═══
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Ramps and Slopes",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Ramps and Slopes",
        image: img("ramps-slopes.svg"),
        sections: [
          { heading: "Loaded Travel on Ramps", content: "<p>When traveling on a ramp <strong>with a load</strong>: keep the load pointed <strong>uphill</strong> (upgrade). This means driving forward up a ramp and in reverse down a ramp when loaded.</p>" },
          { heading: "Unloaded Travel on Ramps", content: "<p>When traveling on a ramp <strong>without a load</strong>: the forks should point <strong>downhill</strong> (downgrade).</p>" },
          { heading: "Ramp Safety Rules", content: "<ul><li>Ascend and descend slowly</li><li>On steep grades (>10%), travel with load upgrade</li><li>Tilt load back slightly for stability</li><li><strong>Never turn on a ramp</strong> — the risk of tip-over is extremely high</li><li>Never park on a ramp unless absolutely necessary (chock wheels if you must)</li></ul>" },
        ],
        takeaways: [
          "Loaded: keep load pointed uphill (upgrade)",
          "Unloaded: forks pointed downhill (downgrade)",
          "Never turn on a ramp — extreme tip-over risk",
          "Travel slowly and tilt the load back slightly",
        ],
        warning: "Turning on a ramp dramatically increases tip-over risk. Always travel straight up or down.",
      }),
    },
  },
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Docks and Trailer Safety",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Docks and Trailer Safety",
        image: img("dock-safety.svg"),
        sections: [
          { heading: "Before Entering a Trailer", content: "<p>Before driving into any truck or trailer:</p><ul><li>Verify the trailer is <strong>properly chocked</strong> (wheel chocks in place)</li><li>Confirm the trailer <strong>brakes are set</strong></li><li>Check the condition of the trailer floor — look for rot, holes, or weakness</li><li>Ensure a <strong>dock plate</strong> is properly positioned</li></ul>" },
          { heading: "Dock Plates", content: "<p>Never attempt to drive directly from the dock to the trailer without a dock plate. This can result in a spilled load or a stuck forklift. Keep forks at the recommended <strong>4–6 inch</strong> carrying height when entering.</p>" },
          { heading: "Edge Awareness", content: "<p>Maintain at least <strong>one tire-width distance</strong> from dock edges or platform edges. Drop-off hazards are a serious risk in dock areas.</p>" },
          { heading: "Trailer Movement", content: "<p>A forklift's braking force can cause an unbraked trailer to move away from the dock, potentially trapping the forklift inside. <strong>Always verify chocks and brakes</strong> before entering.</p>" },
        ],
        takeaways: [
          "Always verify chocks and brakes before entering a trailer",
          "Use a dock plate — never jump the gap",
          "Check trailer floor condition before driving on it",
          "Maintain at least one tire-width from dock edges",
        ],
      }),
    },
  },
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Lifting People and Elevated Work",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Lifting People and Elevated Work",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Never Lift People on Bare Forks", content: "<p>It is <strong>never acceptable</strong> to lift a person on the forks without an approved safety platform. This includes standing on pallets, buckets, or any makeshift platform.</p>" },
          { heading: "Approved Safety Platforms", content: "<p>An OSHA-approved safety platform must include:</p><ul><li><strong>42-inch guardrails</strong> on all sides</li><li>Mid-rail positioned halfway between top rail and platform</li><li><strong>4-inch toe boards</strong></li><li>Secure attachment to the mast (chain or locking device)</li><li><strong>7-foot overhead guard</strong> for crush protection</li><li>Personal fall protection (safety line and harness)</li></ul>" },
          { heading: "Operator Responsibilities During Elevation", content: "<p>When lifting a person in a platform: the engine must remain running, the operator must <strong>stay at the controls at all times</strong>, and the forklift must not be driven to another location with a person elevated.</p>" },
        ],
        takeaways: [
          "Never lift people on bare forks or makeshift platforms",
          "Only use OSHA-approved platforms with guardrails and fall protection",
          "Operator must remain at the controls while someone is elevated",
          "Never move the forklift with a person elevated in a platform",
        ],
      }),
    },
  },
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Knowledge Check: Ramps, Docks & Elevation",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "When traveling UP a ramp with a load, the load should face:", type: "mcq_single", options: ["Downhill", "Uphill", "It doesn't matter", "Sideways"], correctAnswers: "Uphill", explanation: "When traveling on a ramp with a load, keep the load pointed uphill (upgrade) to prevent the load from sliding off the forks." },
      { question: "Is it acceptable to lift a maintenance worker on the forks without a safety platform?", type: "mcq_single", options: ["Yes, if they hold on", "No, never without an approved safety platform", "Yes, for quick tasks", "Only with supervisor approval"], correctAnswers: "No, never without an approved safety platform", explanation: "Lifting people on bare forks is never acceptable. An OSHA-approved safety platform with guardrails, toe boards, and fall protection is required." },
      { question: "An OSHA-approved safety platform must include guardrails, toe boards, and fall protection.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Approved platforms must have 42-inch guardrails, mid-rails, 4-inch toe boards, secure mast attachment, overhead guard, and personal fall protection." },
    ],
  },

  // ═══ MODULE 6: Parking, Unattended Forklift, and Shutdown ═══
  {
    module: "Parking & Shutdown",
    title: "Parking and Securing the Forklift",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Parking and Securing the Forklift",
        image: img("parking-shutdown.svg"),
        sections: [
          { heading: "Parking Procedure", content: "<p>When parking your forklift:</p><ol><li><strong>Lower forks</strong> completely flat to the ground</li><li>Tilt forks slightly forward</li><li><strong>Set the parking brake</strong></li><li><strong>Neutralize all controls</strong></li><li><strong>Turn off the engine/power</strong></li><li><strong>Remove the key</strong></li></ol>" },
          { heading: "Parking Location", content: "<p>Park only in <strong>designated areas</strong>. Never block fire exits, emergency equipment, or traffic lanes. If parking on an incline, chock the wheels.</p>" },
        ],
        takeaways: [
          "Lower forks, set brake, neutralize controls, turn off engine, remove key",
          "Park only in designated areas",
          "Never block fire exits or emergency equipment",
          "Chock wheels if parking on an incline",
        ],
      }),
    },
  },
  {
    module: "Parking & Shutdown",
    title: "Unattended Forklift Definition",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Unattended Forklift: When and What To Do",
        image: img("parking-shutdown.svg"),
        sections: [
          { heading: "What 'Unattended' Means", content: "<p>A forklift is considered <strong>unattended</strong> when the operator is <strong>more than 25 feet away</strong> from the vehicle AND the vehicle is <strong>out of their line of sight</strong>.</p>" },
          { heading: "Unattended Procedure", content: "<p>When leaving a forklift unattended:</p><ul><li>Shut off power</li><li>Set brakes</li><li>Lower forks fully</li><li>Return mast to vertical</li><li>Remove the key to prevent unauthorized use</li><li>Block wheels if on an incline</li></ul>" },
          { heading: "Temporarily Dismounted (Within 25 Feet)", content: "<p>If you are within 25 feet and have the forklift in your line of sight:</p><ul><li>Lower forks</li><li>Neutralize controls</li><li>Set brakes</li></ul><p>You do not need to remove the key in this case, but the forklift must be secured.</p>" },
          { heading: "Reporting Accidents", content: "<p>Report <strong>all accidents</strong>, even minor ones — including minor scrapes, near-misses, and property damage. Failure to report can lead to disciplinary action and hides safety issues that need to be addressed.</p>" },
        ],
        takeaways: [
          "Unattended = 25+ feet away AND out of sight",
          "Full shutdown required when unattended: power off, brake set, key removed",
          "Within 25 feet: lower forks, neutralize controls, set brakes",
          "Report ALL accidents, even minor ones",
        ],
      }),
    },
  },
  {
    module: "Parking & Shutdown",
    title: "Knowledge Check: Parking & Shutdown",
    type: "checkpoint",
    estimatedMinutes: 1,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "When leaving a forklift unattended, the correct steps include:", type: "mcq_single", options: ["Just turn off the engine", "Lower forks, set brake, turn off engine, remove key", "Set the brake only", "Nothing if it's just for a few minutes"], correctAnswers: "Lower forks, set brake, turn off engine, remove key", explanation: "When unattended: shut off power, set brakes, lower forks, return mast to vertical, and remove the key." },
      { question: "You should report accidents even if they seem minor.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "All accidents must be reported, including minor ones and near-misses. This helps identify and correct safety issues." },
    ],
  },

  // ═══ MODULE 7: Site-Specific Rules + Employer Packet ═══
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "Site-Specific Training Matters",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Site-Specific Training Matters",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Every Workplace Is Different", content: "<p>Every worksite has unique hazards: narrow aisles, specific pedestrian traffic patterns, loading docks, racking configurations, cold storage areas, outdoor areas, and more. Your supervisor must review <strong>site-specific policies</strong> with you before you operate at any new location.</p>" },
          { heading: "Site-Specific Topics", content: "<ul><li>Facility speed limits and traffic patterns</li><li>Designated parking and charging areas</li><li>Pedestrian zones and crossings</li><li>Emergency procedures and assembly points</li><li>Communication protocols (radio, signals)</li><li>Specific equipment types and attachments used</li></ul>" },
          { heading: "Refresher Training", content: "<p>Additional training is required when:</p><ul><li>Operating a new type of equipment</li><li>Working at a new facility</li><li>After an accident or near-miss</li><li>When unsafe operation is observed</li></ul>" },
        ],
        takeaways: [
          "Every workplace has unique hazards that require site-specific training",
          "Your supervisor must review site policies before you operate",
          "Additional training is required for new equipment or facilities",
          "After accidents or observed unsafe behavior, retraining is required",
        ],
      }),
    },
  },
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "OSHA Rules & Regulations (Reference)",
    type: "download",
    estimatedMinutes: 1,
    config: {
      description: "This reference document outlines the essential OSHA safety standards for Powered Industrial Truck operators. Your training has been covered by the lessons in this course — this is provided as an additional reference.",
      downloads: [
        { label: "OSHA Guidelines for Safe Operation of PITs (PDF)", url: "/api/documents/osha-rules-regulations/download", filename: "OSHA-Guidelines-for-the-Safe-Operation-of-Powered-Industrial-Trucks.pdf" },
      ],
    },
  },
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "Employer Practical Evaluation Packet",
    type: "download",
    estimatedMinutes: 2,
    config: {
      description: "Your employer must complete a hands-on evaluation before you can operate a forklift at their facility. Provide these forms to your supervisor. They include the performance evaluation checklist, operator permit/authorization form, and site attendance sheet.",
      downloads: [
        { label: "Performance Test (PDF)", url: "/api/documents/performance-evaluation/download", filename: "PERFORMANCE-TEST.pdf" },
        { label: "PIT Permit to Operate (PDF)", url: "/api/documents/operator-permit/download", filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf" },
        { label: "Attendance Form & Scheduling (PDF)", url: "/api/documents/attendance-sheet/download", filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf" },
      ],
      important: "Have your supervisor complete these forms and keep them on file. OSHA may request these records during inspections.",
    },
  },
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "Site Presentation (Reference)",
    type: "download",
    estimatedMinutes: 1,
    config: {
      description: "This presentation covers OSHA guidelines, equipment types, safe operating procedures, and loading protocols. It serves as a comprehensive reference for forklift operators.",
      downloads: [
        { label: "Forklift Certified Training Presentation (PDF)", url: "/api/documents/site-presentation/download", filename: "Forklift-Certified-Training.pdf" },
      ],
    },
  },

  // ═══ MODULE 8: Final Exam + Completion ═══
  {
    module: "Final Exam & Completion",
    title: "Final Exam: Forklift Operator Certification",
    type: "exam",
    estimatedMinutes: 15,
    config: {
      passing_score: 80,
      max_attempts: 3,
      randomize_questions: true,
    },
    questions: [
      { question: "What is the maximum recommended safe speed for a forklift in a warehouse?", type: "mcq_single", options: ["3 mph", "5 mph", "10 mph", "15 mph"], correctAnswers: "5 mph", explanation: "OSHA recommends a maximum of 5 mph in warehouse environments." },
      { question: "Before operating a forklift at the start of each shift, you must:", type: "mcq_single", options: ["Start the engine and test it while driving", "Perform a pre-operation inspection", "Load cargo first to test the forks", "Check only the fuel level"], correctAnswers: "Perform a pre-operation inspection", explanation: "A complete pre-operation inspection must be performed before every shift." },
      { question: "Which OSHA standard covers powered industrial trucks (forklifts)?", type: "mcq_single", options: ["29 CFR 1910.176", "29 CFR 1910.178", "29 CFR 1910.180", "29 CFR 1926.602"], correctAnswers: "29 CFR 1910.178", explanation: "29 CFR 1910.178 is the specific OSHA standard for powered industrial trucks." },
      { question: "How often must forklift operators be re-evaluated per OSHA requirements?", type: "mcq_single", options: ["Every year", "Every 2 years", "Every 3 years", "Every 5 years"], correctAnswers: "Every 3 years", explanation: "OSHA requires operator re-evaluation at least every three years." },
      { question: "When traveling with a large load that blocks your forward view, you should:", type: "mcq_single", options: ["Drive slowly forward", "Travel in reverse to maintain a clear line of sight", "Honk repeatedly while driving forward", "Have someone walk ahead"], correctAnswers: "Travel in reverse to maintain a clear line of sight", explanation: "When a load obstructs forward vision, the operator should travel in reverse for a clear line of sight." },
      { question: "The stability triangle on a forklift is formed by:", type: "mcq_single", options: ["The dashboard warning lights", "The two front axle ends and the rear axle pivot point", "The three pedals", "The fuel gauge, temperature, and battery indicators"], correctAnswers: "The two front axle ends and the rear axle pivot point", explanation: "The stability triangle is the three-point base formed by the two front axle ends and the rear axle pivot point." },
      { question: "When is it acceptable to carry passengers on a forklift?", type: "mcq_single", options: ["Never, unless an OSHA-approved safety platform is mounted", "When going slowly", "In emergencies only", "When a supervisor permits it"], correctAnswers: "Never, unless an OSHA-approved safety platform is mounted", explanation: "Passengers are never allowed unless using an OSHA-approved work platform with guardrails and fall protection." },
      { question: "At intersections and blind corners, forklift operators should:", type: "mcq_single", options: ["Speed up to clear quickly", "Stop, sound horn, and proceed slowly after checking", "Trust that pedestrians will move", "Flash headlights"], correctAnswers: "Stop, sound horn, and proceed slowly after checking", explanation: "Operators must stop, sound the horn, and look both ways before proceeding through any intersection." },
      { question: "Forklifts must be refueled or recharged:", type: "mcq_single", options: ["Anywhere that's convenient", "Only in designated areas with proper ventilation", "While the engine is running", "Near the loading dock"], correctAnswers: "Only in designated areas with proper ventilation", explanation: "Refueling/recharging must only occur in designated, well-ventilated areas." },
      { question: "The primary cause of forklift tip-overs is:", type: "mcq_single", options: ["Engine failure", "Overloading and improper turning", "Bad tires", "Low fuel"], correctAnswers: "Overloading and improper turning", explanation: "Most tip-overs result from exceeding load capacity or turning too sharply/quickly." },
      { question: "What is the minimum age required to operate a forklift?", type: "mcq_single", options: ["16", "18", "21", "No minimum with training"], correctAnswers: "18", explanation: "OSHA requires operators to be at least 18 years old." },
      { question: "Who is responsible for ensuring forklift operators are properly trained?", type: "mcq_single", options: ["The operator", "The employer", "OSHA directly", "The forklift manufacturer"], correctAnswers: "The employer", explanation: "Under 29 CFR 1910.178(l), the employer is responsible for ensuring operators are trained and evaluated." },
      { question: "When going UP a ramp with a load, you should:", type: "mcq_single", options: ["Drive forward with load pointing uphill", "Drive in reverse with load pointing downhill", "Drive sideways for stability", "Speed up for momentum"], correctAnswers: "Drive forward with load pointing uphill", explanation: "When ascending a ramp with a load, travel with the load pointed uphill (upgrade) — drive forward up the ramp." },
      { question: "How far from the ground should forks be carried when traveling?", type: "mcq_single", options: ["At knee height", "At waist height", "4 to 6 inches", "Fully on the ground"], correctAnswers: "4 to 6 inches", explanation: "Carry forks 4–6 inches from the ground to keep the center of gravity low and reduce tip-over risk." },
      { question: "When parking a forklift and leaving it unattended, you must:", type: "mcq_single", options: ["Just turn off the engine", "Lower forks, set brake, turn off engine, and remove the key", "Leave it running for the next operator", "Only set the parking brake"], correctAnswers: "Lower forks, set brake, turn off engine, and remove the key", explanation: "Full shutdown is required: lower forks, set brake, turn off engine, remove key, and chock wheels if on an incline." },
      { question: "A forklift is considered 'unattended' when the operator is:", type: "mcq_single", options: ["5 feet away", "10 feet away", "More than 25 feet away and out of the line of sight", "In the same building"], correctAnswers: "More than 25 feet away and out of the line of sight", explanation: "A vehicle is unattended when the operator is more than 25 feet away AND the vehicle is out of their view." },
      { question: "Using attachments on a forklift:", type: "mcq_single", options: ["Increases the rated capacity", "Has no effect on capacity", "Reduces the rated capacity", "Only affects speed"], correctAnswers: "Reduces the rated capacity", explanation: "Attachments change the center of gravity and reduce the forklift's rated lifting capacity." },
      { question: "Pedestrians near forklift operations:", type: "mcq_single", options: ["Should move out of the way quickly", "Always have the right of way", "Must wear reflective vests to be seen", "Should signal the operator"], correctAnswers: "Always have the right of way", explanation: "Pedestrians always have the right of way. Forklift operators must yield to pedestrians at all times." },
      { question: "This online course alone fully satisfies all OSHA forklift training requirements.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "OSHA requires formal instruction (this course) PLUS practical training and evaluation conducted by the employer." },
      { question: "If you discover a hydraulic leak during pre-shift inspection, you should:", type: "mcq_single", options: ["Continue working carefully", "Report it and do NOT operate the forklift", "Top off the hydraulic fluid and continue", "Check again at end of shift"], correctAnswers: "Report it and do NOT operate the forklift", explanation: "Never operate a forklift with fluid leaks. Hydraulic leaks can cause sudden loss of load control." },
      { question: "Smoking is prohibited within how many feet of fueling or charging areas?", type: "mcq_single", options: ["10 feet", "25 feet", "50 feet", "100 feet"], correctAnswers: "50 feet", explanation: "No smoking or open flames within 50 feet of fueling stations and battery recharging areas." },
      { question: "Before driving into a trailer at a loading dock, you must verify:", type: "mcq_single", options: ["The trailer color matches the order", "Wheel chocks are in place and brakes are set", "The trailer is empty", "The dock light is green"], correctAnswers: "Wheel chocks are in place and brakes are set", explanation: "Always verify chocks are placed and trailer brakes are set to prevent the trailer from separating from the dock." },
      { question: "When should forklift operators sound their horn?", type: "mcq_single", options: ["Only in emergencies", "At intersections, blind corners, and areas with pedestrians", "Only when the supervisor is watching", "Only outdoors"], correctAnswers: "At intersections, blind corners, and areas with pedestrians", explanation: "Sound the horn at intersections, blind corners, doorways, and whenever pedestrians may be present." },
      { question: "An OSHA-approved safety platform for lifting people must include:", type: "mcq_single", options: ["Just a flat surface", "Guardrails, toe boards, mast attachment, and fall protection", "A ladder", "Nothing special — any platform works"], correctAnswers: "Guardrails, toe boards, mast attachment, and fall protection", explanation: "OSHA requires 42-inch guardrails, mid-rails, 4-inch toe boards, secure mast attachment, overhead guard, and personal fall protection." },
      { question: "Operators should keep their entire body inside the forklift's protective cage at all times.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Never extend any body part beyond the protective cage to avoid crush hazards." },
      { question: "OSHA fines for operating without proper forklift certification can reach:", type: "mcq_single", options: ["$100 per employee", "$1,000 per employee", "$7,000 per day per unqualified employee", "No fines, just warnings"], correctAnswers: "$7,000 per day per unqualified employee", explanation: "OSHA can fine employers up to $7,000 per day per uncertified operator, retroactive to the hire date." },
      { question: "After successfully completing the final exam, what must your employer still do?", type: "mcq_single", options: ["Nothing — you're fully certified", "Conduct practical training and evaluation at the worksite", "File paperwork with OSHA", "Buy you a hard hat"], correctAnswers: "Conduct practical training and evaluation at the worksite", explanation: "The employer must still provide hands-on training specific to the equipment and workplace, and evaluate the operator's performance." },
    ],
  },
  {
    module: "Final Exam & Completion",
    title: "Congratulations: What's Next",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "You're Certified! What's Next",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "Your Certificate", content: "<p>Congratulations on completing the formal instruction portion of your forklift operator certification! Your digital certificate is now available for download. It includes a unique certificate number and QR code that employers can use for instant verification.</p>" },
          { heading: "Next Step: Practical Evaluation", content: "<p>Remember, your employer must still complete the <strong>hands-on practical evaluation</strong> at your worksite. Share the employer documentation packet (available in Module 7) with your supervisor. It includes:</p><ul><li>Performance Evaluation Checklist</li><li>Operator Permit / Authorization Form</li><li>Site Attendance Sheet</li></ul>" },
          { heading: "Wallet Card (Optional)", content: "<p>Want a professional, wallet-sized operator ID card? Order your physical card from your certification page. It makes it easy to show proof of training on the job.</p>" },
          { heading: "Stay Safe", content: "<p>Your training doesn't end here. Continue to follow safe operating procedures every day. If you ever have questions or need a refresher, you can revisit this course at any time. Stay safe out there!</p>" },
        ],
        takeaways: [
          "Download your certificate from your certification page",
          "Share the employer packet with your supervisor for practical evaluation",
          "Consider ordering a wallet-sized operator ID card",
          "Re-evaluation is required at least every 3 years",
        ],
        tip: "Bookmark your verification page link — employers can use it to instantly verify your certification.",
      }),
    },
  },
];
