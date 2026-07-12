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
  title: "Aerial & Scissor Lift Train the Trainer Certification",
  slug: "online-aerial-train-the-trainer",
  description: "Comprehensive OSHA-compliant Train the Trainer certification for aerial lift and scissor lift operator training. Combines TTT methodology with aerial lift-specific content covering OSHA 29 CFR 1926.453, 1910.178(l)(2)(iii), and ANSI/SAIA A92 standards. Upon completion, you will be qualified to train and evaluate aerial lift and scissor lift operators at your facility.",
  category: "trainer",
  price: "150.00",
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
  // ═══ MODULE 0: OSHA Regulatory Framework for Aerial Lifts ═══
  {
    module: "OSHA Regulatory Framework for Aerial Lifts",
    title: "Welcome & Aerial Lift Regulatory Framework",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Welcome & Aerial Lift Regulatory Framework",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "About This Course", content: "<p>Welcome to the Aerial & Scissor Lift Train the Trainer Certification! This course prepares you to become a <strong>qualified aerial lift and scissor lift operator trainer</strong>. It combines adult learning principles and training methodology with aerial lift-specific regulatory content.</p>" },
          { heading: "Trainer Qualifications", content: "<p>Under <strong>29 CFR 1910.178(l)(2)(iii)</strong>, all operator training and evaluation shall be conducted by persons who have the <strong>knowledge, training, and experience</strong> to train operators and evaluate their competence. This applies to aerial lift trainers as well.</p>" },
          { heading: "Regulatory Framework", content: "<p>Aerial lift training is governed by multiple standards:</p><ul><li><strong>29 CFR 1926.453</strong> — OSHA Aerial Lift standard</li><li><strong>29 CFR 1910.178(l)</strong> — PIT operator training (applied to scissor lifts)</li><li><strong>ANSI/SAIA A92.20</strong> — MEWP Design, Safety, and Verification</li><li><strong>ANSI/SAIA A92.22</strong> — Safe Use of MEWPs (includes rescue planning)</li><li><strong>ANSI/SAIA A92.24</strong> — Training Requirements for MEWP operators</li></ul>" },
          { heading: "Important Note", content: "<p>This course qualifies you to <strong>train and evaluate aerial lift operators</strong>. It does <strong>not</strong> certify you to operate equipment. You must already be a competent aerial lift operator.</p>" },
        ],
        takeaways: [
          "Trainer qualifications: knowledge, training, and experience (1910.178(l)(2)(iii))",
          "Aerial lifts are regulated under 1926.453, 1910.178, and ANSI A92 series",
          "ANSI A92.24 specifically covers MEWP training requirements",
          "This course qualifies trainers — not operators",
        ],
        warning: "This course does not certify you to operate aerial lifts. You must already be a competent operator.",
      }),
    },
  },
  {
    module: "OSHA Regulatory Framework for Aerial Lifts",
    title: "ANSI A92.24 Training Requirements",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "ANSI A92.24 Training Requirements",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Who Must Be Trained?", content: "<p>ANSI A92.24 requires training for:</p><ul><li><strong>Operators</strong> — anyone who controls a MEWP</li><li><strong>Occupants</strong> — anyone in the platform who is not the operator</li><li><strong>Supervisors</strong> — anyone who directly supervises MEWP operators</li><li><strong>Service personnel</strong> — those who maintain MEWPs</li></ul>" },
          { heading: "Training Content Requirements", content: "<p>ANSI A92.24 training must cover:</p><ul><li>Purpose and use of the operator's manual</li><li>Proper inspection of the MEWP</li><li>Recognition and avoidance of common hazards</li><li>Proper use of personal fall protection</li><li>Proper selection and use of MEWPs</li><li>Manufacturer's operating requirements</li><li>Proper use of MEWP controls (upper and lower)</li><li>Proper movement of the MEWP</li><li>Proper shutdown and securing</li></ul>" },
          { heading: "Familiarization Requirement", content: "<p>Before operating a specific MEWP, operators must be <strong>familiarized</strong> with:</p><ul><li>The specific controls and instruments</li><li>Differences from previously operated MEWPs</li><li>Any special features or devices</li><li>The manufacturer's operating manual</li></ul><p>Familiarization is separate from formal training and is specific to each make/model.</p>" },
          { heading: "Retraining Requirements", content: "<p>ANSI A92.24 requires retraining when:</p><ul><li>An operator is observed operating unsafely</li><li>After an accident or near-miss</li><li>An evaluation reveals unsafe operation</li><li>Assigned to a different type of MEWP</li><li>Workplace conditions change</li></ul>" },
        ],
        takeaways: [
          "ANSI A92.24 requires training for operators, occupants, supervisors, and service personnel",
          "Training must cover inspection, hazards, fall protection, controls, and movement",
          "Familiarization with each specific make/model is required before operation",
          "Retraining is required after unsafe operation, accidents, or new equipment",
        ],
        tip: "Keep a familiarization log for each operator and each MEWP make/model they are authorized to operate.",
      }),
    },
  },
  {
    module: "OSHA Regulatory Framework for Aerial Lifts",
    title: "Knowledge Check: Regulatory Framework",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Which ANSI standard specifically covers training requirements for MEWP operators?", type: "mcq_single", options: ["A92.20", "A92.22", "A92.24", "A92.26"], correctAnswers: "A92.24", explanation: "ANSI A92.24 covers training requirements for MEWP operators, occupants, supervisors, and service personnel." },
      { question: "What must operators complete before operating a specific MEWP make/model?", type: "mcq_single", options: ["A medical exam", "Familiarization with the specific equipment", "A college course", "Nothing if already trained"], correctAnswers: "Familiarization with the specific equipment", explanation: "ANSI A92.24 requires familiarization with each specific make/model before independent operation." },
      { question: "ANSI A92.24 requires training for which groups?", type: "mcq_single", options: ["Only operators", "Only supervisors", "Operators, occupants, supervisors, and service personnel", "Only new hires"], correctAnswers: "Operators, occupants, supervisors, and service personnel", explanation: "ANSI A92.24 requires training for operators, occupants, supervisors, and service personnel." },
    ],
  },

  // ═══ MODULE 1: Adult Learning & Training Design ═══
  {
    module: "Adult Learning & Training Design",
    title: "Adult Learning Principles for Aerial Lift Training",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Adult Learning Principles for Aerial Lift Training",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Key Principles", content: "<p>Adults learn best when training is <strong>relevant</strong>, <strong>experience-based</strong>, and <strong>problem-centered</strong>. Use real workplace scenarios from your aerial lift operations.</p>" },
          { heading: "Learning Styles", content: "<p>Include <strong>visual</strong> (diagrams of stability, fall protection), <strong>auditory</strong> (explanations, discussions), and <strong>kinesthetic</strong> (hands-on equipment practice) elements.</p>" },
          { heading: "Structuring Aerial Lift Training", content: "<ol><li><strong>Formal instruction</strong> — OSHA/ANSI requirements, equipment types, stability, fall protection</li><li><strong>Practical training</strong> — pre-op inspection, controls, elevation, driving, emergency procedures</li><li><strong>Evaluation</strong> — knowledge test and practical skills assessment</li><li><strong>Familiarization</strong> — equipment-specific orientation</li></ol>" },
          { heading: "Training Materials", content: "<p>Prepare: manufacturer's operating manuals, ANSI A92 standards, pre-op inspection checklists, fall protection equipment, evaluation forms, rescue plan templates.</p>" },
        ],
        takeaways: [
          "Make training relevant with real workplace scenarios",
          "Include visual, auditory, and kinesthetic elements",
          "Structure: formal instruction, practical, evaluation, familiarization",
          "Prepare manufacturer manuals and ANSI standards as materials",
        ],
      }),
    },
  },
  {
    module: "Adult Learning & Training Design",
    title: "Knowledge Check: Adult Learning",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Adults learn best when training is:", type: "mcq_single", options: ["Purely theoretical", "Relevant and experience-based", "Memorization-based", "In long lectures"], correctAnswers: "Relevant and experience-based", explanation: "Adults learn best when content is directly relevant and builds on their experience." },
      { question: "The recommended training structure includes:", type: "mcq_single", options: ["Only classroom training", "Formal instruction, practical, evaluation, familiarization", "Only hands-on practice", "Only a written test"], correctAnswers: "Formal instruction, practical, evaluation, familiarization", explanation: "Complete training includes all four phases." },
    ],
  },

  // ═══ MODULE 2: Aerial Lift Required Topics Deep Dive ═══
  {
    module: "Aerial Lift Required Topics Deep Dive",
    title: "Equipment-Related Training Topics",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Equipment-Related Training Topics",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Equipment Knowledge", content: "<p>As a trainer, you must cover all equipment-related topics:</p><ul><li>Types of MEWPs and their classifications (Group A/B, Types 1-3)</li><li>Scissor lift operation, controls, and instrumentation</li><li>Boom lift operation (articulating and telescopic)</li><li>Engine or motor operation (electric vs. IC)</li><li>Steering, driving, and positioning</li><li>Platform elevation and descent</li><li>Platform capacity and load limits</li><li>Stability factors and tip-over hazards</li><li>Fall protection requirements (harness, lanyard, anchor points)</li><li>Pre-operation inspection requirements</li><li>Daily functional testing of controls</li><li>Emergency controls and lower control override</li><li>Outrigger and stabilizer use</li></ul>" },
          { heading: "Teaching Tips", content: "<ul><li>Use the <strong>actual MEWP</strong> for teaching controls</li><li>Demonstrate the <strong>capacity plate</strong> and load calculations</li><li>Show <strong>fall protection</strong> equipment and proper attachment</li><li>Walk through a complete <strong>pre-op inspection</strong></li><li>Demonstrate <strong>emergency lowering</strong> from lower controls</li></ul>" },
        ],
        takeaways: [
          "Cover all equipment types: scissor lifts, boom lifts, vertical lifts",
          "Include fall protection, stability, capacity, and emergency controls",
          "Use the actual MEWP for teaching controls and inspection",
          "Demonstrate emergency lowering procedures",
        ],
      }),
    },
  },
  {
    module: "Aerial Lift Required Topics Deep Dive",
    title: "Workplace-Related Training Topics",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Workplace-Related Training Topics",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Site-Specific Topics", content: "<p>Customize these to your facility:</p><ul><li><strong>Surface conditions</strong> and ground bearing capacity</li><li><strong>Pedestrian traffic</strong> and barricading</li><li><strong>Overhead hazards</strong> (power lines, structures, ceilings)</li><li><strong>Weather conditions</strong> (wind, rain, ice, lightning)</li><li><strong>Working near electrical hazards</strong></li><li><strong>Fall protection</strong> in elevated work</li><li><strong>Falling object protection</strong> (toe boards, screens)</li><li><strong>Hazardous atmospheres</strong> and confined spaces</li><li><strong>Traffic control</strong> and work zone setup</li><li><strong>Emergency rescue procedures</strong></li></ul>" },
          { heading: "Power Line Safety Training", content: "<p>Teach operators the minimum clearance distances:</p><ul><li>Up to 50kV: 10 feet</li><li>50kV-200kV: 15 feet</li><li>200kV-350kV: 20 feet</li><li>350kV-500kV: 25 feet</li></ul><p>Include procedures for power line contact emergencies.</p>" },
          { heading: "Rescue Planning", content: "<p>ANSI A92.22 requires a <strong>rescue plan</strong> before MEWP use. Teach operators:</p><ul><li>How to use lower controls for rescue</li><li>Location of emergency lowering systems</li><li>When to call 911</li><li>Never climb the boom or scissors</li></ul>" },
        ],
        takeaways: [
          "Customize workplace topics to your facility's specific hazards",
          "Teach power line clearance distances and emergency procedures",
          "ANSI A92.22 requires a rescue plan before MEWP use",
          "Cover weather, surface, overhead, and electrical hazards",
        ],
      }),
    },
  },
  {
    module: "Aerial Lift Required Topics Deep Dive",
    title: "Knowledge Check: Required Topics",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "What is the minimum clearance from power lines up to 50kV?", type: "mcq_single", options: ["5 feet", "10 feet", "15 feet", "25 feet"], correctAnswers: "10 feet", explanation: "OSHA requires minimum 10 feet clearance from power lines up to 50kV." },
      { question: "What does ANSI A92.22 require before MEWP use begins?", type: "mcq_single", options: ["A weather report", "A rescue plan", "A second operator", "A video recording"], correctAnswers: "A rescue plan", explanation: "ANSI A92.22 requires a rescue plan to be developed before MEWP use begins." },
      { question: "Workplace-related topics should be:", type: "mcq_single", options: ["Generic", "Customized to your facility", "Skipped for experienced operators", "Memorized from the standard"], correctAnswers: "Customized to your facility", explanation: "Workplace topics are site-specific and must be tailored to your facility." },
    ],
  },

  // ═══ MODULE 3: Practical Training & Evaluation ═══
  {
    module: "Practical Training & Evaluation",
    title: "Practical Training Methodology for Aerial Lifts",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Practical Training Methodology for Aerial Lifts",
        image: img("scissor-lift-hero.svg"),
        sections: [
          { heading: "Skills to Practice", content: "<ul><li><strong>Pre-operation inspection</strong> — visual and functional</li><li><strong>Controls operation</strong> — upper and lower</li><li><strong>Platform elevation/descent</strong></li><li><strong>Driving and positioning</strong></li><li><strong>Fall protection</strong> — harness, lanyard, anchor point</li><li><strong>Outrigger deployment</strong> (if applicable)</li><li><strong>Emergency lowering</strong></li><li><strong>Shutdown and securing</strong></li></ul>" },
          { heading: "Demonstration-Practice-Evaluate Cycle", content: "<ol><li><strong>Demonstrate</strong> each skill</li><li><strong>Guided practice</strong> with coaching</li><li><strong>Independent practice</strong></li><li><strong>Evaluate</strong> against checklist</li></ol>" },
          { heading: "Safety During Training", content: "<p>As the trainer, maintain safety: keep area clear, stop unsafe behavior, maintain escape route, have emergency procedures ready.</p>" },
        ],
        takeaways: [
          "Practice: inspection, controls, elevation, driving, fall protection, emergencies",
          "Use demonstrate-practice-evaluate cycle",
          "Maintain safety as the trainer's responsibility",
        ],
      }),
    },
  },
  {
    module: "Practical Training & Evaluation",
    title: "Operator Evaluation for Aerial Lifts",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Operator Evaluation for Aerial Lifts",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Evaluation Checklist", content: "<p>Create a checklist covering:</p><ul><li>Pre-op inspection completed correctly</li><li>Fall protection properly worn and attached</li><li>Controls operated smoothly</li><li>Platform elevated/descended safely</li><li>Outriggers deployed correctly (if required)</li><li>Surface conditions assessed</li><li>Overhead hazards checked</li><li>Emergency controls demonstrated</li><li>Safe shutdown procedure</li></ul>" },
          { heading: "Pass/Fail Criteria", content: "<p><strong>Critical failures</strong> (automatic fail): not wearing harness, operating near power lines without clearance, exceeding capacity, not deploying outriggers when required.</p>" },
          { heading: "Documentation", content: "<p>Certify with: operator name, training date, evaluation date, trainer identity, equipment type trained on. Maintain for OSHA inspection.</p>" },
        ],
        takeaways: [
          "Create an evaluation checklist for aerial lift skills",
          "Critical failures include no harness, power line violations, capacity exceedance",
          "Document with operator name, dates, trainer identity, equipment type",
        ],
        tip: "Keep equipment-specific familiarization logs separate from general training records.",
      }),
    },
  },
  {
    module: "Practical Training & Evaluation",
    title: "Knowledge Check: Practical Training & Evaluation",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Which is a critical failure during evaluation?", type: "mcq_single", options: ["Slow driving", "Not wearing harness", "Forgetting to honk", "Parking slightly off"], correctAnswers: "Not wearing harness", explanation: "Not wearing fall protection is a critical safety failure requiring automatic evaluation failure." },
      { question: "During evaluation, the trainer should:", type: "mcq_single", options: ["Coach through each step", "Observe without coaching", "Take over if struggling", "Skip known items"], correctAnswers: "Observe without coaching", explanation: "Evaluation is separate from training — observe without coaching." },
    ],
  },

  // ═══ MODULE 4: Program Administration & Safety Culture ═══
  {
    module: "Program Administration & Safety Culture",
    title: "Administering Your Aerial Lift Training Program",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Administering Your Aerial Lift Training Program",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Records Management", content: "<p>Maintain: training records, evaluation checklists, familiarization logs (per make/model), rescue plans, incident reports, refresher training.</p>" },
          { heading: "Refresher Training Triggers", content: "<p>Required when: unsafe operation observed, accident/near-miss, failed evaluation, new MEWP type, workplace changes, or at least every 3 years.</p>" },
          { heading: "Safety Culture", content: "<p>As a trainer, you are a <strong>safety leader</strong>. Lead by example, promote 'stop work' authority, reward hazard reporting, advocate for management commitment.</p>" },
        ],
        takeaways: [
          "Maintain training, evaluation, and familiarization records",
          "Refresher training triggered by unsafe operation, accidents, new equipment",
          "The trainer is a safety leader — lead by example",
        ],
      }),
    },
  },
  {
    module: "Program Administration & Safety Culture",
    title: "Knowledge Check: Administration & Culture",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Familiarization logs should be kept for:", type: "mcq_single", options: ["Each operator", "Each MEWP make/model", "Each facility", "Each year"], correctAnswers: "Each MEWP make/model", explanation: "Track which operators are familiarized with each specific make/model of MEWP." },
      { question: "As a trainer, your role is to:", type: "mcq_single", options: ["Just teach material", "Be a safety leader and lead by example", "Enforce rules only", "Keep records only"], correctAnswers: "Be a safety leader and lead by example", explanation: "The trainer is a safety leader who sets the tone." },
    ],
  },

  // ═══ MODULE 5: Final Exam & Completion ═══
  {
    module: "Final Exam & Completion",
    title: "Final Exam: Aerial & Scissor Lift Train the Trainer",
    type: "exam",
    estimatedMinutes: 15,
    config: { passing_score: 80, max_attempts: 3, randomize_questions: true },
    questions: [
      { question: "Which OSHA standard covers aerial lifts?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 is the OSHA standard for aerial lifts." },
      { question: "Which ANSI standard covers MEWP training requirements?", type: "mcq_single", options: ["A92.20", "A92.22", "A92.24", "A92.26"], correctAnswers: "A92.24", explanation: "ANSI A92.24 covers training requirements for MEWP operators, occupants, supervisors, and service personnel." },
      { question: "What three qualifications must a trainer possess?", type: "mcq_single", options: ["Degree, certificate, license", "Knowledge, training, and experience", "Age, education, fitness", "Seniority, approval, tenure"], correctAnswers: "Knowledge, training, and experience", explanation: "OSHA requires knowledge, training, and experience." },
      { question: "What must operators complete before operating a specific MEWP?", type: "mcq_single", options: ["A medical exam", "Familiarization with the specific equipment", "A college course", "Nothing"], correctAnswers: "Familiarization with the specific equipment", explanation: "Familiarization with each make/model is required before operation." },
      { question: "What is the minimum clearance from power lines up to 50kV?", type: "mcq_single", options: ["5 feet", "10 feet", "15 feet", "25 feet"], correctAnswers: "10 feet", explanation: "Minimum 10 feet clearance from power lines up to 50kV." },
      { question: "What does ANSI A92.22 require before MEWP use?", type: "mcq_single", options: ["A weather report", "A rescue plan", "A second operator", "A video recording"], correctAnswers: "A rescue plan", explanation: "ANSI A92.22 requires a rescue plan before MEWP use." },
      { question: "Since 1998, what type of fall protection is required?", type: "mcq_single", options: ["Body belt", "Full body harness", "No protection", "Safety net"], correctAnswers: "Full body harness", explanation: "Body belts are not acceptable since 1998. Full body harnesses are required." },
      { question: "A scissor lift is classified as which MEWP group?", type: "mcq_single", options: ["Group A", "Group B", "Group C", "Group D"], correctAnswers: "Group A", explanation: "Scissor lifts are Group A MEWPs." },
      { question: "During evaluation, the trainer should:", type: "mcq_single", options: ["Coach through each step", "Observe without coaching", "Take over if struggling", "Skip known items"], correctAnswers: "Observe without coaching", explanation: "Evaluation is separate from training." },
      { question: "This course certifies you to:", type: "mcq_single", options: ["Operate any aerial lift", "Train and evaluate aerial lift operators", "Inspect aerial lifts for OSHA", "Sell training materials"], correctAnswers: "Train and evaluate aerial lift operators", explanation: "This qualifies you to train and evaluate operators — not to operate equipment." },
      { question: "Refresher training is required when:", type: "mcq_single", options: ["Only every 3 years", "Unsafe operation is observed", "Only when OSHA visits", "Only for new hires"], correctAnswers: "Unsafe operation is observed", explanation: "Refresher training is triggered by unsafe operation, accidents, new equipment, etc." },
      { question: "ANSI A92.24 requires training for:", type: "mcq_single", options: ["Only operators", "Only supervisors", "Operators, occupants, supervisors, and service personnel", "Only new hires"], correctAnswers: "Operators, occupants, supervisors, and service personnel", explanation: "ANSI A92.24 requires training for all four groups." },
      { question: "Workplace-related topics should be:", type: "mcq_single", options: ["Generic", "Customized to your facility", "Skipped for experienced operators", "Memorized"], correctAnswers: "Customized to your facility", explanation: "Workplace topics are site-specific." },
      { question: "As a trainer, you are a:", type: "mcq_single", options: ["Just a teacher", "Safety leader who leads by example", "Rule enforcer", "Record keeper"], correctAnswers: "Safety leader who leads by example", explanation: "The trainer is a safety leader." },
      { question: "Which is a critical evaluation failure?", type: "mcq_single", options: ["Slow driving", "Not wearing harness", "Forgetting to honk", "Parking off-center"], correctAnswers: "Not wearing harness", explanation: "Not wearing fall protection is a critical failure." },
      { question: "The lanyard should be attached to:", type: "mcq_single", options: ["Any nearby object", "The manufacturer-designated anchor point", "A building beam", "The overhead guard"], correctAnswers: "The manufacturer-designated anchor point", explanation: "Attach only to the manufacturer-designated anchor point." },
      { question: "Never operate a MEWP during:", type: "mcq_single", options: ["Light drizzle", "Thunderstorm/lightning", "Cloudy skies", "Cool weather"], correctAnswers: "Thunderstorm/lightning", explanation: "Never operate during thunderstorms — the boom acts as a lightning rod." },
      { question: "If a MEWP contacts a power line, the operator should:", type: "mcq_single", options: ["Jump off", "Stay in the platform and call 911", "Push the line", "Climb down"], correctAnswers: "Stay in the platform and call 911", explanation: "Stay in the platform — jumping can cause electrocution." },
      { question: "Lift controls must be tested:", type: "mcq_single", options: ["Weekly", "Monthly", "Each day before use", "Only after repairs"], correctAnswers: "Each day before use", explanation: "29 CFR 1926.453(a)(1) requires daily testing before use." },
      { question: "Adults learn best when training is:", type: "mcq_single", options: ["Purely theoretical", "Relevant and experience-based", "Memorization-based", "In long lectures"], correctAnswers: "Relevant and experience-based", explanation: "Adults are relevance-oriented and experience-based learners." },
    ],
  },
  {
    module: "Final Exam & Completion",
    title: "Congratulations: You're a Certified Aerial Lift Trainer",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "You're a Certified Aerial Lift Trainer! What's Next",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Your Certification", content: "<p>Congratulations! You are now qualified to <strong>train and evaluate aerial lift and scissor lift operators</strong> at your facility in accordance with OSHA 29 CFR 1926.453, 1910.178(l)(2)(iii), and ANSI/SAIA A92 standards.</p>" },
          { heading: "Next Steps", content: "<ul><li>Download your trainer certificate</li><li>Develop your site-specific aerial lift training curriculum</li><li>Create evaluation checklists and rescue plans</li><li>Schedule familiarization sessions for each MEWP make/model</li><li>Maintain your own operator competence</li></ul>" },
          { heading: "Stay Current", content: "<p>Stay current with OSHA and ANSI updates. The A92 standards were significantly revised in 2020 — be aware of future updates.</p>" },
        ],
        takeaways: [
          "You are qualified to train and evaluate aerial lift operators",
          "Develop site-specific curriculum and rescue plans",
          "Schedule familiarization for each MEWP make/model",
          "Stay current with OSHA and ANSI A92 updates",
        ],
        tip: "Start with a pilot training session to refine your curriculum before rolling it out to all operators.",
      }),
    },
  },
];
