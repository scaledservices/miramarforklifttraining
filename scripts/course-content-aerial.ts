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
  title: "Aerial & Scissor Lift Operator Certification",
  slug: "online-aerial-scissor-lift-certification",
  description: "Comprehensive OSHA-compliant aerial lift and scissor lift operator training. Covers OSHA 29 CFR 1926.453 and ANSI/SAIA A92 standards. Includes formal instruction on equipment types, pre-operation inspection, fall protection, stability, safe operation, workplace hazards, and emergency procedures. Note: OSHA also requires employer-conducted practical training and evaluation on the specific equipment.",
  category: "aerial",
  price: "59.00",
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
  // ═══ MODULE 0: Welcome + OSHA/ANSI Compliance ═══
  {
    module: "Welcome & OSHA/ANSI Compliance",
    title: "Welcome to Aerial & Scissor Lift Certification",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Welcome to Aerial & Scissor Lift Certification",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "About This Course", content: "<p>Welcome! This online course provides the <strong>formal instruction</strong> portion of OSHA-compliant aerial lift and scissor lift operator certification. The course takes approximately <strong>60-90 minutes</strong> to complete.</p>" },
          { heading: "What's Included", content: "<ul><li>Interactive training modules covering all OSHA and ANSI-required topics</li><li>Knowledge check quizzes throughout</li><li>Final certification exam (80% passing score)</li><li>Digital certificate with QR-verified credential</li><li>Employer documentation packet for practical evaluation</li></ul>" },
          { heading: "What's NOT Included", content: "<p>OSHA and ANSI require <strong>multiple components</strong> for full certification: (1) formal instruction (this course), (2) hands-on practical training on the specific equipment, and (3) an evaluation of operator performance. Your employer must conduct the hands-on portion at your worksite.</p>" },
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
    module: "Welcome & OSHA/ANSI Compliance",
    title: "OSHA & ANSI Compliance: What This Course Covers",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "OSHA & ANSI Compliance: What This Course Covers",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "OSHA Regulations", content: "<p>Aerial lifts are regulated under <strong>29 CFR 1926.453</strong> (aerial lifts in construction) and <strong>29 CFR 1910.178</strong> (powered industrial trucks, which includes scissor lifts under OSHA enforcement). OSHA requires operators to receive:</p><ol><li><strong>Formal instruction</strong> — classroom or online training (this course)</li><li><strong>Practical training</strong> — hands-on experience on the specific equipment</li><li><strong>Evaluation</strong> — a qualified person must evaluate the operator's competence</li></ol>" },
          { heading: "ANSI/SAIA A92 Standards", content: "<p>The <strong>American National Standards Institute (ANSI)</strong> and the <strong>Scaffold & Access Industry Association (SAIA)</strong> maintain the A92 series for Mobile Elevating Work Platforms (MEWPs):</p><ul><li><strong>A92.20</strong> — Design, Safety, and Verification</li><li><strong>A92.22</strong> — Safe Use of MEWPs</li><li><strong>A92.24</strong> — Training Requirements for MEWP Operators, Occupants, Supervisors, and Service Personnel</li></ul><p>The 2020 revision restructured these standards and replaced the term 'aerial work platform' with 'MEWP.'</p>" },
          { heading: "What We Provide", content: "<ul><li>Complete formal instruction covering all OSHA and ANSI-required topics</li><li>Knowledge assessment via final exam</li><li>Certificate of completion for the formal instruction portion</li><li>Employer documentation packet including evaluation checklists</li></ul>" },
          { heading: "What Your Employer Must Do", content: "<p>After completing this course, your employer must:</p><ul><li>Provide hands-on, equipment-specific practical training</li><li>Evaluate your performance in the actual workplace</li><li>Complete and maintain the required documentation</li><li>Ensure familiarization with the specific make/model you will operate</li><li>Re-evaluate operators at least every 3 years</li></ul>" },
        ],
        takeaways: [
          "Aerial lifts are regulated under 29 CFR 1926.453 and 1910.178",
          "ANSI/SAIA A92 standards cover MEWP design, use, and training",
          "This course covers formal instruction only — practical training is also required",
          "Operators must be familiarized with the specific equipment they will operate",
        ],
        warning: "Do not operate an aerial or scissor lift until your employer has completed your hands-on training and evaluation on the specific equipment.",
      }),
    },
  },
  {
    module: "Welcome & OSHA/ANSI Compliance",
    title: "Knowledge Check: OSHA & ANSI Requirements",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Which OSHA standard specifically covers aerial lifts?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 is the OSHA standard for aerial lifts. Scissor lifts are enforced under 1910.178 (powered industrial trucks)." },
      { question: "What does the ANSI A92.24 standard cover?", type: "mcq_single", options: ["Equipment design requirements", "Training requirements for MEWP operators", "Load capacity ratings", "Maintenance schedules"], correctAnswers: "Training requirements for MEWP operators", explanation: "ANSI A92.24 covers training requirements for MEWP operators, occupants, supervisors, and service personnel." },
      { question: "This online course alone fully satisfies all OSHA aerial lift training requirements.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "OSHA requires formal instruction (this course) PLUS practical training and evaluation on the specific equipment by the employer." },
    ],
  },

  // ═══ MODULE 1: Aerial Lift Basics & Classifications ═══
  {
    module: "Aerial Lift Basics & Classifications",
    title: "What is a Mobile Elevating Work Platform (MEWP)?",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "What is a Mobile Elevating Work Platform (MEWP)?",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Definition", content: "<p>A <strong>Mobile Elevating Work Platform (MEWP)</strong> is a machine used to position personnel, tools, and materials at elevated work locations. MEWPs include aerial lifts, scissor lifts, boom lifts, and vertical towers. The term MEWP was adopted by ANSI in the 2020 revision of the A92 standards.</p>" },
          { heading: "MEWP Groups (ANSI A92.20)", content: "<p>ANSI classifies MEWPs into two groups based on how the platform is positioned:</p><ul><li><strong>Group A:</strong> Platforms that can only be elevated vertically — the platform stays within the tipping lines (e.g., scissor lifts, vertical lifts)</li><li><strong>Group B:</strong> Platforms that can be positioned beyond the tipping lines — the boom allows the platform to extend horizontally (e.g., articulating boom lifts, telescopic boom lifts)</li></ul>" },
          { heading: "MEWP Types", content: "<p>Within each group, MEWPs are further classified by type:</p><ul><li><strong>Type 1:</strong> Drive is only allowed in the stowed position (not elevated)</li><li><strong>Type 2:</strong> Drive is allowed with the platform in the elevated position</li><li><strong>Type 3:</strong> Drive is allowed with the platform elevated, but drive is controlled from the platform (not the chassis)</li></ul>" },
          { heading: "Common Equipment Types", content: "<ul><li><strong>Scissor lifts</strong> (Group A) — vertical elevation only, large platform area</li><li><strong>Articulating boom lifts</strong> (Group B) — jointed arm provides up-and-over reach</li><li><strong>Telescopic boom lifts</strong> (Group B) — straight arm extends for maximum horizontal reach</li><li><strong>Vertical personnel lifts</strong> (Group A) — small platforms for single-person vertical access</li></ul>" },
        ],
        takeaways: [
          "MEWPs are classified into Group A (vertical only) and Group B (can extend beyond tipping lines)",
          "Scissor lifts are Group A; boom lifts are Group B",
          "Types 1, 2, and 3 define when and from where driving is permitted",
          "The term MEWP replaced 'aerial work platform' in the 2020 ANSI revision",
        ],
      }),
    },
  },
  {
    module: "Aerial Lift Basics & Classifications",
    title: "Scissor Lifts: Operation and Components",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Scissor Lifts: Operation and Components",
        image: img("scissor-lift-hero.svg"),
        sections: [
          { heading: "What is a Scissor Lift?", content: "<p>A <strong>scissor lift</strong> is a Group A MEWP that uses crossed tubular supports (a pantograph mechanism) to raise and lower the platform vertically. Scissor lifts provide a large, stable working platform ideal for tasks requiring multiple workers and materials at moderate heights.</p>" },
          { heading: "Key Components", content: "<ul><li><strong>Platform:</strong> The work area with guardrails and entry gate</li><li><strong>Scissor mechanism:</strong> Crossed supports that extend/retract to raise/lower</li><li><strong>Chassis/base:</strong> The drive unit with wheels or tracks</li><li><strong>Controls:</strong> Upper (platform) and lower (ground) control panels</li><li><strong>Poletree/Extension deck:</strong> Optional extendable platform section</li><li><strong>Power source:</strong> Electric battery or internal combustion (diesel, gas, LPG)</li></ul>" },
          { heading: "Operation Controls", content: "<p>Scissor lifts have both <strong>upper and lower controls</strong>. The upper controls are at the platform and are used by the operator during elevation. Lower controls are at ground level. Per OSHA, lower controls must be able to override upper controls in an emergency, but should not be used for normal operation when an operator is in the platform.</p>" },
          { heading: "Driving Capability", content: "<p>Most modern scissor lifts are <strong>Type 3</strong> — they can be driven from the platform controls while elevated. However, driving while elevated should be done cautiously and only on suitable surfaces. Always check the manufacturer's operating manual for specific limitations.</p>" },
        ],
        takeaways: [
          "Scissor lifts are Group A MEWPs with vertical-only elevation",
          "They have both upper (platform) and lower (ground) controls",
          "Lower controls can override upper controls in emergencies",
          "Most modern scissor lifts can be driven from the platform while elevated",
        ],
        tip: "Always read the manufacturer's operating manual for the specific make and model before operating any MEWP.",
      }),
    },
  },
  {
    module: "Aerial Lift Basics & Classifications",
    title: "Boom Lifts: Articulating and Telescopic",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Boom Lifts: Articulating and Telescopic",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Articulating Boom Lifts", content: "<p><strong>Articulating boom lifts</strong> (knuckle booms) have multiple hinged sections that allow the platform to reach up and over obstacles. The jointed arm provides excellent maneuverability for reaching over equipment, structures, or obstacles. These are classified as <strong>Group B</strong> MEWPs because the platform can extend beyond the tipping lines.</p>" },
          { heading: "Telescopic Boom Lifts", content: "<p><strong>Telescopic boom lifts</strong> (stick booms) use straight, extendable sections for maximum horizontal and vertical reach. They offer the highest reach capabilities but cannot reach over obstacles. Also classified as <strong>Group B</strong> MEWPs.</p>" },
          { heading: "Key Differences from Scissor Lifts", content: "<ul><li>Boom lifts can position the platform <strong>beyond the chassis footprint</strong></li><li>They have <strong>greater reach</strong> but typically smaller platform sizes</li><li>Group B MEWPs require additional <strong>fall protection</strong> considerations</li><li>Outriggers or stabilizers are often required for operation</li><li>More complex stability calculations apply</li></ul>" },
          { heading: "Power and Drive Options", content: "<p>Boom lifts may be powered by electric batteries (indoor use), diesel (outdoor/rough terrain), or dual fuel. Many models offer two-wheel, four-wheel, or crab steering for positioning in tight spaces.</p>" },
        ],
        takeaways: [
          "Articulating booms have jointed arms for up-and-over reach",
          "Telescopic booms use straight extension for maximum reach distance",
          "Both are Group B MEWPs — platform extends beyond tipping lines",
          "Outriggers/stabilizers are typically required for boom lift operation",
        ],
      }),
    },
  },
  {
    module: "Aerial Lift Basics & Classifications",
    title: "Knowledge Check: MEWP Basics",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "A scissor lift is classified as which MEWP group?", type: "mcq_single", options: ["Group A", "Group B", "Group C", "It is not a MEWP"], correctAnswers: "Group A", explanation: "Scissor lifts are Group A MEWPs because the platform can only be elevated vertically and stays within the tipping lines." },
      { question: "Which type of boom lift has jointed sections that allow reaching over obstacles?", type: "mcq_single", options: ["Telescopic boom lift", "Articulating boom lift", "Vertical tower", "Scissor lift"], correctAnswers: "Articulating boom lift", explanation: "Articulating boom lifts (knuckle booms) have multiple hinged sections that allow the platform to reach up and over obstacles." },
      { question: "On a MEWP, the lower controls should be able to:", type: "mcq_single", options: ["Only be used for driving", "Override the upper controls in an emergency", "Be locked out permanently", "Only be used for refueling"], correctAnswers: "Override the upper controls in an emergency", explanation: "Per OSHA, lower controls must be able to override upper controls in an emergency, but should not be used for normal operation when an operator is in the platform." },
    ],
  },

  // ═══ MODULE 2: Pre-Operation Inspection ═══
  {
    module: "Pre-Operation Inspection",
    title: "Pre-Operation Inspection Checklist",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Pre-Operation Inspection Checklist",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "OSHA Requirement", content: "<p>Under <strong>29 CFR 1926.453(a)(1)</strong>, lift controls shall be tested each day prior to use to determine that such controls are in safe working condition. This is a mandatory daily requirement.</p>" },
          { heading: "Visual Inspection", content: "<p>Walk around the entire MEWP, checking for:</p><ul><li><strong>Platform and guardrails:</strong> Check for damage, loose components, missing guardrails</li><li><strong>Hoses and cables:</strong> Look for leaks, chafing, kinks, or wear</li><li><strong>Tires/wheels:</strong> Check for damage, proper inflation, lug nut tightness</li><li><strong>Battery/fuel system:</strong> Check charge level, fuel level, leaks</li><li><strong>Structural components:</strong> Inspect for cracks, bends, weld failures</li><li><strong>Outriggers/stabilizers:</strong> Check for proper function and pad condition</li><li><strong>Safety signs and decals:</strong> Ensure capacity labels and warnings are legible</li><li><strong>Guardrails and gates:</strong> Verify chains/gates are in place and functional</li></ul>" },
          { heading: "Functional Testing", content: "<p>After the visual inspection, perform a <strong>functional test</strong> of all controls:</p><ul><li>Test <strong>upper controls</strong> (platform): raise, lower, drive, steer</li><li>Test <strong>lower controls</strong> (ground): raise, lower, emergency stop</li><li>Test <strong>emergency lowering</strong> system</li><li>Test <strong>horn</strong> and <strong>alarm systems</strong></li><li>Test <strong>brakes</strong> and <strong>steering</strong></li><li>Verify <strong>tilt alarms</strong> if equipped</li><li>Test <strong>power disconnect/emergency stop</strong></li></ul>" },
          { heading: "Tag Out Unsafe Equipment", content: "<p>If any defect or safety issue is found during inspection, <strong>do not operate the MEWP</strong>. Tag it out of service immediately and report the problem to your supervisor. Equipment must be repaired before it can be returned to service.</p>" },
        ],
        takeaways: [
          "OSHA requires lift controls to be tested each day before use (29 CFR 1926.453)",
          "Perform both a visual inspection and functional test of all controls",
          "Check platform, guardrails, hoses, tires, fuel/battery, and safety devices",
          "Tag out and report any unsafe equipment immediately",
        ],
        warning: "Never operate a MEWP that fails inspection. Any defect must be corrected before use.",
      }),
    },
  },
  {
    module: "Pre-Operation Inspection",
    title: "Battery and Fuel Maintenance",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Battery and Fuel Maintenance",
        image: img("ppe-gloves.svg"),
        sections: [
          { heading: "Battery-Powered MEWPs", content: "<p>Electric MEWPs use deep-cycle batteries. Proper maintenance extends battery life and ensures safe operation:</p><ul><li>Charge batteries in <strong>designated, ventilated areas</strong> only</li><li>Turn off charger before connecting or disconnecting</li><li>Batteries produce <strong>hydrogen gas</strong> during charging — ensure adequate ventilation</li><li>Check electrolyte levels (if applicable) and add only distilled water</li><li>Wear <strong>chemical-resistant gloves and eye protection</strong> when handling batteries</li><li>Never smoke or use open flames near charging batteries</li></ul>" },
          { heading: "Internal Combustion MEWPs", content: "<p>Diesel, gasoline, or LPG-powered MEWPs require specific fuel safety:</p><ul><li>Refuel only in <strong>designated areas</strong> with proper ventilation</li><li>Turn off the engine before refueling</li><li>No smoking or open flames within <strong>50 feet</strong> of refueling</li><li>Wear gloves when handling LPG tanks</li><li>Check for leaks after connecting LPG tanks</li><li>Never store fuel containers on the MEWP platform</li></ul>" },
          { heading: "Daily Maintenance", content: "<p>Check the following at the start of each shift:</p><ul><li>Battery charge level or fuel level is sufficient for the shift</li><li>Hydraulic fluid level is within the acceptable range</li><li>Engine oil level (for IC engines)</li><li>Coolant level (for liquid-cooled engines)</li><li>No fluid leaks of any kind</li></ul>" },
        ],
        takeaways: [
          "Charge batteries only in designated, ventilated areas",
          "Batteries produce explosive hydrogen gas during charging",
          "No smoking or open flames within 50 feet of refueling or charging",
          "Check all fluid levels at the start of each shift",
        ],
        warning: "Hydrogen gas from charging batteries is highly explosive. Always ensure adequate ventilation in charging areas.",
      }),
    },
  },
  {
    module: "Pre-Operation Inspection",
    title: "Knowledge Check: Pre-Operation Inspection",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "How often must lift controls be tested before use according to OSHA?", type: "mcq_single", options: ["Weekly", "Monthly", "Each day prior to use", "Only after repairs"], correctAnswers: "Each day prior to use", explanation: "29 CFR 1926.453(a)(1) requires lift controls to be tested each day prior to use to determine they are in safe working condition." },
      { question: "If you find a damaged guardrail during pre-operation inspection, you should:", type: "mcq_single", options: ["Continue working and report at end of shift", "Tag it out of service and do not operate", "Use it only for low-height tasks", "Fix it yourself with tape"], correctAnswers: "Tag it out of service and do not operate", explanation: "Any defect found during inspection requires the equipment to be tagged out and not operated until repaired." },
      { question: "Batteries being charged produce which explosive gas?", type: "mcq_single", options: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"], correctAnswers: "Hydrogen", explanation: "Electric batteries produce hydrogen gas during charging, which is highly explosive in confined spaces." },
    ],
  },

  // ═══ MODULE 3: Stability & Load Handling ═══
  {
    module: "Stability & Load Handling",
    title: "MEWP Stability Principles",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "MEWP Stability Principles",
        image: img("stability-triangle.svg"),
        sections: [
          { heading: "Tipping Lines", content: "<p>Every MEWP has <strong>tipping lines</strong> — the axis around which the MEWP could tip if the center of gravity shifts too far. For Group A MEWPs (scissor lifts), the tipping lines are typically the wheels or outriggers. For Group B MEWPs (boom lifts), the tipping lines are the outrigger pads or wheel positions.</p>" },
          { heading: "Center of Gravity", content: "<p>The <strong>combined center of gravity</strong> includes the MEWP itself, the platform load (personnel, tools, materials), and the boom/platform position. If the combined center of gravity moves outside the tipping lines, the MEWP will tip over.</p>" },
          { heading: "Factors Affecting Stability", content: "<ul><li><strong>Platform height:</strong> Higher elevation raises the center of gravity</li><li><strong>Load weight:</strong> Exceeding rated capacity shifts the center of gravity</li><li><strong>Boom extension:</strong> Horizontal extension moves the center of gravity outward (Group B)</li><li><strong>Slope/grade:</strong> Operating on a slope shifts the center of gravity downhill</li><li><strong>Wind:</strong> Wind force on the platform and load can destabilize the MEWP</li><li><strong>Surface conditions:</strong> Soft ground, ice, or wet surfaces can cause sinking or sliding</li></ul>" },
          { heading: "Outriggers and Stabilizers", content: "<p>Many MEWPs, especially Group B boom lifts, require <strong>outriggers or stabilizers</strong> to be deployed before elevation. OSHA requires that brakes be set and outriggers positioned on pads or a solid surface. Always:</p><ul><li>Deploy outriggers fully before elevating</li><li>Use outrigger pads on soft surfaces to distribute load</li><li>Ensure the surface can support the outrigger load</li><li>Never operate without outriggers deployed if the manufacturer requires them</li></ul>" },
        ],
        takeaways: [
          "Tipping lines define the boundary of stability — stay within them",
          "Height, load, boom extension, slope, and wind all affect stability",
          "Outriggers must be deployed on pads/solid surface before elevation",
          "The combined center of gravity must stay within the tipping lines",
        ],
        warning: "Tip-overs are a leading cause of MEWP fatalities. Always respect capacity limits, surface conditions, and manufacturer stability requirements.",
      }),
    },
  },
  {
    module: "Stability & Load Handling",
    title: "Rated Capacity and Load Limits",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Rated Capacity and Load Limits",
        image: img("load-center.svg"),
        sections: [
          { heading: "Manufacturer's Capacity Rating", content: "<p>Every MEWP has a manufacturer's <strong>rated capacity</strong> plate that specifies the maximum load the platform can safely carry. This includes the combined weight of all personnel, tools, and materials on the platform. <strong>Never exceed this rating.</strong></p>" },
          { heading: "Boom Lift Capacity Considerations", content: "<p>For Group B boom lifts, capacity may vary based on boom position. Some boom lifts have <strong>variable capacity ratings</strong> that change with boom extension and angle. Always check the capacity plate for the specific boom configuration you are using.</p>" },
          { heading: "Personnel Limits", content: "<p>The capacity plate also specifies the maximum number of occupants allowed on the platform. Never exceed this limit. Each occupant must have adequate space to work safely within the platform guardrails.</p>" },
          { heading: "Load Distribution", content: "<p>Distribute loads evenly within the platform. Concentrating weight on one side can shift the center of gravity and affect stability. Secure all tools and materials to prevent them from shifting or falling during operation.</p>" },
        ],
        takeaways: [
          "Never exceed the manufacturer's rated capacity",
          "Capacity includes the combined weight of personnel, tools, and materials",
          "Boom lift capacity may vary with boom position (variable capacity ratings)",
          "Distribute loads evenly and secure all materials",
        ],
        warning: "Overloading a MEWP is one of the leading causes of tip-over accidents. Always verify the total platform load before elevating.",
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
      { question: "What happens if the combined center of gravity moves outside the tipping lines?", type: "mcq_single", options: ["Nothing — the MEWP is self-correcting", "The MEWP will tip over", "An alarm will sound automatically", "The platform will lower automatically"], correctAnswers: "The MEWP will tip over", explanation: "If the combined center of gravity moves outside the tipping lines, the MEWP will tip over, which is why capacity and stability are critical." },
      { question: "Which factor does NOT affect MEWP stability?", type: "mcq_single", options: ["Platform height", "Load weight", "Wind conditions", "The operator's name"], correctAnswers: "The operator's name", explanation: "Height, load weight, wind, slope, and surface conditions all affect stability. The operator's name is irrelevant to stability." },
      { question: "Rated capacity on a MEWP includes the weight of:", type: "mcq_single", options: ["Only the personnel", "Only the tools", "Personnel, tools, and materials combined", "Only the platform itself"], correctAnswers: "Personnel, tools, and materials combined", explanation: "Rated capacity includes the combined weight of all personnel, tools, and materials on the platform." },
    ],
  },

  // ═══ MODULE 4: Safe Operation & Fall Protection ═══
  {
    module: "Safe Operation & Fall Protection",
    title: "Fall Protection Requirements",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Fall Protection Requirements",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "OSHA Fall Protection Standard", content: "<p>Under <strong>29 CFR 1926.453</strong>, employees shall always stand firmly on the floor of the basket. A <strong>body belt</strong> shall be worn and a <strong>lanyard</strong> attached to the boom or basket. However, since January 1, 1998, body belts are <strong>NOT acceptable</strong> as part of a personal fall arrest system — a <strong>full body harness</strong> must be used.</p>" },
          { heading: "Personal Fall Arrest System", content: "<p>A complete fall protection system consists of:</p><ul><li><strong>Full body harness</strong> — distributes fall forces across the body</li><li><strong>Lanyard</strong> — connects the harness to the anchor point</li><li><strong>Anchor point</strong> — the designated attachment point on the boom or basket (must be manufacturer-approved)</li></ul>" },
          { heading: "Attachment Points", content: "<p>Always attach the lanyard to the <strong>manufacturer-designated anchor point</strong> on the platform or boom. Never attach to:</p><ul><li>Nearby structures or building framing</li><li>Overhead power lines or poles</li><li>Other equipment</li><li>Anything outside the MEWP</li></ul>" },
          { heading: "Harness Inspection", content: "<p>Inspect your harness and lanyard before each use:</p><ul><li>Check for cuts, tears, or abrasions in webbing</li><li>Inspect stitching for damage</li><li>Check hardware (D-rings, buckles, snap hooks) for damage</li><li>Verify the label is legible and within service life</li><li>Tag out and replace any damaged equipment immediately</li></ul>" },
        ],
        takeaways: [
          "Body belts are NOT acceptable since January 1, 1998 — use full body harnesses",
          "Attach lanyard only to manufacturer-designated anchor points",
          "Never attach to structures or equipment outside the MEWP",
          "Inspect harness and lanyard before every use",
        ],
        warning: "Since January 1, 1998, body belts are NOT acceptable as part of a personal fall arrest system. Full body harnesses are required.",
      }),
    },
  },
  {
    module: "Safe Operation & Fall Protection",
    title: "Safe Operating Procedures",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Safe Operating Procedures",
        image: img("safe-driving.svg"),
        sections: [
          { heading: "Before Elevating", content: "<p>Before raising the platform:</p><ul><li>Verify the surface is <strong>level and capable of supporting the load</strong></li><li>Deploy outriggers/stabilizers if required by the manufacturer</li><li>Set wheel chocks if on an incline</li><li>Check for <strong>overhead hazards</strong> (power lines, structures, ceilings)</li><li>Ensure the area is clear of pedestrians and obstructions</li></ul>" },
          { heading: "While Elevated", content: "<p>When the platform is elevated:</p><ul><li><strong>Always wear your harness and attach lanyard</strong></li><li>Keep both feet firmly on the platform floor</li><li>Never stand on guardrails, mid-rails, or ladders</li><li>Never lean over or climb on guardrails</li><li>Do not exceed the rated capacity or personnel limit</li><li>Be aware of surroundings at all times</li></ul>" },
          { heading: "Driving While Elevated", content: "<p>If driving while elevated is permitted by the manufacturer:</p><ul><li>Drive at <strong>very low speed</strong></li><li>Watch for surface hazards and obstacles</li><li>Avoid sudden starts, stops, or turns</li><li>Never drive near drop-offs or open edges</li><li>Stop driving if conditions become unsafe</li></ul><p>Per OSHA 1926.453(b)(2)(vii), an aerial lift truck shall not be moved when boom is elevated with workers in basket <strong>unless the equipment is specifically designed for this</strong>.</p>" },
          { heading: "Lowering the Platform", content: "<p>Before lowering:</p><ul><li>Ensure the area below is clear of personnel and obstacles</li><li>Verify the path is clear of overhead obstructions</li><li>Lower slowly and under control</li><li>Return boom to stowed position before driving to a new location</li></ul>" },
        ],
        takeaways: [
          "Always wear a harness and attach to the designated anchor point",
          "Check for overhead hazards before elevating",
          "Never exceed capacity or personnel limits",
          "Lower slowly and ensure the area is clear before descending",
        ],
        tip: "Before elevating, always look up and around for overhead hazards like power lines, pipes, and structures.",
      }),
    },
  },
  {
    module: "Safe Operation & Fall Protection",
    title: "Knowledge Check: Safe Operation & Fall Protection",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Since January 1, 1998, what type of fall protection is required (not body belts)?", type: "mcq_single", options: ["Body belt only", "Full body harness", "No fall protection needed", "A rope and knot"], correctAnswers: "Full body harness", explanation: "Body belts are not acceptable as part of a personal fall arrest system since January 1, 1998. Full body harnesses are required." },
      { question: "When driving a MEWP while elevated, you should:", type: "mcq_single", options: ["Drive at normal speed", "Drive at very low speed and watch for hazards", "Honk repeatedly while driving", "Never drive while elevated under any circumstances"], correctAnswers: "Drive at very low speed and watch for hazards", explanation: "If driving while elevated is permitted by the manufacturer, drive at very low speed, watch for hazards, and avoid sudden movements." },
      { question: "The lanyard should be attached to:", type: "mcq_single", options: ["Any sturdy-looking object nearby", "The manufacturer-designated anchor point on the MEWP", "A nearby building beam", "The overhead guard"], correctAnswers: "The manufacturer-designated anchor point on the MEWP", explanation: "Always attach the lanyard only to the manufacturer-designated anchor point on the platform or boom." },
    ],
  },

  // ═══ MODULE 5: Workplace Hazards & Electrical Safety ═══
  {
    module: "Workplace Hazards & Electrical Safety",
    title: "Electrical Hazards and Power Lines",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Electrical Hazards and Power Lines",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Power Line Clearance", content: "<p>Working near overhead power lines is one of the most dangerous operations for MEWP operators. OSHA requires minimum clearance distances from power lines:</p><ul><li><strong>Up to 50kV:</strong> Minimum 10 feet clearance</li><li><strong>50kV to 200kV:</strong> Minimum 15 feet clearance</li><li><strong>200kV to 350kV:</strong> Minimum 20 feet clearance</li><li><strong>350kV to 500kV:</strong> Minimum 25 feet clearance</li><li><strong>500kV+:</strong> Minimum 35 feet clearance</li></ul>" },
          { heading: "Power Line Safety Rules", content: "<p>When working near power lines:</p><ul><li>Always treat power lines as <strong>energized and dangerous</strong></li><li>Do not rely on insulation or covers — they may be damaged</li><li>If the boom could swing or drift toward lines, use a <strong>spotter</strong></li><li>Be aware of <strong>wind</strong> — strong gusts can push the platform into lines</li><li>Never approach power lines if the MEWP's boom could reach within the minimum clearance distance</li></ul>" },
          { heading: "If Contact Occurs", content: "<p>If the MEWP contacts a power line:</p><ol><li><strong>Stay in the platform</strong> — do not try to jump off</li><li>Warn others to stay away from the MEWP</li><li>Call emergency services (911) and your utility company</li><li>Try to break contact by moving the boom away from the line</li><li>Do not leave the platform until the power line is de-energized and confirmed safe</li></ol>" },
          { heading: "Ground Personnel Safety", content: "<p>If the MEWP is in contact with a power line, anyone on the ground near the MEWP is at risk of electrocution from <strong>step potential</strong> (electricity spreading through the ground). Ground personnel should stay at least <strong>35 feet away</strong> from the MEWP until the power is confirmed off.</p>" },
        ],
        takeaways: [
          "Minimum 10 feet clearance from power lines up to 50kV",
          "Always treat power lines as energized and dangerous",
          "If contact occurs: stay in the platform, call 911, and do not try to jump off",
          "Ground personnel should stay 35+ feet away if contact occurs",
        ],
        warning: "Power line contact is frequently fatal. Maintain minimum clearance distances at all times and use a spotter when working near energized lines.",
      }),
    },
  },
  {
    module: "Workplace Hazards & Electrical Safety",
    title: "Environmental and Workplace Hazards",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Environmental and Workplace Hazards",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Weather Conditions", content: "<p>Weather significantly affects MEWP safety:</p><ul><li><strong>Wind:</strong> Most MEWPs have a maximum wind speed rating (typically 28 mph). Never exceed the manufacturer's wind speed limit. Wind force increases with platform height.</li><li><strong>Rain and ice:</strong> Make surfaces slippery and reduce traction. Electrical components can be affected.</li><li><strong>Lightning:</strong> Never operate a MEWP during a thunderstorm — the boom can act as a lightning rod.</li><li><strong>Snow and ice:</strong> Add weight to the platform, reduce surface traction, and can obscure hazards.</li></ul>" },
          { heading: "Surface Conditions", content: "<p>Before operating, verify the ground surface can support the MEWP's weight including load:</p><ul><li>Check for <strong>soft ground, mud, or unstable fill</strong></li><li>Verify floor or slab capacity for indoor use</li><li>Look for <strong>covered holes, trenches, or voids</strong></li><li>Check for <strong>slopes and grades</strong> within manufacturer limits</li><li>Watch for wet, oily, or icy surfaces</li></ul>" },
          { heading: "Overhead Hazards", content: "<p>Always check for overhead hazards before and during elevation:</p><ul><li><strong>Power lines</strong> (see previous lesson for clearance distances)</li><li><strong>Building structures</strong>: ceilings, beams, pipes, ductwork</li><li><strong>Overhead doors</strong> and crane ways</li><li><strong>Tree branches</strong> and outdoor structures</li><li><strong>Falling objects</strong> from above</li></ul>" },
          { heading: "Pedestrian Traffic", content: "<p>Protect pedestrians and other workers near MEWP operations:</p><ul><li>Use <strong>barricades or caution tape</strong> to establish a work zone</li><li>Post <strong>warning signs</strong> at approach points</li><li>Use a <strong>ground spotter</strong> in high-traffic areas</li><li>Sound the <strong>horn</strong> when lowering or moving</li><li>Never assume pedestrians can see or hear the MEWP</li></ul>" },
        ],
        takeaways: [
          "Never exceed the manufacturer's maximum wind speed rating",
          "Never operate a MEWP during lightning storms",
          "Check surface conditions for soft ground, slopes, and voids",
          "Use barricades and spotters to protect pedestrians",
        ],
        warning: "Lightning + MEWP = extreme danger. The boom acts as a lightning rod. Never operate during thunderstorms.",
      }),
    },
  },
  {
    module: "Workplace Hazards & Electrical Safety",
    title: "Knowledge Check: Workplace Hazards",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "What is the minimum clearance distance from power lines up to 50kV?", type: "mcq_single", options: ["5 feet", "10 feet", "15 feet", "25 feet"], correctAnswers: "10 feet", explanation: "OSHA requires a minimum clearance of 10 feet from power lines rated up to 50kV. Higher voltage lines require greater distances." },
      { question: "If a MEWP contacts a power line, the operator should:", type: "mcq_single", options: ["Jump off immediately", "Stay in the platform and call 911", "Try to push the line away by hand", "Climb down the boom"], correctAnswers: "Stay in the platform and call 911", explanation: "Stay in the platform — jumping off can cause electrocution. Call emergency services and try to break contact using the controls." },
      { question: "You should never operate a MEWP during which weather condition?", type: "mcq_single", options: ["Light drizzle", "Thunderstorm/lightning", "Cloudy skies", "Cool temperatures"], correctAnswers: "Thunderstorm/lightning", explanation: "Never operate a MEWP during a thunderstorm — the boom can act as a lightning rod, creating an extreme electrocution risk." },
    ],
  },

  // ═══ MODULE 6: Emergency Procedures & Rescue ═══
  {
    module: "Emergency Procedures & Rescue",
    title: "Emergency Controls and Lowering",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Emergency Controls and Lowering",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Emergency Lowering System", content: "<p>All MEWPs are equipped with <strong>emergency lowering</strong> systems that allow the platform to be lowered from the ground if the operator is incapacitated or if the upper controls fail. These may be manual valves, electric switches, or hydraulic pumps. Know where these controls are located before operating.</p>" },
          { heading: "Lower Control Override", content: "<p>Per OSHA 1926.453(b)(2)(iii), upper and lower controls are required. The lower controls must be able to <strong>override the upper controls</strong>. This allows a ground person to safely lower the platform in an emergency. However, lower controls should only be used for normal operation when no operator is in the platform.</p>" },
          { heading: "Emergency Stop", content: "<p>All MEWPs have <strong>emergency stop buttons</strong> at both upper and lower control stations. Pressing the E-stop immediately halts all functions. To resume operation, the E-stop must be manually reset by pulling it out or turning it.</p>" },
          { heading: "Power Failure", content: "<p>If power is lost while the platform is elevated:</p><ul><li>Do not panic — the platform will remain in position</li><li>Use the <strong>manual lowering valve</strong> to descend slowly</li><li>If on a boom lift, use the manual boom retraction system</li><li>Call for assistance if you cannot lower the platform safely</li></ul>" },
        ],
        takeaways: [
          "Know the location of emergency lowering controls before operating",
          "Lower controls can override upper controls in emergencies",
          "E-stop buttons are at both upper and lower control stations",
          "If power fails, use manual lowering systems to descend safely",
        ],
        tip: "Before operating any MEWP, locate and test all emergency controls including the lowering valve and E-stop buttons.",
      }),
    },
  },
  {
    module: "Emergency Procedures & Rescue",
    title: "Rescue Planning and Procedures",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Rescue Planning and Procedures",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "ANSI A92.22 Rescue Requirements", content: "<p>ANSI A92.22 requires that a <strong>rescue plan</strong> be developed before MEWP use begins. The plan must address how an operator will be retrieved from the platform if they are unable to operate the controls. The plan must be communicated to all relevant personnel.</p>" },
          { heading: "Rescue Plan Components", content: "<p>A complete rescue plan includes:</p><ul><li>Identification of <strong>trained rescue personnel</strong> on site</li><li>Location and operation of <strong>lower controls</strong> and emergency lowering</li><li>Access to a <strong>secondary MEWP</strong> or ladder for rescue if needed</li><li>Emergency contact numbers (911, site supervisor)</li><li>Procedure for <strong>power line contact</strong> emergencies</li><li>Procedure for <strong>tip-over</strong> emergencies</li></ul>" },
          { heading: "If an Operator is Incapacitated", content: "<p>If the operator in the platform becomes incapacitated:</p><ol><li>Use the <strong>lower controls</strong> to lower the platform</li><li>If lower controls fail, use the <strong>emergency lowering valve</strong></li><li>If the platform cannot be lowered, use a <strong>secondary MEWP</strong> to reach the operator</li><li>Call <strong>911</strong> for medical emergencies</li><li>Never attempt to climb the boom or scissor mechanism</li></ol>" },
          { heading: "Tip-Over Response", content: "<p>If a tip-over occurs:</p><ul><li><strong>Stay in the platform</strong> — do not jump</li><li>Brace yourself and hold onto the guardrails</li><li>Signal for help</li><li>Do not attempt to operate the controls until help arrives</li><li>Seek medical evaluation after any tip-over incident</li></ul>" },
        ],
        takeaways: [
          "ANSI A92.22 requires a rescue plan before MEWP use",
          "Identify trained rescue personnel before starting work",
          "Use lower controls or emergency lowering to rescue an incapacitated operator",
          "In a tip-over, stay in the platform and do not jump",
        ],
        warning: "Never attempt to climb the boom or scissor mechanism to rescue someone. Use lower controls or a secondary MEWP.",
      }),
    },
  },
  {
    module: "Emergency Procedures & Rescue",
    title: "Knowledge Check: Emergency Procedures",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "What does ANSI A92.22 require before MEWP use begins?", type: "mcq_single", options: ["A rescue plan", "A weather report", "A second operator", "A backup battery"], correctAnswers: "A rescue plan", explanation: "ANSI A92.22 requires a rescue plan to be developed before MEWP use begins, addressing how an operator will be retrieved if incapacitated." },
      { question: "If a tip-over occurs, the operator should:", type: "mcq_single", options: ["Jump off immediately", "Stay in the platform and hold on", "Try to right the MEWP", "Climb down the boom"], correctAnswers: "Stay in the platform and hold on", explanation: "Stay in the platform during a tip-over — do not jump. Brace yourself, hold the guardrails, and signal for help." },
      { question: "The emergency stop (E-stop) button is located at:", type: "mcq_single", options: ["Only at the upper controls", "Only at the lower controls", "Both upper and lower control stations", "Only on the chassis"], correctAnswers: "Both upper and lower control stations", explanation: "E-stop buttons are at both upper (platform) and lower (ground) control stations for emergency shutdown." },
    ],
  },

  // ═══ MODULE 7: Final Exam & Completion ═══
  {
    module: "Final Exam & Completion",
    title: "Final Exam: Aerial & Scissor Lift Certification",
    type: "exam",
    estimatedMinutes: 15,
    config: {
      passing_score: 80,
      max_attempts: 3,
      randomize_questions: true,
    },
    questions: [
      { question: "Which OSHA standard specifically covers aerial lifts?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 is the OSHA standard for aerial lifts." },
      { question: "A scissor lift is classified as which MEWP group?", type: "mcq_single", options: ["Group A", "Group B", "Group C", "Group D"], correctAnswers: "Group A", explanation: "Scissor lifts are Group A MEWPs — the platform can only be elevated vertically and stays within the tipping lines." },
      { question: "How often must lift controls be tested before use?", type: "mcq_single", options: ["Weekly", "Monthly", "Each day prior to use", "Only after repairs"], correctAnswers: "Each day prior to use", explanation: "29 CFR 1926.453(a)(1) requires lift controls to be tested each day prior to use." },
      { question: "Since January 1, 1998, what type of fall protection is required?", type: "mcq_single", options: ["Body belt only", "Full body harness", "No fall protection needed", "A safety net"], correctAnswers: "Full body harness", explanation: "Body belts are not acceptable since January 1, 1998. Full body harnesses are required as part of a personal fall arrest system." },
      { question: "What is the minimum clearance from power lines up to 50kV?", type: "mcq_single", options: ["5 feet", "10 feet", "15 feet", "25 feet"], correctAnswers: "10 feet", explanation: "OSHA requires a minimum clearance of 10 feet from power lines rated up to 50kV." },
      { question: "If a MEWP contacts a power line, the operator should:", type: "mcq_single", options: ["Jump off immediately", "Stay in the platform and call 911", "Push the line away", "Climb down the boom"], correctAnswers: "Stay in the platform and call 911", explanation: "Stay in the platform — jumping off can cause electrocution. Call emergency services and try to break contact using the controls." },
      { question: "What should you do if a defect is found during pre-operation inspection?", type: "mcq_single", options: ["Continue working and report later", "Tag it out of service and do not operate", "Use it for short tasks only", "Fix it with tape"], correctAnswers: "Tag it out of service and do not operate", explanation: "Any defect found during inspection requires the equipment to be tagged out and not operated until repaired." },
      { question: "The lanyard should be attached to:", type: "mcq_single", options: ["Any nearby sturdy object", "The manufacturer-designated anchor point", "A building beam", "The overhead guard"], correctAnswers: "The manufacturer-designated anchor point", explanation: "Always attach the lanyard only to the manufacturer-designated anchor point on the platform or boom." },
      { question: "Never operate a MEWP during which weather condition?", type: "mcq_single", options: ["Light drizzle", "Thunderstorm/lightning", "Cloudy skies", "Cool weather"], correctAnswers: "Thunderstorm/lightning", explanation: "Never operate a MEWP during a thunderstorm — the boom acts as a lightning rod." },
      { question: "If a tip-over occurs, the operator should:", type: "mcq_single", options: ["Jump off immediately", "Stay in the platform and hold on", "Try to right the MEWP", "Turn off the engine"], correctAnswers: "Stay in the platform and hold on", explanation: "Stay in the platform during a tip-over. Do not jump. Brace yourself and signal for help." },
      { question: "What does ANSI A92.22 require before MEWP use begins?", type: "mcq_single", options: ["A rescue plan", "A weather report", "A second operator", "A video recording"], correctAnswers: "A rescue plan", explanation: "ANSI A92.22 requires a rescue plan to be developed before MEWP use begins." },
      { question: "The lower controls on a MEWP must be able to:", type: "mcq_single", options: ["Only drive the MEWP", "Override the upper controls in an emergency", "Be locked permanently", "Only be used for refueling"], correctAnswers: "Override the upper controls in an emergency", explanation: "Lower controls must be able to override upper controls in an emergency, per OSHA 1926.453." },
      { question: "Batteries being charged produce which explosive gas?", type: "mcq_single", options: ["Oxygen", "Nitrogen", "Hydrogen", "Carbon dioxide"], correctAnswers: "Hydrogen", explanation: "Electric batteries produce hydrogen gas during charging, which is highly explosive." },
      { question: "What happens if the center of gravity moves outside the tipping lines?", type: "mcq_single", options: ["Nothing", "The MEWP will tip over", "An alarm sounds", "The platform lowers automatically"], correctAnswers: "The MEWP will tip over", explanation: "If the combined center of gravity moves outside the tipping lines, the MEWP will tip over." },
      { question: "Rated capacity on a MEWP includes the weight of:", type: "mcq_single", options: ["Only personnel", "Only tools", "Personnel, tools, and materials combined", "Only the platform"], correctAnswers: "Personnel, tools, and materials combined", explanation: "Rated capacity includes the combined weight of all personnel, tools, and materials on the platform." },
      { question: "An aerial lift truck shall not be moved when the boom is elevated with workers in the basket unless:", type: "mcq_single", options: ["The supervisor approves", "The equipment is specifically designed for this", "It is an emergency", "The workers are wearing harnesses"], correctAnswers: "The equipment is specifically designed for this", explanation: "Per OSHA 1926.453(b)(2)(vii), the truck shall not be moved when boom is elevated with workers in basket unless specifically designed for this purpose." },
      { question: "No smoking or open flames within how many feet of charging batteries?", type: "mcq_single", options: ["10 feet", "25 feet", "50 feet", "100 feet"], correctAnswers: "50 feet", explanation: "No smoking or open flames within 50 feet of battery charging areas due to explosive hydrogen gas risk." },
      { question: "This online course alone fully satisfies all OSHA aerial lift training requirements.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "OSHA requires formal instruction (this course) PLUS practical training and evaluation on the specific equipment by the employer." },
      { question: "Ground personnel should stay how far from a MEWP in contact with a power line?", type: "mcq_single", options: ["10 feet", "25 feet", "35 feet", "50 feet"], correctAnswers: "35 feet", explanation: "Ground personnel should stay at least 35 feet away due to step potential — electricity spreading through the ground." },
      { question: "Employees shall always stand firmly on the ___ of the basket.", type: "mcq_single", options: ["Edge", "Floor", "Guardrail", "Mid-rail"], correctAnswers: "Floor", explanation: "OSHA 1926.453 requires employees to always stand firmly on the floor of the basket. Never on guardrails or other surfaces." },
      { question: "What must be deployed before elevating a boom lift that requires them?", type: "mcq_single", options: ["Outriggers/stabilizers", "Extension cords", "Safety nets", "Rope ladders"], correctAnswers: "Outriggers/stabilizers", explanation: "Outriggers or stabilizers must be fully deployed on pads or solid surface before elevating, per OSHA requirements." },
      { question: "Never operate a MEWP exceeding the manufacturer's maximum:", type: "mcq_single", options: ["Color rating", "Wind speed rating", "Decibel rating", "Tire pressure"], correctAnswers: "Wind speed rating", explanation: "Most MEWPs have a maximum wind speed rating (typically 28 mph). Never exceed this limit." },
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
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Your Certificate", content: "<p>Congratulations on completing the formal instruction portion of your aerial and scissor lift operator certification! Your digital certificate is now available for download. It includes a unique certificate number and QR code that employers can use for instant verification.</p>" },
          { heading: "Next Step: Practical Evaluation", content: "<p>Remember, your employer must still complete the <strong>hands-on practical training and evaluation</strong> on the specific equipment you will operate. Share the employer documentation packet with your supervisor, including:</p><ul><li>Performance Evaluation Checklist for aerial/scissor lifts</li><li>Operator Permit / Authorization Form</li><li>Equipment-specific familiarization requirements</li></ul>" },
          { heading: "Stay Safe", content: "<p>Your training doesn't end here. Continue to follow safe operating procedures every day. If you ever have questions or need a refresher, you can revisit this course at any time. Stay safe out there!</p>" },
        ],
        takeaways: [
          "Download your certificate from your certification page",
          "Share the employer packet with your supervisor for practical evaluation",
          "Your employer must provide equipment-specific hands-on training",
          "Re-evaluation is required at least every 3 years",
        ],
        tip: "Bookmark your verification page link — employers can use it to instantly verify your certification.",
      }),
    },
  },
];
