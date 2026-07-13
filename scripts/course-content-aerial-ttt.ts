import type { LessonBlock } from "@shared/lesson-blocks";

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

const blocks = (b: LessonBlock[]) => ({ blocks: b });

export const COURSE_STEPS: StepDef[] = [
  // ═══ MODULE 0: OSHA Regulatory Framework for Aerial Lifts ═══
  {
    module: "OSHA Regulatory Framework for Aerial Lifts",
    title: "Welcome & Aerial Lift Regulatory Framework",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      { type: "hero_image", src: img("aerial-lift-hero.svg"), alt: "Welcome & Aerial Lift Regulatory Framework" },
      { type: "heading", level: 2, text: "Welcome & Aerial Lift Regulatory Framework" },
      { type: "heading", level: 3, text: "About This Course" },
      { type: "paragraph", html: "Welcome to the Aerial & Scissor Lift Train the Trainer Certification! This course prepares you to become a <strong>qualified aerial lift and scissor lift operator trainer</strong>. It combines adult learning principles and training methodology with aerial lift-specific regulatory content." },
      { type: "heading", level: 3, text: "Trainer Qualifications" },
      { type: "paragraph", html: "Under <strong>29 CFR 1910.178(l)(2)(iii)</strong>, all operator training and evaluation shall be conducted by persons who have the <strong>knowledge, training, and experience</strong> to train operators and evaluate their competence. This applies to aerial lift trainers as well." },
      { type: "heading", level: 3, text: "Regulatory Framework" },
      { type: "paragraph", html: "Aerial lift training is governed by multiple standards:" },
      { type: "list", items: [
        "<strong>29 CFR 1926.453</strong> — OSHA Aerial Lift standard",
        "<strong>29 CFR 1910.178(l)</strong> — PIT operator training (applied to scissor lifts)",
        "<strong>ANSI/SAIA A92.20</strong> — MEWP Design, Safety, and Verification",
        "<strong>ANSI/SAIA A92.22</strong> — Safe Use of MEWPs (includes rescue planning)",
        "<strong>ANSI/SAIA A92.24</strong> — Training Requirements for MEWP operators",
      ] },
      { type: "heading", level: 3, text: "Important Note" },
      { type: "paragraph", html: "This course qualifies you to <strong>train and evaluate aerial lift operators</strong>. It does <strong>not</strong> certify you to operate equipment. You must already be a competent aerial lift operator." },
      { type: "callout", variant: "warning", text: "This course does not certify you to operate aerial lifts. You must already be a competent operator." },
      { type: "key_takeaways", items: [
        "Trainer qualifications: knowledge, training, and experience (1910.178(l)(2)(iii))",
        "Aerial lifts are regulated under 1926.453, 1910.178, and ANSI A92 series",
        "ANSI A92.24 specifically covers MEWP training requirements",
        "This course qualifies trainers — not operators",
      ] },
    ]),
  },
  {
    module: "OSHA Regulatory Framework for Aerial Lifts",
    title: "ANSI A92.24 Training Requirements",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      { type: "hero_image", src: img("osha-compliance.svg"), alt: "ANSI A92.24 Training Requirements" },
      { type: "heading", level: 2, text: "ANSI A92.24 Training Requirements" },
      { type: "heading", level: 3, text: "Who Must Be Trained?" },
      { type: "paragraph", html: "ANSI A92.24 requires training for:" },
      { type: "list", items: [
        "<strong>Operators</strong> — anyone who controls a MEWP",
        "<strong>Occupants</strong> — anyone in the platform who is not the operator",
        "<strong>Supervisors</strong> — anyone who directly supervises MEWP operators",
        "<strong>Service personnel</strong> — those who maintain MEWPs",
      ] },
      { type: "flip_cards", title: "Who Needs MEWP Training?", cards: [
        { front: "Operators", back: "Anyone who controls a MEWP must complete full operator training plus familiarization with each specific make/model they will operate." },
        { front: "Occupants", back: "Anyone in the platform who is not the operator still needs training on fall protection and their role in safe use of the MEWP." },
        { front: "Supervisors", back: "Anyone who directly supervises MEWP operators must be trained to recognize safe and unsafe operation and proper MEWP selection." },
        { front: "Service Personnel", back: "Those who maintain MEWPs need training to inspect, service, and work on the equipment safely." },
      ] },
      { type: "heading", level: 3, text: "Training Content Requirements" },
      { type: "paragraph", html: "ANSI A92.24 training must cover:" },
      { type: "list", items: [
        "Purpose and use of the operator's manual",
        "Proper inspection of the MEWP",
        "Recognition and avoidance of common hazards",
        "Proper use of personal fall protection",
        "Proper selection and use of MEWPs",
        "Manufacturer's operating requirements",
        "Proper use of MEWP controls (upper and lower)",
        "Proper movement of the MEWP",
        "Proper shutdown and securing",
      ] },
      { type: "heading", level: 3, text: "Familiarization Requirement" },
      { type: "paragraph", html: "Before operating a specific MEWP, operators must be <strong>familiarized</strong> with:" },
      { type: "list", items: [
        "The specific controls and instruments",
        "Differences from previously operated MEWPs",
        "Any special features or devices",
        "The manufacturer's operating manual",
      ] },
      { type: "paragraph", html: "Familiarization is separate from formal training and is specific to each make/model." },
      { type: "heading", level: 3, text: "Retraining Requirements" },
      { type: "paragraph", html: "ANSI A92.24 requires retraining when:" },
      { type: "list", items: [
        "An operator is observed operating unsafely",
        "After an accident or near-miss",
        "An evaluation reveals unsafe operation",
        "Assigned to a different type of MEWP",
        "Workplace conditions change",
      ] },
      { type: "callout", variant: "tip", text: "Keep a familiarization log for each operator and each MEWP make/model they are authorized to operate." },
      { type: "key_takeaways", items: [
        "ANSI A92.24 requires training for operators, occupants, supervisors, and service personnel",
        "Training must cover inspection, hazards, fall protection, controls, and movement",
        "Familiarization with each specific make/model is required before operation",
        "Retraining is required after unsafe operation, accidents, or new equipment",
      ] },
    ]),
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
    config: blocks([
      { type: "hero_image", src: img("train-the-trainer-hero.svg"), alt: "Adult Learning Principles for Aerial Lift Training" },
      { type: "heading", level: 2, text: "Adult Learning Principles for Aerial Lift Training" },
      { type: "heading", level: 3, text: "Key Principles" },
      { type: "paragraph", html: "Adults learn best when training is <strong>relevant</strong>, <strong>experience-based</strong>, and <strong>problem-centered</strong>. Use real workplace scenarios from your aerial lift operations." },
      { type: "heading", level: 3, text: "Learning Styles" },
      { type: "paragraph", html: "Include <strong>visual</strong> (diagrams of stability, fall protection), <strong>auditory</strong> (explanations, discussions), and <strong>kinesthetic</strong> (hands-on equipment practice) elements." },
      { type: "heading", level: 3, text: "Structuring Aerial Lift Training" },
      { type: "list", ordered: true, items: [
        "<strong>Formal instruction</strong> — OSHA/ANSI requirements, equipment types, stability, fall protection",
        "<strong>Practical training</strong> — pre-op inspection, controls, elevation, driving, emergency procedures",
        "<strong>Evaluation</strong> — knowledge test and practical skills assessment",
        "<strong>Familiarization</strong> — equipment-specific orientation",
      ] },
      { type: "drag_drop", mode: "ordering",
        prompt: "Arrange the phases of a complete aerial lift training program in the correct order.",
        items: [
          { id: "phase-formal", label: "Formal instruction — OSHA/ANSI requirements, stability, fall protection" },
          { id: "phase-practical", label: "Practical training — inspection, controls, elevation, emergencies" },
          { id: "phase-evaluation", label: "Evaluation — knowledge test and practical skills assessment" },
          { id: "phase-familiarization", label: "Familiarization — equipment-specific orientation" },
        ] },
      { type: "heading", level: 3, text: "Training Materials" },
      { type: "paragraph", html: "Prepare: manufacturer's operating manuals, ANSI A92 standards, pre-op inspection checklists, fall protection equipment, evaluation forms, rescue plan templates." },
      { type: "key_takeaways", items: [
        "Make training relevant with real workplace scenarios",
        "Include visual, auditory, and kinesthetic elements",
        "Structure: formal instruction, practical, evaluation, familiarization",
        "Prepare manufacturer manuals and ANSI standards as materials",
      ] },
    ]),
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
    config: blocks([
      { type: "hero_image", src: img("aerial-lift-hero.svg"), alt: "Equipment-Related Training Topics" },
      { type: "heading", level: 2, text: "Equipment-Related Training Topics" },
      { type: "heading", level: 3, text: "Equipment Knowledge" },
      { type: "paragraph", html: "As a trainer, you must cover all equipment-related topics:" },
      { type: "list", items: [
        "Types of MEWPs and their classifications (Group A/B, Types 1-3)",
        "Scissor lift operation, controls, and instrumentation",
        "Boom lift operation (articulating and telescopic)",
        "Engine or motor operation (electric vs. IC)",
        "Steering, driving, and positioning",
        "Platform elevation and descent",
        "Platform capacity and load limits",
        "Stability factors and tip-over hazards",
        "Fall protection requirements (harness, lanyard, anchor points)",
        "Pre-operation inspection requirements",
        "Daily functional testing of controls",
        "Emergency controls and lower control override",
        "Outrigger and stabilizer use",
      ] },
      { type: "heading", level: 3, text: "Teaching Tips" },
      { type: "list", items: [
        "Use the <strong>actual MEWP</strong> for teaching controls",
        "Demonstrate the <strong>capacity plate</strong> and load calculations",
        "Show <strong>fall protection</strong> equipment and proper attachment",
        "Walk through a complete <strong>pre-op inspection</strong>",
        "Demonstrate <strong>emergency lowering</strong> from lower controls",
      ] },
      { type: "key_takeaways", items: [
        "Cover all equipment types: scissor lifts, boom lifts, vertical lifts",
        "Include fall protection, stability, capacity, and emergency controls",
        "Use the actual MEWP for teaching controls and inspection",
        "Demonstrate emergency lowering procedures",
      ] },
    ]),
  },
  {
    module: "Aerial Lift Required Topics Deep Dive",
    title: "Workplace-Related Training Topics",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      { type: "hero_image", src: img("warehouse-aisle.svg"), alt: "Workplace-Related Training Topics" },
      { type: "heading", level: 2, text: "Workplace-Related Training Topics" },
      { type: "heading", level: 3, text: "Site-Specific Topics" },
      { type: "paragraph", html: "Customize these to your facility:" },
      { type: "list", items: [
        "<strong>Surface conditions</strong> and ground bearing capacity",
        "<strong>Pedestrian traffic</strong> and barricading",
        "<strong>Overhead hazards</strong> (power lines, structures, ceilings)",
        "<strong>Weather conditions</strong> (wind, rain, ice, lightning)",
        "<strong>Working near electrical hazards</strong>",
        "<strong>Fall protection</strong> in elevated work",
        "<strong>Falling object protection</strong> (toe boards, screens)",
        "<strong>Hazardous atmospheres</strong> and confined spaces",
        "<strong>Traffic control</strong> and work zone setup",
        "<strong>Emergency rescue procedures</strong>",
      ] },
      { type: "heading", level: 3, text: "Power Line Safety Training" },
      { type: "paragraph", html: "Teach operators the minimum clearance distances:" },
      { type: "list", items: [
        "Up to 50kV: 10 feet",
        "50kV-200kV: 15 feet",
        "200kV-350kV: 20 feet",
        "350kV-500kV: 25 feet",
      ] },
      { type: "paragraph", html: "Include procedures for power line contact emergencies." },
      { type: "heading", level: 3, text: "Rescue Planning" },
      { type: "paragraph", html: "ANSI A92.22 requires a <strong>rescue plan</strong> before MEWP use. Teach operators:" },
      { type: "list", items: [
        "How to use lower controls for rescue",
        "Location of emergency lowering systems",
        "When to call 911",
        "Never climb the boom or scissors",
      ] },
      { type: "embedded_quiz", questions: [
        { question: "Your crew will be working near a 40kV distribution line. What is the minimum clearance the MEWP must keep?", type: "mcq_single", options: ["5 feet", "10 feet", "15 feet", "20 feet"], correctAnswers: "10 feet", explanation: "For power lines up to 50kV, the minimum clearance is 10 feet. A 40kV line falls in that range." },
        { question: "A worker is stranded in a raised platform after the upper controls fail. What should trained ground personnel do first?", type: "mcq_single", options: ["Climb the boom or scissors to reach them", "Use the lower controls or emergency lowering system", "Shake the platform to get their attention", "Wait for the manufacturer to arrive"], correctAnswers: "Use the lower controls or emergency lowering system", explanation: "The rescue plan required by ANSI A92.22 relies on the lower controls and emergency lowering systems. Never climb the boom or scissors." },
      ] },
      { type: "key_takeaways", items: [
        "Customize workplace topics to your facility's specific hazards",
        "Teach power line clearance distances and emergency procedures",
        "ANSI A92.22 requires a rescue plan before MEWP use",
        "Cover weather, surface, overhead, and electrical hazards",
      ] },
    ]),
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
    config: blocks([
      { type: "hero_image", src: img("scissor-lift-hero.svg"), alt: "Practical Training Methodology for Aerial Lifts" },
      { type: "heading", level: 2, text: "Practical Training Methodology for Aerial Lifts" },
      { type: "heading", level: 3, text: "Skills to Practice" },
      { type: "list", items: [
        "<strong>Pre-operation inspection</strong> — visual and functional",
        "<strong>Controls operation</strong> — upper and lower",
        "<strong>Platform elevation/descent</strong>",
        "<strong>Driving and positioning</strong>",
        "<strong>Fall protection</strong> — harness, lanyard, anchor point",
        "<strong>Outrigger deployment</strong> (if applicable)",
        "<strong>Emergency lowering</strong>",
        "<strong>Shutdown and securing</strong>",
      ] },
      { type: "heading", level: 3, text: "Demonstration-Practice-Evaluate Cycle" },
      { type: "list", ordered: true, items: [
        "<strong>Demonstrate</strong> each skill",
        "<strong>Guided practice</strong> with coaching",
        "<strong>Independent practice</strong>",
        "<strong>Evaluate</strong> against checklist",
      ] },
      { type: "heading", level: 3, text: "Safety During Training" },
      { type: "paragraph", html: "As the trainer, maintain safety: keep area clear, stop unsafe behavior, maintain escape route, have emergency procedures ready." },
      { type: "key_takeaways", items: [
        "Practice: inspection, controls, elevation, driving, fall protection, emergencies",
        "Use demonstrate-practice-evaluate cycle",
        "Maintain safety as the trainer's responsibility",
      ] },
    ]),
  },
  {
    module: "Practical Training & Evaluation",
    title: "Operator Evaluation for Aerial Lifts",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      { type: "hero_image", src: img("pre-shift-checklist.svg"), alt: "Operator Evaluation for Aerial Lifts" },
      { type: "heading", level: 2, text: "Operator Evaluation for Aerial Lifts" },
      { type: "heading", level: 3, text: "Evaluation Checklist" },
      { type: "paragraph", html: "Create a checklist covering:" },
      { type: "list", items: [
        "Pre-op inspection completed correctly",
        "Fall protection properly worn and attached",
        "Controls operated smoothly",
        "Platform elevated/descended safely",
        "Outriggers deployed correctly (if required)",
        "Surface conditions assessed",
        "Overhead hazards checked",
        "Emergency controls demonstrated",
        "Safe shutdown procedure",
      ] },
      { type: "heading", level: 3, text: "Pass/Fail Criteria" },
      { type: "paragraph", html: "<strong>Critical failures</strong> (automatic fail): not wearing harness, operating near power lines without clearance, exceeding capacity, not deploying outriggers when required." },
      { type: "scenario", title: "Evaluation Judgment Call",
        prompt: "During a boom lift evaluation, your operator completes a flawless pre-operation inspection, then enters the platform and begins elevating without attaching their lanyard to the manufacturer-designated anchor point. What do you do?",
        choices: [
          { text: "Stop the evaluation immediately — this is a critical failure", correct: true, feedback: "Correct. Not wearing or attaching fall protection is a critical safety failure and an automatic fail. Stop the evaluation, explain specifically what was unsafe, provide additional training on fall protection, then re-evaluate after remediation and document everything." },
          { text: "Let the evaluation continue and note the issue on the checklist", correct: false, feedback: "A missing lanyard connection is a critical failure and an immediate ejection hazard. It cannot be scored as a minor note — stop the evaluation at once." },
          { text: "Coach them to attach the lanyard and continue scoring toward a pass", correct: false, feedback: "An evaluation is observation without coaching, and a critical failure cannot become a pass. Stop, remediate with training, and schedule a re-evaluation." },
        ] },
      { type: "heading", level: 3, text: "Documentation" },
      { type: "paragraph", html: "Certify with: operator name, training date, evaluation date, trainer identity, equipment type trained on. Maintain for OSHA inspection." },
      { type: "callout", variant: "tip", text: "Keep equipment-specific familiarization logs separate from general training records." },
      { type: "key_takeaways", items: [
        "Create an evaluation checklist for aerial lift skills",
        "Critical failures include no harness, power line violations, capacity exceedance",
        "Document with operator name, dates, trainer identity, equipment type",
      ] },
    ]),
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
    config: blocks([
      { type: "hero_image", src: img("osha-compliance.svg"), alt: "Administering Your Aerial Lift Training Program" },
      { type: "heading", level: 2, text: "Administering Your Aerial Lift Training Program" },
      { type: "heading", level: 3, text: "Records Management" },
      { type: "paragraph", html: "Maintain: training records, evaluation checklists, familiarization logs (per make/model), rescue plans, incident reports, refresher training." },
      { type: "heading", level: 3, text: "Refresher Training Triggers" },
      { type: "paragraph", html: "Required when: unsafe operation observed, accident/near-miss, failed evaluation, new MEWP type, workplace changes, or at least every 3 years." },
      { type: "heading", level: 3, text: "Safety Culture" },
      { type: "paragraph", html: "As a trainer, you are a <strong>safety leader</strong>. Lead by example, promote 'stop work' authority, reward hazard reporting, advocate for management commitment." },
      { type: "key_takeaways", items: [
        "Maintain training, evaluation, and familiarization records",
        "Refresher training triggered by unsafe operation, accidents, new equipment",
        "The trainer is a safety leader — lead by example",
      ] },
    ]),
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
    config: blocks([
      { type: "hero_image", src: img("aerial-lift-hero.svg"), alt: "You're a Certified Aerial Lift Trainer! What's Next" },
      { type: "heading", level: 2, text: "You're a Certified Aerial Lift Trainer! What's Next" },
      { type: "heading", level: 3, text: "Your Certification" },
      { type: "paragraph", html: "Congratulations! You are now qualified to <strong>train and evaluate aerial lift and scissor lift operators</strong> at your facility in accordance with OSHA 29 CFR 1926.453, 1910.178(l)(2)(iii), and ANSI/SAIA A92 standards." },
      { type: "heading", level: 3, text: "Next Steps" },
      { type: "list", items: [
        "Download your trainer certificate",
        "Develop your site-specific aerial lift training curriculum",
        "Create evaluation checklists and rescue plans",
        "Schedule familiarization sessions for each MEWP make/model",
        "Maintain your own operator competence",
      ] },
      { type: "heading", level: 3, text: "Stay Current" },
      { type: "paragraph", html: "Stay current with OSHA and ANSI updates. The A92 standards were significantly revised in 2020 — be aware of future updates." },
      { type: "callout", variant: "tip", text: "Start with a pilot training session to refine your curriculum before rolling it out to all operators." },
      { type: "key_takeaways", items: [
        "You are qualified to train and evaluate aerial lift operators",
        "Develop site-specific curriculum and rescue plans",
        "Schedule familiarization for each MEWP make/model",
        "Stay current with OSHA and ANSI A92 updates",
      ] },
    ]),
  },
];
