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
  title: "Forklift Train the Trainer Certification",
  slug: "online-forklift-train-the-trainer",
  description: "Comprehensive OSHA-compliant Train the Trainer certification for forklift operator training. Covers OSHA 29 CFR 1910.178(l)(2)(iii) trainer qualifications, adult learning principles, training program design, all required OSHA topics, practical training methodology, operator evaluation, program administration, and safety culture. Upon completion, you will be qualified to train and evaluate forklift operators at your facility.",
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
  // ═══ MODULE 0: OSHA Regulatory Framework ═══
  {
    module: "OSHA Regulatory Framework",
    title: "Welcome & OSHA Regulatory Framework",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Welcome & OSHA Regulatory Framework",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "About This Course", content: "<p>Welcome to the Forklift Train the Trainer Certification! This course prepares you to become a <strong>qualified forklift operator trainer</strong> under OSHA 29 CFR 1910.178(l)(2)(iii). The course takes approximately <strong>2-3 hours</strong> to complete.</p>" },
          { heading: "Trainer Qualifications (1910.178(l)(2)(iii))", content: "<p>OSHA states: <em>\"All operator training and evaluation shall be conducted by persons who have the knowledge, training, and experience to train powered industrial truck operators and evaluate their competence.\"</em></p><p>OSHA does <strong>not</strong> require a specific certification for trainers. Instead, the standard requires three qualifications:</p><ol><li><strong>Knowledge</strong> — of the OSHA standard and the subject matter</li><li><strong>Training</strong> — formal training on the topics they will teach</li><li><strong>Experience</strong> — practical experience operating the equipment</li></ol>" },
          { heading: "What This Course Covers", content: "<ul><li>Complete review of 29 CFR 1910.178</li><li>Employer responsibilities under the standard</li><li>Documentation and certification requirements (1910.178(l)(6))</li><li>All 22 required training topics (truck-related and workplace-related)</li><li>Adult learning principles and training methodology</li><li>Practical training design and operator evaluation</li><li>Program administration and safety culture</li></ul>" },
          { heading: "Important Note", content: "<p>This Train the Trainer course qualifies you to <strong>train and evaluate operators</strong>. It does <strong>not</strong> certify you to operate equipment. You must already be a competent forklift operator before taking this course. The trainer must maintain their own operator competence.</p>" },
        ],
        takeaways: [
          "OSHA requires trainers to have knowledge, training, and experience",
          "No specific trainer certification is required by OSHA",
          "This course covers the formal training component for trainers",
          "Train the Trainer does NOT certify you to operate equipment",
        ],
        warning: "This course does not certify you to operate a forklift. You must already be a competent operator.",
      }),
    },
  },
  {
    module: "OSHA Regulatory Framework",
    title: "Employer Responsibilities & Documentation",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Employer Responsibilities & Documentation",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Employer's Duty (1910.178(l)(1))", content: "<p>The employer is responsible for ensuring that each operator is <strong>trained</strong>, <strong>evaluated</strong>, and <strong>certified</strong> as required. This includes:</p><ul><li>Initial training for new operators</li><li>Evaluation of operator competence in the workplace</li><li>Refresher training when needed (accidents, unsafe operation, new equipment)</li><li>Re-evaluation at least every 3 years</li></ul>" },
          { heading: "Certification Requirements (1910.178(l)(6))", content: "<p>The employer must certify that each operator has been trained and evaluated. The certification must include:</p><ul><li><strong>Name of the operator</strong></li><li><strong>Date of the training</strong></li><li><strong>Date of the evaluation</strong></li><li><strong>Identity of the person(s)</strong> performing the training or evaluation</li></ul>" },
          { heading: "Record-Keeping", content: "<p>Training records should be maintained and available for OSHA inspection. While OSHA does not specify a retention period, best practice is to keep records for the duration of employment plus 3 years. Records should include:</p><ul><li>Training curriculum and topics covered</li><li>Evaluation checklists and results</li><li>Operator permits/authorizations</li><li>Refresher training records</li><li>Accident/near-miss reports and subsequent retraining</li></ul>" },
          { heading: "OSHA Inspection & Enforcement", content: "<p>OSHA can conduct <strong>unannounced inspections</strong>. Fines for non-compliance can reach <strong>$15,625 per violation</strong> (as of 2023) for serious violations, and up to <strong>$156,259</strong> for willful or repeated violations. Having proper training documentation is your first line of defense.</p>" },
        ],
        takeaways: [
          "The employer is ultimately responsible for operator training and evaluation",
          "Certification must include operator name, training date, eval date, and trainer identity",
          "Maintain training records for employment duration plus 3 years",
          "OSHA fines for non-compliance can exceed $15,000 per violation",
        ],
        tip: "Create a training file for each operator containing their certification, evaluation forms, and any refresher training records.",
      }),
    },
  },
  {
    module: "OSHA Regulatory Framework",
    title: "Knowledge Check: OSHA Framework",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "What three qualifications must a forklift trainer have under OSHA 1910.178(l)(2)(iii)?", type: "mcq_single", options: ["A college degree, a teaching certificate, and 5 years experience", "Knowledge, training, and experience", "A high school diploma, forklift certification, and supervisor approval", "OSHA certification, first aid training, and a CDL"], correctAnswers: "Knowledge, training, and experience", explanation: "OSHA requires trainers to have the knowledge, training, and experience to train operators and evaluate their competence." },
      { question: "What must the operator certification include per 1910.178(l)(6)?", type: "mcq_single", options: ["Operator's Social Security Number", "Operator name, training date, evaluation date, and trainer identity", "Operator's medical records", "Only the operator's signature"], correctAnswers: "Operator name, training date, evaluation date, and trainer identity", explanation: "The certification must include the operator's name, date of training, date of evaluation, and the identity of the trainer/evaluator." },
      { question: "How often must operators be re-evaluated per OSHA?", type: "mcq_single", options: ["Every year", "Every 2 years", "Every 3 years", "Every 5 years"], correctAnswers: "Every 3 years", explanation: "OSHA requires operator re-evaluation at least every three years under 1910.178(l)(4)(iii)." },
    ],
  },

  // ═══ MODULE 1: Adult Learning Principles ═══
  {
    module: "Adult Learning Principles",
    title: "How Adults Learn: Andragogy Basics",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "How Adults Learn: Andragogy Basics",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Adult Learning Theory", content: "<p>Adults learn differently than children. Malcolm Knowles identified key principles of adult learning (<strong>andragogy</strong>):</p><ul><li><strong>Self-directed:</strong> Adults want to take responsibility for their learning</li><li><strong>Experience-based:</strong> Adults bring life experience that is a valuable resource</li><li><strong>Relevance-oriented:</strong> Adults learn best when content is directly relevant to their work</li><li><strong>Problem-centered:</strong> Adults prefer learning that solves real problems</li><li><strong>Motivated internally:</strong> Adults are motivated by factors like self-esteem, better quality of work, etc.</li></ul>" },
          { heading: "Learning Styles", content: "<p>People learn through different modalities. Include all three in your training:</p><ul><li><strong>Visual:</strong> Diagrams, videos, demonstrations, charts</li><li><strong>Auditory:</strong> Lectures, discussions, verbal explanations</li><li><strong>Kinesthetic:</strong> Hands-on practice, equipment operation, role-playing</li></ul>" },
          { heading: "Effective Presentation Techniques", content: "<ul><li>Start with the <strong>why</strong> — explain the safety rationale</li><li>Use <strong>real-world examples</strong> from the workplace</li><li>Keep sessions <strong>short</strong> (15-20 minutes per topic)</li><li>Encourage <strong>questions and discussion</strong></li><li>Use <strong>multimedia</strong> — videos, slides, demonstrations</li><li>Check for understanding frequently</li><li>Provide <strong>hands-on practice</strong> immediately after instruction</li></ul>" },
          { heading: "Managing Group Dynamics", content: "<p>As a trainer, you must manage the group effectively:</p><ul><li>Create a <strong>safe learning environment</strong> where questions are welcomed</li><li>Handle <strong>dominant participants</strong> by redirecting to others</li><li>Draw out <strong>quiet participants</strong> by asking for their input</li><li>Address <strong>safety misconceptions</strong> directly and respectfully</li><li>Keep the training <strong>on schedule</strong></li></ul>" },
        ],
        takeaways: [
          "Adults are self-directed, experience-based, and relevance-oriented learners",
          "Include visual, auditory, and kinesthetic elements in training",
          "Start with the 'why' and use real-world examples",
          "Create a safe learning environment and manage group dynamics",
        ],
        tip: "Ask trainees about their experience at the start of training. Their stories make great teaching examples.",
      }),
    },
  },
  {
    module: "Adult Learning Principles",
    title: "Assessment Strategies",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Assessment Strategies",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Knowledge Assessment", content: "<p>Test understanding of formal instruction through:</p><ul><li><strong>Written tests</strong> — multiple choice, true/false, short answer</li><li><strong>Oral questioning</strong> — ask trainees to explain concepts</li><li><strong>Quizzes throughout</strong> — not just at the end</li><li><strong>Case studies</strong> — present scenarios and ask for the correct response</li></ul>" },
          { heading: "Practical Assessment", content: "<p>Evaluate hands-on skills through:</p><ul><li><strong>Demonstration</strong> — have trainees demonstrate each skill</li><li><strong>Observation</strong> — observe operators performing real tasks</li><li><strong>Checklist evaluation</strong> — use standardized checklists</li><li><strong>Progressive evaluation</strong> — start simple, add complexity</li></ul>" },
          { heading: "Pass/Fail Criteria", content: "<p>Establish clear pass/fail criteria before training begins:</p><ul><li>What score constitutes passing (typically 80%)</li><li>Which practical skills are mandatory</li><li>What constitutes a critical safety failure (automatic fail)</li><li>How many attempts are allowed</li><li>What remediation is provided for failures</li></ul>" },
          { heading: "Providing Feedback", content: "<p>Give <strong>constructive feedback</strong> that is:</p><ul><li><strong>Specific</strong> — point to exact behaviors</li><li><strong>Timely</strong> — immediately after the observation</li><li><strong> Balanced</strong> — address both strengths and areas for improvement</li><li><strong>Actionable</strong> — tell them what to do differently</li></ul>" },
        ],
        takeaways: [
          "Use both knowledge and practical assessments",
          "Establish clear pass/fail criteria before training begins",
          "Use standardized checklists for practical evaluations",
          "Provide specific, timely, balanced, and actionable feedback",
        ],
      }),
    },
  },
  {
    module: "Adult Learning Principles",
    title: "Knowledge Check: Adult Learning",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Adults learn best when training is:", type: "mcq_single", options: ["Purely theoretical", "Directly relevant to their work", "Memorization-based", "Conducted in long sessions"], correctAnswers: "Directly relevant to their work", explanation: "Adults are relevance-oriented — they learn best when content is directly applicable to their job." },
      { question: "Which is NOT one of the three learning styles?", type: "mcq_single", options: ["Visual", "Auditory", "Kinesthetic", "Olfactory"], correctAnswers: "Olfactory", explanation: "The three main learning styles are visual, auditory, and kinesthetic. Olfactory (smell) is not a learning style." },
      { question: "Feedback should be:", type: "mcq_single", options: ["Delayed by several days", "General and vague", "Specific, timely, balanced, and actionable", "Only about weaknesses"], correctAnswers: "Specific, timely, balanced, and actionable", explanation: "Effective feedback is specific, timely, balanced (strengths and weaknesses), and actionable." },
    ],
  },

  // ═══ MODULE 2: Training Program Design ═══
  {
    module: "Training Program Design",
    title: "Designing Your Training Program",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Designing Your Training Program",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Needs Assessment", content: "<p>Before designing training, identify what your operators need to know:</p><ul><li><strong>Equipment types</strong> in use at your facility</li><li><strong>Workplace conditions</strong> — surfaces, ramps, docks, pedestrian traffic</li><li><strong>Operator experience levels</strong> — new vs. experienced</li><li><strong>Site-specific hazards</strong> and safety incidents</li><li><strong>Regulatory requirements</strong> — OSHA 1910.178(l)(3)</li></ul>" },
          { heading: "Learning Objectives", content: "<p>Write <strong>measurable learning objectives</strong> using action verbs:</p><ul><li>\"The operator will <strong>demonstrate</strong> a pre-shift inspection...\"</li><li>\"The operator will <strong>identify</strong> the stability triangle...\"</li><li>\"The operator will <strong>perform</strong> a safe load pickup...\"</li></ul><p>Avoid vague objectives like \"understand\" or \"know\" — these can't be measured.</p>" },
          { heading: "Curriculum Structure", content: "<p>Structure your training in logical modules:</p><ol><li><strong>Formal instruction</strong> (classroom/online) — theory and knowledge</li><li><strong>Practical training</strong> — hands-on demonstrations and guided practice</li><li><strong>Evaluation</strong> — assess both knowledge and skills</li><li><strong>Documentation</strong> — complete certification records</li></ol>" },
          { heading: "Training Materials", content: "<p>Prepare materials including:</p><ul><li>PowerPoint or slide presentations</li><li>Equipment manuals and OSHA standards</li><li>Pre-operation inspection checklists</li><li>Practical evaluation forms</li><li>Written test and answer key</li><li>Site-specific safety rules</li><li>Visual aids — diagrams of stability triangle, load center, etc.</li></ul>" },
        ],
        takeaways: [
          "Start with a needs assessment of your facility and operators",
          "Write measurable learning objectives with action verbs",
          "Structure training: formal instruction, practical, evaluation, documentation",
          "Prepare all materials before the training session",
        ],
        tip: "Customize your training to your specific workplace — generic training misses site-specific hazards.",
      }),
    },
  },
  {
    module: "Training Program Design",
    title: "Designing Practical Exercises",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Designing Practical Exercises",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Progressive Skill Building", content: "<p>Design exercises that build skills progressively:</p><ol><li><strong>Basic controls</strong> — starting, steering, stopping</li><li><strong>Simple maneuvers</strong> — forward, reverse, turning</li><li><strong>Load handling</strong> — picking up, carrying, stacking</li><li><strong>Complex operations</strong> — ramps, docks, narrow aisles</li><li><strong>Site-specific tasks</strong> — actual workplace scenarios</li></ol>" },
          { heading: "Setting Up Practice Courses", content: "<p>Create a designated practice area with:</p><ul><li>Cones or markers for steering courses</li><li>Pallets and loads for handling practice</li><li>Simulated ramp or dock area</li><li>Narrow aisle simulation</li><li>Clear space away from pedestrians and traffic</li></ul>" },
          { heading: "Guided Practice Technique", content: "<ol><li><strong>Demonstrate</strong> the skill yourself first</li><li><strong>Explain</strong> each step as you perform it</li><li>Have the trainee <strong>practice</strong> with your guidance</li><li>Provide <strong>immediate feedback</strong></li><li>Allow <strong>independent practice</strong> once competent</li><li>Evaluate the final performance</li></ol>" },
          { heading: "Correcting Unsafe Behaviors", content: "<p>When you observe unsafe behavior during practice:</p><ul><li><strong>Stop</strong> the operation immediately</li><li>Explain <strong>why</strong> the behavior is unsafe</li><li>Demonstrate the <strong>correct</strong> procedure</li><li>Have the trainee <strong>redo</strong> the operation correctly</li><li>Document any <strong>recurring issues</strong></li></ul>" },
        ],
        takeaways: [
          "Build skills progressively from basic controls to complex operations",
          "Set up a designated practice area away from traffic",
          "Use demonstrate-explain-practice-feedback cycle",
          "Stop unsafe behavior immediately and correct it",
        ],
      }),
    },
  },
  {
    module: "Training Program Design",
    title: "Knowledge Check: Program Design",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Learning objectives should use:", type: "mcq_single", options: ["Vague terms like 'understand'", "Measurable action verbs like 'demonstrate'", "Long paragraphs", "Only the instructor's goals"], correctAnswers: "Measurable action verbs like 'demonstrate'", explanation: "Objectives should use measurable action verbs so you can verify the trainee achieved them." },
      { question: "The recommended progression for practical training is:", type: "mcq_single", options: ["Start with complex operations", "Start with basic controls and build progressively", "Only test at the end", "Skip to site-specific tasks"], correctAnswers: "Start with basic controls and build progressively", explanation: "Build skills progressively: basic controls, simple maneuvers, load handling, complex operations, site-specific tasks." },
      { question: "When you observe unsafe behavior during practice, you should:", type: "mcq_single", options: ["Wait until the end to address it", "Stop the operation immediately", "Ignore minor issues", "Only report it to the supervisor"], correctAnswers: "Stop the operation immediately", explanation: "Stop unsafe behavior immediately, explain why it's unsafe, demonstrate the correct way, and have the trainee redo it." },
    ],
  },

  // ═══ MODULE 3: Required Training Topics Deep Dive ═══
  {
    module: "Required Topics Deep Dive",
    title: "Truck-Related Topics (1910.178(l)(3)(i))",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Truck-Related Topics (1910.178(l)(3)(i))",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "OSHA Requires 13 Truck-Related Topics", content: "<p>OSHA 1910.178(l)(3)(i) requires training on <strong>13 truck-related topics</strong>. As a trainer, you must cover ALL of these in your operator training:</p>" },
          { heading: "Topics A-E: Operating Knowledge", content: "<ul><li><strong>(A)</strong> Operating instructions, warnings, and precautions for the types of truck</li><li><strong>(B)</strong> Differences between the truck and the automobile</li><li><strong>(C)</strong> Truck controls and instrumentation: location, function, and operation</li><li><strong>(D)</strong> Engine or motor operation</li><li><strong>(E)</strong> Steering and maneuvering</li></ul>" },
          { heading: "Topics F-I: Visibility and Capacity", content: "<ul><li><strong>(F)</strong> Visibility (including restrictions due to loading)</li><li><strong>(G)</strong> Fork and attachment adaptation, operation, and use limitations</li><li><strong>(H)</strong> Vehicle capacity</li><li><strong>(I)</strong> Vehicle stability (stability triangle)</li></ul>" },
          { heading: "Topics J-M: Maintenance and Limitations", content: "<ul><li><strong>(J)</strong> Any vehicle inspection and maintenance the operator must perform</li><li><strong>(K)</strong> Refueling and/or charging and recharging of batteries</li><li><strong>(L)</strong> Operating limitations</li><li><strong>(M)</strong> Any other operating instructions, warnings, or precautions from the operator's manual</li></ul>" },
          { heading: "Teaching Tips for Truck-Related Topics", content: "<ul><li>Use the <strong>actual equipment</strong> for controls and instrumentation</li><li>Have operators <strong>demonstrate</strong> each control function</li><li>Show the <strong>data plate</strong> and explain capacity ratings</li><li>Demonstrate the <strong>stability triangle</strong> visually</li><li>Walk through a complete <strong>pre-shift inspection</strong></li></ul>" },
        ],
        takeaways: [
          "OSHA requires 13 truck-related topics under 1910.178(l)(3)(i)",
          "Cover controls, steering, visibility, capacity, stability, inspection, and maintenance",
          "Use the actual equipment for teaching controls and instrumentation",
          "Demonstrate the stability triangle visually for better understanding",
        ],
        tip: "Create a checklist of all 13 topics and check them off as you cover each one during training.",
      }),
    },
  },
  {
    module: "Required Topics Deep Dive",
    title: "Workplace-Related Topics (1910.178(l)(3)(ii))",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Workplace-Related Topics (1910.178(l)(3)(ii))",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "OSHA Requires 9 Workplace-Related Topics", content: "<p>OSHA 1910.178(l)(3)(ii) requires training on <strong>9 workplace-related topics</strong>. These are site-specific and must be tailored to your facility:</p>" },
          { heading: "Topics A-C: Surface and Load Conditions", content: "<ul><li><strong>(A)</strong> Surface conditions where the vehicle will be operated</li><li><strong>(B)</strong> Composition of loads to be carried and load stability</li><li><strong>(C)</strong> Load manipulation, stacking, and unstacking</li></ul>" },
          { heading: "Topics D-F: Traffic and Hazards", content: "<ul><li><strong>(D)</strong> Pedestrian traffic in areas where the vehicle will be operated</li><li><strong>(E)</strong> Narrow aisles and other restricted places</li><li><strong>(F)</strong> Hazardous (classified) locations where the vehicle will be operated</li></ul>" },
          { heading: "Topics G-I: Ramps, Ventilation, and Conditions", content: "<ul><li><strong>(G)</strong> Ramps and other sloped surfaces that could affect stability</li><li><strong>(H)</strong> Closed environments where insufficient ventilation or poor maintenance could cause buildup of carbon monoxide or diesel exhaust</li><li><strong>(I)</strong> Other unique or potentially hazardous environmental conditions in the workplace</li></ul>" },
          { heading: "Teaching Tips for Workplace Topics", content: "<ul><li>Walk through the <strong>actual facility</strong> to show site-specific hazards</li><li>Take photos of <strong>specific areas</strong> (ramps, docks, narrow aisles) for training</li><li>Review your facility's <strong>traffic patterns and pedestrian zones</strong></li><li>Discuss <strong>actual loads</strong> handled at your facility</li><li>Address <strong>ventilation</strong> if operating IC engines indoors</li></ul>" },
        ],
        takeaways: [
          "OSHA requires 9 workplace-related topics under 1910.178(l)(3)(ii)",
          "These topics are site-specific and must be customized to your facility",
          "Cover surface conditions, loads, pedestrians, narrow aisles, ramps, and ventilation",
          "Walk through the actual facility during training to show real hazards",
        ],
      }),
    },
  },
  {
    module: "Required Topics Deep Dive",
    title: "Knowledge Check: Required Topics",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "How many truck-related topics does OSHA require under 1910.178(l)(3)(i)?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "13", explanation: "OSHA requires 13 truck-related topics (A through M) covering operating instructions, controls, steering, visibility, capacity, stability, inspection, maintenance, and more." },
      { question: "How many workplace-related topics does OSHA require under 1910.178(l)(3)(ii)?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "9", explanation: "OSHA requires 9 workplace-related topics (A through I) covering surface conditions, loads, pedestrians, narrow aisles, ramps, ventilation, and other site-specific hazards." },
      { question: "Workplace-related training topics should be:", type: "mcq_single", options: ["Generic and applicable to any facility", "Customized to your specific facility and hazards", "Memorized from the OSHA standard", "Skipped if operators are experienced"], correctAnswers: "Customized to your specific facility and hazards", explanation: "Workplace-related topics are site-specific and must be tailored to your facility's actual conditions, hazards, and equipment." },
    ],
  },

  // ═══ MODULE 4: Practical Training Methodology ═══
  {
    module: "Practical Training Methodology",
    title: "Conducting Practical Training Sessions",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Conducting Practical Training Sessions",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Setting Up for Success", content: "<p>Before the practical training session:</p><ul><li>Ensure the practice area is <strong>clear of pedestrians and obstacles</strong></li><li>Verify the forklift is in <strong>safe operating condition</strong></li><li>Have all <strong>evaluation checklists</strong> ready</li><li>Brief the trainee on what to expect</li><li>Review <strong>emergency procedures</strong> before starting</li></ul>" },
          { heading: "The Demonstration-Practice-Evaluation Cycle", content: "<ol><li><strong>Demonstrate</strong> each skill at normal speed, then slowly with explanation</li><li><strong>Guided practice:</strong> trainee performs while you provide step-by-step coaching</li><li><strong>Independent practice:</strong> trainee performs without coaching</li><li><strong>Evaluate:</strong> observe and score against the checklist</li></ol>" },
          { heading: "Key Skills to Practice", content: "<ul><li><strong>Pre-shift inspection</strong> — complete walkaround and functional tests</li><li><strong>Basic driving</strong> — forward, reverse, turning, stopping</li><li><strong>Load handling</strong> — picking up, traveling with, and depositing loads</li><li><strong>Ramp operation</strong> — ascending and descending with/without loads</li><li><strong>Dock operations</strong> — entering trailers, dock plates</li><li><strong>Parking and shutdown</strong> — proper securing procedures</li></ul>" },
          { heading: "Safety During Training", content: "<p>As the trainer, you are responsible for safety during training:</p><ul><li>Always maintain a <strong>clear escape route</strong> for yourself</li><li>Never allow the trainee to perform <strong>dangerous maneuvers</strong></li><li>Stop the exercise immediately if <strong>unsafe behavior</strong> occurs</li><li>Keep other personnel <strong>clear of the training area</strong></li><li>Have <strong>emergency contact information</strong> readily available</li></ul>" },
        ],
        takeaways: [
          "Use the demonstrate-practice-evaluate cycle for each skill",
          "Practice: inspection, driving, load handling, ramps, docks, parking",
          "Keep the training area clear and maintain emergency readiness",
          "Stop exercises immediately if unsafe behavior occurs",
        ],
        warning: "As the trainer, you are responsible for safety during practical training. Never allow dangerous maneuvers.",
      }),
    },
  },
  {
    module: "Practical Training Methodology",
    title: "Knowledge Check: Practical Training",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "The recommended training cycle for practical skills is:", type: "mcq_single", options: ["Test first, then teach", "Demonstrate, guided practice, independent practice, evaluate", "Only evaluate at the end", "Let trainees figure it out"], correctAnswers: "Demonstrate, guided practice, independent practice, evaluate", explanation: "The effective cycle is: demonstrate the skill, guide practice, allow independent practice, then evaluate." },
      { question: "If a trainee performs an unsafe maneuver during practice, you should:", type: "mcq_single", options: ["Let them finish and address it later", "Stop the exercise immediately", "Ignore it if no one was hurt", "Only note it on the evaluation form"], correctAnswers: "Stop the exercise immediately", explanation: "Stop unsafe behavior immediately. Safety is the trainer's responsibility during training." },
    ],
  },

  // ═══ MODULE 5: Operator Evaluation ═══
  {
    module: "Operator Evaluation",
    title: "Conducting the Operator Evaluation",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Conducting the Operator Evaluation",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Evaluation vs. Training", content: "<p>Training and evaluation are <strong>separate activities</strong>. Training is when you teach and coach. Evaluation is when you <strong>observe and assess</strong> without coaching. The evaluation determines whether the operator is competent to operate independently.</p>" },
          { heading: "Evaluation Checklist Design", content: "<p>Create a standardized evaluation checklist that covers:</p><ul><li><strong>Pre-shift inspection</strong> — completed correctly</li><li><strong>Vehicle startup</strong> — proper sequence and safety checks</li><li><strong>Driving skills</strong> — smooth operation, speed control, turning</li><li><strong>Load handling</strong> — proper pickup, transport, and deposit</li><li><strong>Ramp/dock operations</strong> — safe procedures</li><li><strong>Parking and shutdown</strong> — proper securing</li><li><strong>Safety awareness</strong> — horn use, pedestrian awareness, hazard recognition</li></ul>" },
          { heading: "Conducting the Evaluation", content: "<ol><li>Brief the operator on what they will be evaluated on</li><li>Explain that this is an <strong>evaluation, not training</strong> — no coaching</li><li>Observe and score each item on the checklist</li><li>Take notes on specific observations</li><li>Debrief after the evaluation — share results</li></ol>" },
          { heading: "Pass/Fail Decision Making", content: "<p>Establish clear criteria:</p><ul><li><strong>Pass:</strong> All critical items performed safely, no safety violations</li><li><strong>Conditional pass:</strong> Minor issues that can be corrected with coaching</li><li><strong>Fail:</strong> Any critical safety violation, unsafe operation</li><li><strong>Critical failures</strong> (automatic fail): tipping risk, near-miss with pedestrian, exceeding capacity</li></ul>" },
          { heading: "Handling Unsuccessful Evaluations", content: "<p>If an operator fails the evaluation:</p><ul><li>Explain <strong>specifically</strong> what was unsafe</li><li>Provide <strong>additional training</strong> on the failed areas</li><li>Allow <strong>re-evaluation</strong> after remediation</li><li>Document the failure, remediation, and re-evaluation</li><li>Never allow an operator who failed evaluation to operate independently</li></ul>" },
        ],
        takeaways: [
          "Evaluation is separate from training — observe without coaching",
          "Use a standardized evaluation checklist for all operators",
          "Establish clear pass/fail criteria including critical safety failures",
          "Provide remediation and re-evaluation for operators who fail",
        ],
        tip: "Keep evaluation checklists consistent across all operators to ensure fairness and compliance.",
      }),
    },
  },
  {
    module: "Operator Evaluation",
    title: "Knowledge Check: Operator Evaluation",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "During an evaluation, the trainer should:", type: "mcq_single", options: ["Coach the operator through each step", "Observe without coaching", "Take over if the operator struggles", "Skip items the operator already knows"], correctAnswers: "Observe without coaching", explanation: "Evaluation is separate from training. Observe and assess without coaching to determine true competence." },
      { question: "If an operator fails the evaluation, you should:", type: "mcq_single", options: ["Certify them anyway", "Provide additional training and re-evaluate", "Fire the operator", "Ignore the failure"], correctAnswers: "Provide additional training and re-evaluate", explanation: "Provide remediation training on failed areas, then re-evaluate. Document the entire process." },
    ],
  },

  // ═══ MODULE 6: Program Administration & Safety Culture ═══
  {
    module: "Program Administration & Safety Culture",
    title: "Administering Your Training Program",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Administering Your Training Program",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Training Records Management", content: "<p>Maintain organized training records for each operator:</p><ul><li>Training date and curriculum covered</li><li>Evaluation results and checklist</li><li>Certification with trainer identity</li><li>Refresher training records</li><li>Re-evaluation records (3-year cycle)</li><li>Incident/near-miss reports and subsequent retraining</li></ul>" },
          { heading: "Refresher Training Triggers (1910.178(l)(4))", content: "<p>Refresher training is required when:</p><ul><li>The operator is <strong>observed operating unsafely</strong></li><li>The operator is <strong>involved in an accident or near-miss</strong></li><li>The operator receives an <strong>evaluation revealing unsafe operation</strong></li><li>The operator is <strong>assigned to a different type of truck</strong></li><li>A <strong>workplace condition changes</strong> affecting safe operation</li></ul><p>Plus, evaluation at least every <strong>3 years</strong>.</p>" },
          { heading: "Managing New Equipment", content: "<p>When new equipment is introduced:</p><ul><li>Provide <strong>equipment-specific training</strong> before allowing operation</li><li>Review the <strong>operator's manual</strong> for the new equipment</li><li>Conduct <strong>familiarization training</strong> on controls and differences</li><li>Evaluate operators on the new equipment before certifying</li><li>Update training records</li></ul>" },
          { heading: "Continuous Improvement", content: "<p>Regularly review and improve your training program:</p><ul><li>Review <strong>accident and near-miss data</strong> for trends</li><li>Update training materials when <strong>regulations change</strong></li><li>Solicit <strong>feedback from trainees</strong></li><li>Stay current with <strong>OSHA updates and interpretations</strong></li><li>Conduct <strong>self-audits</strong> of your training records</li></ul>" },
        ],
        takeaways: [
          "Maintain detailed training records for every operator",
          "Refresher training is triggered by unsafe operation, accidents, new equipment, or workplace changes",
          "Provide equipment-specific training when introducing new trucks",
          "Continuously improve your program based on data and feedback",
        ],
      }),
    },
  },
  {
    module: "Program Administration & Safety Culture",
    title: "Building a Safety Culture",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Building a Safety Culture",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "The Trainer's Role in Safety Culture", content: "<p>As a forklift trainer, you are a <strong>safety leader</strong> in your organization. Your attitude, behavior, and commitment to safety set the tone for all operators. Lead by example — always follow safe practices yourself.</p>" },
          { heading: "Promoting 'Safety First' Mindset", content: "<ul><li>Encourage operators to <strong>stop work</strong> if they feel unsafe</li><li>Reward <strong>reporting of hazards and near-misses</strong></li><li>Never pressure operators to <strong>rush at the expense of safety</strong></li><li>Make safety a <strong>regular topic</strong> in team meetings</li><li>Recognize and praise <strong>safe behaviors</strong></li></ul>" },
          { heading: "Management Commitment", content: "<p>A safety culture requires <strong>management commitment</strong>. As a trainer, advocate for:</p><ul><li>Adequate <strong>training time and resources</strong></li><li>Proper <strong>equipment maintenance</strong></li><li>Enforcement of <strong>safety rules</strong> consistently</li><li>Investigation of all <strong>accidents and near-misses</strong></li><li>Regular <strong>safety audits and inspections</strong></li></ul>" },
          { heading: "Safety as an Ongoing Process", content: "<p>Safety is not a one-time event — it's an <strong>ongoing process</strong>. Regular reinforcement, refresher training, and open communication about safety are essential. A strong safety culture reduces accidents, improves productivity, and protects your most valuable asset: your people.</p>" },
        ],
        takeaways: [
          "The trainer is a safety leader — lead by example",
          "Encourage a 'stop work' policy for unsafe conditions",
          "Advocate for management commitment to safety",
          "Safety is an ongoing process, not a one-time event",
        ],
        tip: "Start each shift with a 2-minute safety briefing. It keeps safety top of mind.",
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
      { question: "Refresher training is required when (select the best answer):", type: "mcq_single", options: ["Only every 3 years", "When the operator is observed operating unsafely", "Only when OSHA requests it", "Only when new equipment is purchased"], correctAnswers: "When the operator is observed operating unsafely", explanation: "Refresher training is required for unsafe operation, accidents/near-misses, failed evaluations, new equipment types, or workplace condition changes — plus evaluation every 3 years." },
      { question: "As a trainer, your role in safety culture is to:", type: "mcq_single", options: ["Just teach the material and move on", "Lead by example and be a safety leader", "Enforce rules but not follow them yourself", "Only report to management"], correctAnswers: "Lead by example and be a safety leader", explanation: "The trainer is a safety leader who sets the tone. Always follow safe practices yourself and promote a safety-first mindset." },
    ],
  },

  // ═══ MODULE 7: Final Exam & Completion ═══
  {
    module: "Final Exam & Completion",
    title: "Final Exam: Forklift Train the Trainer Certification",
    type: "exam",
    estimatedMinutes: 15,
    config: { passing_score: 80, max_attempts: 3, randomize_questions: true },
    questions: [
      { question: "What OSHA standard establishes trainer qualifications for forklift training?", type: "mcq_single", options: ["29 CFR 1910.178(l)(2)(iii)", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.500"], correctAnswers: "29 CFR 1910.178(l)(2)(iii)", explanation: "29 CFR 1910.178(l)(2)(iii) states that training must be conducted by persons with the knowledge, training, and experience to train operators." },
      { question: "What three qualifications must a forklift trainer possess?", type: "mcq_single", options: ["Degree, certificate, license", "Knowledge, training, and experience", "Age, education, and physical fitness", "Seniority, approval, and tenure"], correctAnswers: "Knowledge, training, and experience", explanation: "OSHA requires trainers to have the knowledge, training, and experience to train operators and evaluate their competence." },
      { question: "What must operator certification include per 1910.178(l)(6)?", type: "mcq_single", options: ["Operator's photo", "Operator name, training date, eval date, trainer identity", "Operator's SSN", "Only the employer's signature"], correctAnswers: "Operator name, training date, eval date, trainer identity", explanation: "Certification must include the operator's name, date of training, date of evaluation, and identity of the trainer/evaluator." },
      { question: "How often must operators be re-evaluated?", type: "mcq_single", options: ["Every year", "Every 2 years", "Every 3 years", "Every 5 years"], correctAnswers: "Every 3 years", explanation: "OSHA requires operator re-evaluation at least every three years." },
      { question: "How many truck-related topics must be covered in operator training?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "13", explanation: "1910.178(l)(3)(i) requires 13 truck-related topics (A through M)." },
      { question: "How many workplace-related topics must be covered?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "9", explanation: "1910.178(l)(3)(ii) requires 9 workplace-related topics (A through I)." },
      { question: "Adults learn best when training is:", type: "mcq_single", options: ["Purely theoretical", "Directly relevant to their work", "Memorization-based", "In long lectures"], correctAnswers: "Directly relevant to their work", explanation: "Adults are relevance-oriented — they learn best when content is directly applicable to their job." },
      { question: "The three learning styles are:", type: "mcq_single", options: ["Visual, auditory, kinesthetic", "Reading, writing, arithmetic", "Fast, medium, slow", "Individual, group, online"], correctAnswers: "Visual, auditory, kinesthetic", explanation: "The three main learning styles are visual (seeing), auditory (hearing), and kinesthetic (hands-on)." },
      { question: "Learning objectives should use:", type: "mcq_single", options: ["Vague terms like 'understand'", "Measurable action verbs like 'demonstrate'", "Long paragraphs", "Only the instructor's name"], correctAnswers: "Measurable action verbs like 'demonstrate'", explanation: "Objectives should use measurable action verbs so you can verify the trainee achieved them." },
      { question: "The recommended practical training cycle is:", type: "mcq_single", options: ["Test, teach, test", "Demonstrate, guided practice, independent practice, evaluate", "Lecture only", "Evaluate only"], correctAnswers: "Demonstrate, guided practice, independent practice, evaluate", explanation: "The effective cycle is demonstrate, guide practice, allow independent practice, then evaluate." },
      { question: "During an evaluation, the trainer should:", type: "mcq_single", options: ["Coach through each step", "Observe without coaching", "Take over if struggling", "Skip known items"], correctAnswers: "Observe without coaching", explanation: "Evaluation is separate from training — observe and assess without coaching." },
      { question: "Refresher training is required when:", type: "mcq_single", options: ["Only every 3 years", "The operator is observed operating unsafely", "Only when OSHA visits", "Only for new hires"], correctAnswers: "The operator is observed operating unsafely", explanation: "Refresher training is required for unsafe operation, accidents, failed evaluations, new equipment, or workplace changes." },
      { question: "If an operator fails the practical evaluation:", type: "mcq_single", options: ["Certify them anyway", "Provide additional training and re-evaluate", "Terminate employment", "Ignore the failure"], correctAnswers: "Provide additional training and re-evaluate", explanation: "Provide remediation training on failed areas, then re-evaluate. Document the entire process." },
      { question: "This Train the Trainer course certifies you to:", type: "mcq_single", options: ["Operate any forklift", "Train and evaluate forklift operators", "Inspect forklifts for OSHA", "Sell forklift training materials"], correctAnswers: "Train and evaluate forklift operators", explanation: "Train the Trainer qualifies you to train and evaluate operators. It does NOT certify you to operate equipment — you must already be a competent operator." },
      { question: "Workplace-related training topics should be:", type: "mcq_single", options: ["Generic for any facility", "Customized to your specific facility", "Skipped for experienced operators", "Memorized from OSHA text"], correctAnswers: "Customized to your specific facility", explanation: "Workplace topics are site-specific — they must be tailored to your facility's actual conditions and hazards." },
      { question: "As a trainer, you are a:", type: "mcq_single", options: ["Just a teacher", "Safety leader who leads by example", "Enforcer of rules", "Record keeper only"], correctAnswers: "Safety leader who leads by example", explanation: "The trainer is a safety leader whose attitude and behavior set the tone for all operators." },
      { question: "OSHA can fine employers up to how much per serious violation?", type: "mcq_single", options: ["$1,000", "$5,000", "$15,625", "$100,000"], correctAnswers: "$15,625", explanation: "As of 2023, OSHA fines for serious violations can reach $15,625 per violation, and up to $156,259 for willful or repeated violations." },
      { question: "What is a critical failure that should result in automatic evaluation failure?", type: "mcq_single", options: ["Slow driving", "Tipping risk or near-miss with pedestrian", "Forgetting to honk once", "Parking slightly off-center"], correctAnswers: "Tipping risk or near-miss with pedestrian", explanation: "Critical safety failures like tipping risk, near-misses with pedestrians, or exceeding capacity should result in automatic evaluation failure." },
      { question: "Effective feedback should be:", type: "mcq_single", options: ["Delayed and vague", "Specific, timely, balanced, and actionable", "Only about weaknesses", "Given only at the end of training"], correctAnswers: "Specific, timely, balanced, and actionable", explanation: "Effective feedback is specific, timely, balanced (strengths and weaknesses), and actionable." },
      { question: "Training records should be maintained for:", type: "mcq_single", options: ["30 days", "1 year", "Duration of employment plus 3 years", "Forever"], correctAnswers: "Duration of employment plus 3 years", explanation: "Best practice is to keep training records for employment duration plus 3 years, though OSHA does not specify a retention period." },
    ],
  },
  {
    module: "Final Exam & Completion",
    title: "Congratulations: You're a Certified Trainer",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "You're a Certified Trainer! What's Next",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Your Certification", content: "<p>Congratulations on completing the Forklift Train the Trainer Certification! You are now qualified to <strong>train and evaluate forklift operators</strong> at your facility in accordance with OSHA 29 CFR 1910.178(l)(2)(iii).</p>" },
          { heading: "Next Steps", content: "<ul><li>Download your trainer certificate</li><li>Develop your site-specific training curriculum</li><li>Create practical evaluation checklists</li><li>Schedule your first operator training session</li><li>Maintain your own operator competence</li></ul>" },
          { heading: "Stay Current", content: "<p>Continue to develop your skills as a trainer. Stay current with OSHA regulations, attend refresher training, and continuously improve your training program based on feedback and incident data.</p>" },
        ],
        takeaways: [
          "You are now qualified to train and evaluate forklift operators",
          "Develop your site-specific training curriculum and evaluation forms",
          "Maintain your own operator competence",
          "Stay current with OSHA regulations and best practices",
        ],
        tip: "Start with a pilot training session to refine your curriculum before rolling it out to all operators.",
      }),
    },
  },
];
