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
  title: "Online Forklift Operator Certification",
  slug: "online-forklift-operator-certification",
  description: "Formal instruction for powered industrial truck operators, covering equipment, workplace hazards, safe operation and employer responsibilities. Includes practice activities and a knowledge assessment. The employer must also provide practical training, workplace evaluation and documented authorization.",
  category: "forklift",
  price: "45.00",
};

const img = (name: string) => `/images/training/${name}`;
const photo = (name: string) => `/images/training/photos/${name}`;

const blocks = (b: LessonBlock[]) => ({ blocks: b });

export const COURSE_STEPS: StepDef[] = [
  // ═══ MODULE 0: Welcome + OSHA Compliance ═══
  {
    module: "Welcome & OSHA Compliance",
    title: "Welcome to Forklift Operator Certification",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Welcome to Forklift Operator Certification"
      },
      {"type": "hero_image", "src": "/images/training/editorial/warehouse-real.webp", "alt": "Real warehouse material-handling operation", "caption": "Documentary photo: USDA / Lance Cheung, CC BY 2.0 (creativecommons.org/licenses/by/2.0/). Resized; no endorsement or complete safe-procedure demonstration implied."},
      {
        "type": "heading",
        "level": 3,
        "text": "What this course does"
      },
      {
        "type": "paragraph",
        "html": "Learn the formal-instruction topics for powered industrial trucks under <strong>29 CFR 1910.178(l)</strong>. Work through short lessons, practice questions and the final knowledge test at your own pace."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Before you operate at work"
      },
      {
        "type": "list",
        "items": [
          "Complete formal instruction plus trainer demonstrations and supervised hands-on exercises.",
          "Have a qualified evaluator assess your performance in the workplace on the equipment you will use.",
          "Your employer must document training and evaluation, confirm competence and authorize your work."
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "This online completion record is not an OSHA-issued license and does not authorize you to operate every forklift class. Online instruction alone is not enough."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "How to learn"
      },
      {
        "type": "paragraph",
        "html": "Read each lesson, use the practice activities and ask your trainer about anything unclear. Use your preferred language. Progress saves automatically. The final test requires 80%; passing it does not replace practical evaluation."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Learn the rules, practice them, then demonstrate them.",
          "Only operate equipment your employer has authorized you to use."
        ]
      }
    ]),
  },
  {
    module: "Welcome & OSHA Compliance",
    title: "OSHA Compliance: What This Course Covers",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "OSHA Compliance: What This Course Covers"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Three parts, one qualified operator"
      },
      {
        "type": "list",
        "items": [
          "<strong>Formal instruction:</strong> learn truck and workplace hazards through lessons, discussion and demonstrations.",
          "<strong>Practical training:</strong> watch a qualified trainer, then practice under direct supervision without endangering anyone.",
          "<strong>Workplace evaluation:</strong> demonstrate safe performance in the conditions where you will work."
        ]
      },
      {
        "type": "paragraph",
        "html": "The trainer and evaluator need the knowledge, training and experience to teach and assess the equipment involved. A job title alone does not establish qualification. The employer may use qualified outside trainers."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Employer certification record"
      },
      {
        "type": "paragraph",
        "html": "Keep the operator’s name, training date, evaluation date, and identity of the person or people performing the training or evaluation. An online score or wallet card alone is not that complete record."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "When more training is required"
      },
      {
        "type": "list",
        "items": [
          "Unsafe operation, an accident or a near-miss.",
          "An evaluation showing unsafe performance.",
          "Assignment to a different truck type.",
          "A workplace change that affects safe operation."
        ]
      },
      {
        "type": "paragraph",
        "html": "Provide refresher training on the relevant topics and evaluate its effectiveness. Evaluate each operator’s performance at least once every three years; do not wait three years after an unsafe event. Previous training can count only when it fits the truck and conditions and the operator is evaluated as competent."
      },
      {
        "type": "key_takeaways",
        "items": [
          "The employer is responsible for training, evaluation and certification.",
          "Extra training is triggered by risk, not just a calendar date."
        ]
      }
    ]),
  },
  // NOTE (2026-07-16): interim checkpoints reduced from 7 to 3 to simplify
  // the student experience (Alberto demo feedback). Interactive lesson
  // elements and the final exam are unchanged. Key questions from removed
  // checkpoints were merged into the remaining three.

  // ═══ MODULE 1: Forklift Basics + Responsibilities ═══
  {
    module: "Forklift Basics & Responsibilities",
    title: "What is a Powered Industrial Truck (PIT)?",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "What is a Powered Industrial Truck (PIT)?"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Definition"
      },
      {
        "type": "paragraph",
        "html": "A <strong>Powered Industrial Truck (PIT)</strong> is any mobile, self-propelled vehicle used to carry, push, pull, lift, stack, or tier materials. Common names include forklift, pallet jack, rider truck, fork truck, and lift truck."
      },
      {
        "type": "paragraph",
        "html": "PITs may be powered by electric motors or internal combustion engines (propane, gasoline, diesel)."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Know Your Machine"
      },
      {
        "type": "paragraph",
        "html": "Before you operate, you need to know the machine's key components. Tap each marker to learn what it does."
      },
      {
        "type": "hotspot_diagram",
        "src": "/images/training/forklift-anatomy.svg",
        "alt": "Side view of a counterbalance forklift",
        "hotspots": [
          {
            "x": 36,
            "y": 31,
            "label": "Overhead Guard",
            "description": "Protects the operator from falling objects. It is not designed to withstand a full load falling on it — never lift more than rated capacity."
          },
          {
            "x": 56,
            "y": 35,
            "label": "Mast",
            "description": "The vertical assembly that raises and lowers the load. Lift chains and hydraulic cylinders inside the mast do the lifting work."
          },
          {
            "x": 61,
            "y": 67,
            "label": "Load Backrest",
            "description": "Keeps the load from sliding back toward the operator when the mast is tilted back."
          },
          {
            "x": 73,
            "y": 86,
            "label": "Forks",
            "description": "Carry the load. Inspect daily for cracks, bends, and heel wear. Always spread them to fit the pallet and insert fully."
          },
          {
            "x": 24,
            "y": 69,
            "label": "Counterweight",
            "description": "The heavy rear section that balances the load on the forks. This is why a forklift steers from the rear and why overloading is so dangerous."
          },
          {
            "x": 46,
            "y": 79,
            "label": "Drive Wheels (front)",
            "description": "The front wheels carry most of the weight and drive the machine. They form the front two corners of the stability triangle."
          },
          {
            "x": 27,
            "y": 81,
            "label": "Steer Wheels (rear)",
            "description": "Forklifts steer with the REAR wheels — the tail swings wide in turns. Always check your rear swing clearance."
          },
          {
            "x": 46,
            "y": 69,
            "label": "Data Plate",
            "description": "Lists the truck's rated capacity, load center, weight, and fuel type. Read it before every job — it is your legal lifting limit."
          },
          {
            "x": 34,
            "y": 53,
            "label": "Operator Seat & Seat Belt",
            "description": "Your seat belt is your primary protection in a tip-over. Buckle up before starting the engine, every time."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "OSHA Equipment Classifications"
      },
      {
        "type": "paragraph",
        "html": "OSHA groups powered industrial trucks into 7 classes. Flip each card to see what the class covers."
      },
      {
        "type": "flip_cards",
        "title": "The 7 OSHA Classes",
        "cards": [
          {
            "front": "Class I",
            "back": "Electric Motor Rider Trucks — sit-down counterbalance trucks powered by battery."
          },
          {
            "front": "Class II",
            "back": "Electric Motor Narrow Aisle Trucks — reach trucks and order pickers built for tight aisles."
          },
          {
            "front": "Class III",
            "back": "Electric Walkie/Rider Pallet Jacks and Stackers — walk-behind or ride-on pallet movers."
          },
          {
            "front": "Class IV",
            "back": "Internal Combustion Rider Trucks with Cushion Tires — for smooth indoor floors."
          },
          {
            "front": "Class V",
            "back": "Internal Combustion Trucks with Pneumatic Tires — indoor/outdoor use on rougher surfaces."
          },
          {
            "front": "Class VI",
            "back": "Electric and IC Engine Tractors — tuggers that pull loads rather than lift them."
          },
          {
            "front": "Class VII",
            "back": "Rough Terrain Forklift Trucks — large-tire trucks for construction sites and yards."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Who Can Operate"
      },
      {
        "type": "paragraph",
        "html": "Your employer must authorize you for the specific equipment and workplace. Performance evaluation is required at least every three years, with refresher training sooner when triggered."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Employer vs. Operator Responsibilities"
      },
      {
        "type": "list",
        "items": [
          "<strong>Employer:</strong> Must provide training, ensure equipment is maintained, enforce safety rules",
          "<strong>Operator:</strong> Must follow all safety rules, perform pre-shift inspections, report hazards and incidents immediately"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Truck controls and startup"
      },
      {
        "type": "paragraph",
        "html": "A forklift is not a car: rear steering creates tail swing, loads block vision, and its weight and small stability base change braking and turning. Controls differ between sit-down trucks, reach trucks, order pickers and walkies."
      },
      {
        "type": "list",
        "items": [
          "Read the operator manual and warning labels for this exact truck. Ask the trainer to identify the direction selector, accelerator, service brake, parking brake, horn, lift, tilt and attachment controls.",
          "Before moving, inspect the truck, secure the restraint provided, set neutral and the parking brake, and start or energize it as the manual directs. Check gauges, battery/fuel level and warning indicators.",
          "Test steering, brakes and hydraulics in a clear area as instructed. Stop and report any fault. Never bypass an interlock or try an unfamiliar control with a raised load."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Tires, fuel and attachments"
      },
      {
        "type": "paragraph",
        "html": "Cushion tires suit smooth surfaces; pneumatic tires may suit rougher surfaces only within the truck’s limits. Solid pneumatic tires resist punctures but do not make a truck suitable for every terrain. Electric trucks have no engine exhaust; LPG, gasoline and diesel trucks need appropriate ventilation."
      },
      {
        "type": "paragraph",
        "html": "Fork positioners change fork spacing; rotators turn loads; drum/tire handlers and roll clamps hold specific loads; hooks can suspend loads. Each needs specific training, manufacturer approval where required, and an accurate attachment capacity plate. Do not improvise an attachment or add counterweight."
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Knowing the seven classes is not permission to operate all of them. Learn the actual controls, limits and work conditions before each new type."
      },
      {
        "type": "key_takeaways",
        "items": [
          "A PIT is any powered vehicle used to move, lift, or stack materials",
          "There are 7 OSHA classifications of powered industrial trucks",
          "Operators must be 18+ years old, trained, and authorized",
          "Performance evaluation at least every three years; refresher sooner when needed"
        ]
      }
    ]),
  },
  {
    module: "Forklift Basics & Responsibilities",
    title: "Authorization & Safe Work Culture",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Authorization & Safe Work Culture"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Authorization and responsibility"
      },
      {
        "type": "paragraph",
        "html": "Operate only when trained, evaluated and authorized for the job. Workers under 18 generally may not operate forklifts under federal youth-employment rules. Tell your supervisor if you are not ready for an unfamiliar truck or task."
      },
      {
        "type": "list",
        "items": [
          "Report defects, spills, blocked routes, poor lighting, accidents and near-misses immediately.",
          "No horseplay, distracted driving or impairment. Keep hands and feet inside the operator area and away from mast pinch points.",
          "Do not carry unauthorized riders. A personnel platform is not permission to transport a passenger."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Mounting and tip-over response"
      },
      {
        "type": "paragraph",
        "html": "Face the truck and use its steps and handholds with three points of contact. Do not grab controls to climb in. Use the provided restraint. On a sit-down counterbalanced truck tipping over, stay belted in, grip the wheel, brace your feet and lean away from the impact; do not jump. Stand-up and other designs may require a different response: learn the manufacturer’s emergency procedure before operating."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Safety, not fear-based claims"
      },
      {
        "type": "paragraph",
        "html": "OSHA can inspect workplaces and cite violations. Penalties depend on the violation and current rules; there is no universal automatic fine per uncertified worker per day. Safe operation protects people first."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Stop and ask when a task is outside your training.",
          "Report hazards and know your truck’s emergency procedure."
        ]
      }
    ]),
  },
  {
    module: "Forklift Basics & Responsibilities",
    title: "Knowledge Check: OSHA & Forklift Basics",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "OSHA training for forklift operators requires formal instruction, practical training, AND an evaluation.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "OSHA requires all three components: formal instruction, practical/hands-on training, and an evaluation of operator performance." },
      {"question": "Who may ride on a forklift while it travels?", "type": "mcq_single", "options": ["Anyone with a harness", "Only authorized riders in a safe riding position provided for them", "Anyone standing on a pallet", "Anyone when the truck is slow"], "correctAnswers": "Only authorized riders in a safe riding position provided for them", "explanation": "Do not carry unauthorized passengers. A personnel platform does not authorize transporting an elevated worker."},
      { question: "If you notice a minor oil leak on the forklift during pre-shift inspection, you should:", type: "mcq_single", options: ["Continue working and report at end of shift", "Report it immediately and do not operate until cleared", "Clean it up and keep working", "Only report if it gets worse"], correctAnswers: "Report it immediately and do not operate until cleared", explanation: "Any safety concern must be reported immediately. Vehicles should not be operated until they are deemed safe." },
    ],
  },

  // ═══ MODULE 2: Stability + Load Handling ═══
  {
    module: "Stability & Load Handling",
    title: "Stability Triangle and Center of Gravity",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      { type: "heading", level: 2, text: "Stability Triangle and Center of Gravity" },
      {"type": "technical_diagram", "kind": "stability"},
      { type: "heading", level: 3, text: "What is the Stability Triangle?" },
      { type: "paragraph", html: "The <strong>stability triangle</strong> is the three-point base formed by the two front axle ends and the rear axle pivot point. As long as the combined center of gravity of the truck and its load stays within this triangle, the forklift remains stable." },
      { type: "heading", level: 3, text: "Tip-Over Risk" },
      { type: "paragraph", html: "When the center of gravity shifts outside the stability triangle — due to overloading, sharp turns, or operating on slopes — the forklift can <strong>tip over</strong>. Tip-overs are one of the leading causes of forklift fatalities." },
      { type: "list", items: [
        "Never make sharp turns at speed",
        "Reduce speed before turning",
        "Be extra cautious on ramps, slopes, and uneven surfaces",
      ] },
      { type: "heading", level: 3, text: "Lateral Stability" },
      { type: "paragraph", html: "Turning too quickly shifts the center of gravity sideways. The higher the load, the more unstable the truck becomes during turns. Always <strong>slow down before turning</strong>, not during the turn." },
      { type: "callout", variant: "warning", text: "Tip-overs are among the leading causes of forklift operator fatalities. Always respect the stability triangle." },
      { type: "key_takeaways", items: [
        "The stability triangle is formed by the front axle ends and rear axle pivot",
        "Keep the center of gravity within the triangle to prevent tip-overs",
        "Reduce speed before turns — sharp turns cause lateral instability",
        "Higher loads mean greater tip-over risk during turns",
      ] },
    ]),
  },
  {
    module: "Stability & Load Handling",
    title: "Rated Capacity & Data Plate",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Rated Capacity & Data Plate"
      },
      {"type": "technical_diagram", "kind": "load-center"},
      {
        "type": "heading",
        "level": 3,
        "text": "The Data Plate"
      },
      {
        "type": "paragraph",
        "html": "Every forklift has a manufacturer's <strong>data plate</strong> indicating the maximum lifting capacity at various load centers. Before lifting any load, verify your forklift is rated to handle its weight."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Load Center"
      },
      {
        "type": "paragraph",
        "html": "The <strong>load center</strong> is the distance from the fork's vertical face to the center of the load. A forklift's capacity decreases as the load center increases. Always verify you're using the right equipment for the weight and size of the load."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Attachments Reduce Capacity"
      },
      {
        "type": "paragraph",
        "html": "Using attachments (clamps, rotators, fork extensions) changes the truck's center of gravity and <strong>reduces the rated capacity</strong>. Always check the adjusted capacity when using any attachment."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Never Overload"
      },
      {
        "type": "paragraph",
        "html": "Exceeding the rated capacity greatly increases the risk of instability and tip-over. Display weight limits clearly on the vehicle. If a load seems too heavy or unbalanced, do not attempt to lift it — get a higher-capacity truck."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Read the plate, not a rule of thumb"
      },
      {
        "type": "paragraph",
        "html": "The capacity illustration is a learning example, not a lifting chart. Use the actual plate for the load center, lift height and attachment. If weight or capacity is unknown, stop. Manufacturer prior written approval is required for changes affecting capacity or safe operation; update the plates accordingly. Treat an empty truck with an attachment as partially loaded."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Always check the data plate for rated capacity before lifting",
          "Capacity decreases as load center distance increases",
          "Attachments reduce the forklift's rated capacity",
          "Never exceed the rated capacity — use a larger truck if needed"
        ]
      }
    ]),
  },
  {
    module: "Stability & Load Handling",
    title: "Picking Up and Carrying Loads Safely",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Picking Up and Carrying Loads Safely"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Fork Position"
      },
      {
        "type": "paragraph",
        "html": "Carry forks as low as possible — typically <strong>4 to 6 inches</strong> from the ground. This lowers the center of gravity and reduces the risk of tip-over."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Mast Tilt"
      },
      {
        "type": "paragraph",
        "html": "Tilt the mast slightly back when traveling with a load to stabilize it. Never tilt loads forward except when depositing them. Excessive forward tilt can cause the truck to tip."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Visibility"
      },
      {
        "type": "paragraph",
        "html": "If a load blocks your forward view, <strong>drive in reverse</strong> to maintain a clear line of sight. Use spotters when navigating tight spaces or areas with limited visibility."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Securing Loads"
      },
      {
        "type": "paragraph",
        "html": "Before transporting any load, ensure it is <strong>properly secured and balanced</strong>. You may need shrink-wrap or straps to prevent shifting or spilling during transport. Never move an unsecured load."
      },
      {
        "type": "embedded_quiz",
        "questions": [
          {
            "question": "You pick up a wrapped pallet and realize it completely blocks your forward view. What do you do?",
            "type": "mcq_single",
            "options": [
              "Lean out the side to see around it",
              "Raise the load higher so you can see under it",
              "Travel in reverse with a clear line of sight",
              "Drive forward slowly and honk"
            ],
            "correctAnswers": "Travel in reverse with a clear line of sight",
            "explanation": "When the load blocks your forward view, travel in reverse so you can see where you are going. Never lean outside the cage or raise the load to see under it."
          },
          {
            "question": "While carrying a load, the mast should be tilted:",
            "type": "mcq_single",
            "options": [
              "Fully forward",
              "Slightly back",
              "It doesn't matter",
              "Fully down"
            ],
            "correctAnswers": "Slightly back",
            "explanation": "A slight back tilt cradles the load against the backrest and keeps it stable during travel."
          }
        ]
      },
      {
        "type": "callout",
        "variant": "tip",
        "text": "When you can't see past the load, travel in reverse and use a spotter for tight areas."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Stacking and unstacking"
      },
      {
        "type": "list",
        "items": [
          "Check the pallet, load weight, rack capacity, floor and overhead clearance. Keep people outside the drop zone; nobody may stand under raised forks.",
          "Approach squarely with forks level. Space forks to support the load, engage fully and center it. Raise only enough to clear; tilt back only as needed for stability.",
          "For a rack, stop before raising. Position over the support before lowering or tilting forward. Use only enough backward tilt to stabilize a raised load.",
          "Set the load down completely, check behind, withdraw slowly and lower forks to travel height before driving. Never turn or travel with a high load."
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Blocked view on a ramp? Keep the required load orientation and stop for a safe plan or spotter. Do not reverse the load’s uphill orientation just to see better."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Carry forks 4-6 inches from the ground",
          "Tilt the mast back when traveling with a load",
          "Drive in reverse if the load blocks your forward view",
          "Always ensure loads are secured before moving"
        ]
      }
    ]),
  },
  // ═══ MODULE 3: Pre-Operation Inspection + Fueling/Charging ═══
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Pre-Shift Inspection Checklist",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Pre-Shift Inspection Checklist"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Your Responsibility"
      },
      {
        "type": "paragraph",
        "html": "As the operator, it is <strong>your responsibility</strong> to conduct a daily safety inspection before using the machine. This must be done at the <strong>start of each shift</strong>."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Walk-Around Inspection"
      },
      {
        "type": "paragraph",
        "html": "Walk around the truck before climbing on. Use this checklist together with the manufacturer’s inspection procedure."
      },
      {"type": "list", "items": ["<strong>Tires & Wheels:</strong> Check for cuts, chunks missing, proper inflation (pneumatic), and debris wrapped around axles.", "<strong>Forks:</strong> Look for cracks, bends, and heel wear. Check the fork locking pins. Bent or cracked forks mean the truck is out of service.", "<strong>Mast & Lift Chains:</strong> Inspect chains for kinks, rust, and broken links. Check that the mast raises, lowers, and tilts smoothly without jerking.", "<strong>Hydraulics & Leaks:</strong> Look under the truck for fresh fluid spots. Check hoses and cylinders for leaks. A hydraulic leak means DO NOT OPERATE.", "<strong>Overhead Guard:</strong> Check for bent posts, cracks, or missing bolts. The guard is your protection from falling loads.", "<strong>Data Plate:</strong> Must be present and legible. If you cannot read the rated capacity, do not operate the truck.", "<strong>Seat & Seat Belt:</strong> Test that the seat belt latches and retracts. Buckle up before starting the engine — every single time.", "<strong>Horn, Lights & Alarm:</strong> Test the horn, headlights, warning lights, and backup alarm. If pedestrians can't hear you coming, the truck is not safe."]},
      {
        "type": "heading",
        "level": 3,
        "text": "Also Check"
      },
      {
        "type": "list",
        "items": [
          "<strong>Brakes:</strong> Test both service and parking brakes",
          "<strong>Steering:</strong> Check for responsiveness",
          "<strong>Fluid levels:</strong> Fuel, oil, coolant, hydraulic fluid"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Tag Out Unsafe Equipment"
      },
      {
        "type": "paragraph",
        "html": "If you find any safety issue, <strong>do not operate the forklift</strong>. Report the problem to your supervisor or maintenance team immediately. Tag out the equipment so no one else uses it until repairs are completed."
      },
      {
        "type": "embedded_quiz",
        "questions": [
          {
            "question": "During your walk-around you find a slow hydraulic drip under the mast. The truck seems to work fine. What now?",
            "type": "mcq_single",
            "options": [
              "Operate carefully and re-check at lunch",
              "Wipe it clean and keep working",
              "Tag out the truck and report it — do not operate",
              "Add hydraulic fluid to compensate"
            ],
            "correctAnswers": "Tag out the truck and report it — do not operate",
            "explanation": "Any hydraulic leak can lead to sudden loss of load control. Tag out and report — never operate a leaking truck."
          }
        ]
      },
      {
        "type": "callout",
        "variant": "tip",
        "text": "Always buckle your seat belt before starting the engine — it's your primary protection in a tip-over."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Inspection limits"
      },
      {
        "type": "paragraph",
        "html": "Inspect before service, at least daily, and after each shift when used around the clock. Follow the truck-specific checklist. Only perform maintenance you are trained and authorized to do. Never feel for a pressurized hydraulic leak with your hand; injection injuries need emergency medical care."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Pre-shift inspection is required before every shift",
          "Check tires, forks, chains, hydraulics, lights, horn, brakes, steering",
          "Tag out and report any unsafe equipment immediately",
          "Never operate a forklift that fails inspection"
        ]
      }
    ]),
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Maintenance and Repairs",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      { type: "heading", level: 2, text: "Maintenance and Repairs" },
      { type: "heading", level: 3, text: "Repair Before Use" },
      { type: "paragraph", html: "If a safety issue is identified during inspection, <strong>repairs must be made before the equipment is used</strong>. Never operate a forklift with known defects." },
      { type: "heading", level: 3, text: "Fluid Leaks" },
      { type: "paragraph", html: "Do not operate any vehicle with <strong>fuel, oil, or hydraulic leaks</strong>. Hydraulic leaks can lead to sudden loss of load control, creating an extremely dangerous situation." },
      { type: "heading", level: 3, text: "Document and Report" },
      { type: "paragraph", html: "All maintenance issues must be documented and reported. This creates a paper trail for compliance and helps prevent recurring issues." },
      { type: "key_takeaways", items: [
        "Repairs must be completed before the equipment is used",
        "Never operate a forklift with any fluid leaks",
        "Document all maintenance issues for compliance",
      ] },
    ]),
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Fueling and Charging Safety",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Fueling and Charging Safety (LPG / Electric)"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Use the designated area"
      },
      {
        "type": "paragraph",
        "html": "Only trained, authorized workers may refuel, change batteries or charge them. Park, lower forks and apply the brake. Follow the truck, battery and charger manuals. Keep smoking, flames, sparks and arcs out of the area; observe site fire rules."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Fuel and LPG"
      },
      {
        "type": "list",
        "items": [
          "Shut off the engine before filling fuel tanks. Clean spills and replace caps before restart. Do not operate with a fuel leak.",
          "For LPG cylinder exchange, use the manufacturer’s shutdown and pressure-release procedure. Wear task-appropriate gloves and eye protection. Secure and orient the approved cylinder correctly.",
          "Inspect seals and connections and check for leaks by the approved method, never with a flame. Stop, keep ignition sources away and report gas odor or leakage."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Battery charging"
      },
      {
        "type": "list",
        "items": [
          "Lead-acid charging can release explosive hydrogen. Provide required ventilation; open covers and check vent caps as directed. Keep metal tools off exposed batteries.",
          "Use the correct compatible charger and connection sequence. Prevent arcing; do not assume instructions for one battery chemistry apply to another.",
          "Use acid-resistant PPE and designated flushing/spill facilities when handling electrolyte. Only trained personnel should add electrolyte; add acid to water, never water to acid.",
          "Use suitable handling equipment for heavy batteries and secure a replacement before driving. Report damaged, leaking, unusually hot or swollen batteries; follow the site emergency plan."
        ]
      },
      {
        "type": "key_takeaways",
        "items": [
          "Training, compatible equipment and ventilation come first.",
          "No ignition sources; never use a flame to check a leak."
        ]
      }
    ]),
  },
  {
    module: "Pre-Operation Inspection & Fueling",
    title: "Knowledge Check: Stability, Loads & Inspections",
    type: "checkpoint",
    estimatedMinutes: 3,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "When traveling with a load, forks should be:", type: "mcq_single", options: ["Raised as high as possible", "At eye level", "4 to 6 inches from the ground", "Touching the ground"], correctAnswers: "4 to 6 inches from the ground", explanation: "Carrying forks 4 to 6 inches from the ground keeps the center of gravity low and reduces tip-over risk." },
      { question: "If a load is too heavy for your forklift, you should:", type: "mcq_single", options: ["Try to lift it carefully", "Use a larger-capacity truck", "Add counterweight to the back", "Drive faster for momentum"], correctAnswers: "Use a larger-capacity truck", explanation: "Never exceed rated capacity. Get the right equipment for the job." },
      { question: "If a safety issue is found during pre-shift inspection, repairs must be completed:", type: "mcq_single", options: ["By end of day", "Before the equipment is used", "Within a week", "Only if a supervisor requests it"], correctAnswers: "Before the equipment is used", explanation: "Repairs must be made before use if the equipment is unsafe. Never operate a defective forklift." },
    ],
  },

  // ═══ MODULE 4: Safe Driving + Pedestrians + Intersections ═══
  {
    module: "Safe Driving & Pedestrians",
    title: "Speed, Space, and Awareness",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Speed, Space, and Awareness"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Choose a speed that lets you stop"
      },
      {
        "type": "paragraph",
        "html": "Follow the posted site limit and drive slower when conditions require it. OSHA does not set one universal 5 mph limit. Reduce speed before turns, at blind spots and on wet or uneven floors. Never race or make sudden steering movements."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Space and visibility"
      },
      {
        "type": "paragraph",
        "html": "Keep approximately three truck lengths behind the truck ahead, and more when needed to stop safely. Look in the direction of travel. Slow down and sound the horn at cross aisles and blind spots. Never pass another truck there. Yield to pedestrians and emergency vehicles."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Restricted routes"
      },
      {
        "type": "paragraph",
        "html": "Check aisle width, rear swing, overhead pipes, doors and sprinkler clearance. Avoid loose objects and unsafe surfaces. Cross railroad tracks diagonally where possible; do not park within eight feet of the track center. Enter an elevator only when authorized, rated for the combined weight and level with the floor; neutralize controls, shut off power and set brakes once inside."
      },
      {
        "type": "key_takeaways",
        "items": [
          "A posted limit is a maximum, not a target.",
          "Allow enough room to stop and keep a clear view."
        ]
      }
    ]),
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Intersections, Blind Spots, and Horn Use",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      { type: "heading", level: 2, text: "Intersections, Blind Spots, and Horn Use" },
      { type: "heading", level: 3, text: "Approach With Caution" },
      { type: "paragraph", html: "At every intersection, blind corner, or area with limited visibility: <strong>slow down, sound your horn, and look both ways</strong> before proceeding." },
      { type: "heading", level: 3, text: "Mirrors and Visibility" },
      { type: "paragraph", html: "Use available mirrors and look in the direction of travel. If a load blocks your forward view, travel in reverse. Never pass at intersections, blind spots, or hazardous areas." },
      { type: "heading", level: 3, text: "Horn Protocol" },
      { type: "paragraph", html: "The horn is a <strong>warning device</strong>, not a demand for right-of-way. Sound it at intersections, blind corners, doorways, and whenever pedestrians may be present. Use it to alert others to your presence." },
      { type: "key_takeaways", items: [
        "Slow down, honk, and look at every intersection",
        "Use mirrors and drive in reverse when view is blocked",
        "The horn warns others — it doesn't give you right-of-way",
        "Never pass at intersections or blind spots",
      ] },
    ]),
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Pedestrian Right of Way",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      { type: "heading", level: 2, text: "Pedestrian Right of Way" },
      { type: "heading", level: 3, text: "Pedestrians Always Have Priority" },
      { type: "paragraph", html: "Pedestrians <strong>always have the right of way</strong>. Never drive toward a person near a fixed object. Always ensure people are clear before moving." },
      { type: "heading", level: 3, text: "Communication" },
      { type: "list", items: [
        "Make <strong>eye contact</strong> with pedestrians before proceeding",
        "Sound the horn as a <strong>warning</strong>, not as a demand to move",
        "Wait for pedestrians to acknowledge you and move to safety",
      ] },
      { type: "scenario", title: "What Would You Do?",
        prompt: "You are carrying a pallet down the main aisle at walking speed. Twenty feet ahead, a coworker steps out from between two racks reading a clipboard. They have not seen you.",
        choices: [
          { text: "Sound the horn repeatedly and keep moving — they'll step back", correct: false, feedback: "The horn is a warning, not a demand for right of way. A startled pedestrian may step the wrong way. You must stop until they are clear." },
          { text: "Stop, sound the horn once, and wait for eye contact before proceeding", correct: true, feedback: "Exactly right. Pedestrians always have the right of way. Stop, warn, make eye contact, and only proceed once they are clearly out of your path." },
          { text: "Steer around them while keeping your speed", correct: false, feedback: "Never swerve around a pedestrian who hasn't seen you — they may move into your new path, and sharp steering with a load risks a tip-over." },
        ] },
      { type: "heading", level: 3, text: "Pedestrian Zones" },
      { type: "paragraph", html: "Be especially alert in areas where pedestrians commonly walk: near break rooms, restrooms, offices, shipping/receiving areas, and anywhere workers cross forklift paths." },
      { type: "key_takeaways", items: [
        "Pedestrians always have the right of way",
        "Make eye contact before proceeding near people",
        "Sound the horn as a warning, not a demand",
        "Be extra alert near break rooms, offices, and crossing areas",
      ] },
    ]),
  },
  {
    module: "Safe Driving & Pedestrians",
    title: "Direction Changes and Smooth Handling",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      { type: "heading", level: 2, text: "Direction Changes and Smooth Handling" },
      { type: "heading", level: 3, text: "Complete Stop Before Direction Change" },
      { type: "paragraph", html: "Always come to a <strong>complete stop</strong> before changing from forward to reverse or vice versa. Abrupt direction changes can cause loads to shift or fall, and increase tip-over risk." },
      { type: "heading", level: 3, text: "Smooth Movements" },
      { type: "paragraph", html: "Smooth acceleration, braking, and steering prevent load shifts, spills, and tip-overs. Jerky movements are the enemy of stability." },
      { type: "heading", level: 3, text: "Do Not Accelerate While Turning" },
      { type: "paragraph", html: "Accelerating during a turn significantly increases the risk of tipping. The unique weight distribution of a forklift, combined with a heavy load, makes it easy to lose control if not handled carefully." },
      { type: "key_takeaways", items: [
        "Come to a complete stop before changing direction",
        "Smooth acceleration and braking prevent load shifts",
        "Never accelerate while turning",
        "Jerky movements increase tip-over risk",
      ] },
    ]),
  },
  // ═══ MODULE 5: Ramps, Docks, Trailers, and Elevated Work ═══
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Ramps and Slopes",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Ramps and Slopes"
      },
      {"type": "technical_diagram", "kind": "ramps"},
      {
        "type": "heading",
        "level": 3,
        "text": "Loaded Travel on Ramps"
      },
      {
        "type": "paragraph",
        "html": "When traveling on a ramp <strong>with a load</strong>: keep the load pointed <strong>uphill</strong> (upgrade). This means driving forward up a ramp and in reverse down a ramp when loaded."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Unloaded Travel on Ramps"
      },
      {
        "type": "paragraph",
        "html": "When traveling on a ramp <strong>without a load</strong>: the forks should point <strong>downhill</strong> (downgrade)."
      },
      {
        "type": "scenario",
        "title": "Ramp Decision",
        "prompt": "You picked up a full pallet on the upper level and need to take it DOWN the ramp to ground level. What is the correct way to descend?",
        "choices": [
          {
            "text": "Drive forward down the ramp — you can see better",
            "correct": false,
            "feedback": "With the load pointed downhill, gravity pulls the pallet off the forks and the combined center of gravity shifts toward the front axle — a recipe for losing the load or tipping."
          },
          {
            "text": "Back down the ramp so the load stays pointed uphill",
            "correct": true,
            "feedback": "Correct. Loaded on a ramp = load always points upgrade. Going down, that means traveling in reverse, slowly, looking over your shoulder or using a spotter."
          },
          {
            "text": "Turn around halfway down to face the load uphill",
            "correct": false,
            "feedback": "Never turn on a ramp. Turning shifts the center of gravity sideways on an incline — this is one of the highest tip-over-risk maneuvers possible."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Ramp Safety Rules"
      },
      {
        "type": "list",
        "items": [
          "Ascend and descend slowly",
          "On steep grades (>10%), travel with load upgrade",
          "Tilt load back slightly for stability",
          "<strong>Never turn on a ramp</strong> — the risk of tip-over is extremely high",
          "Never park on a ramp unless absolutely necessary (chock wheels if you must)"
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Turning on a ramp dramatically increases tip-over risk. Always travel straight up or down."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Check the truck’s slope limit"
      },
      {
        "type": "paragraph",
        "html": "These directions describe conventional counterbalanced forklifts. Some trucks are restricted to level floors; attachments can change the unloaded condition. Follow the manual and your equipment-specific training. Travel straight, never turn across a slope, and raise forks only enough to clear the surface. Tilt back if applicable. A blocked view requires a safe plan, not a raised load."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Loaded: keep load pointed uphill (upgrade)",
          "Unloaded: forks pointed downhill (downgrade)",
          "Never turn on a ramp — extreme tip-over risk",
          "Travel slowly and tilt the load back slightly"
        ]
      }
    ]),
  },
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Docks and Trailer Safety",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Docks and Trailer Safety"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Stop before the dock"
      },
      {
        "type": "list",
        "items": [
          "Verify trailer brakes and wheel chocks or an employer-approved restraint procedure that meets applicable requirements. Confirm that departure is prevented.",
          "Check trailer floor strength and condition. An uncoupled trailer may need fixed jacks to prevent tipping.",
          "Use a secured dockboard rated for the combined truck, load and operator weight. Confirm support and overhead clearance.",
          "Enter straight and slowly. Stay a safe distance from edges, watch for movement or a growing gap, and stop if anything shifts."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Load distribution"
      },
      {
        "type": "paragraph",
        "html": "Follow the trailer, rack and loading plan capacity limits. Distribute weight as the plan specifies; do not assume the heaviest item always belongs at the rear. Keep people clear. Never use a forklift to open or close freight doors."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Secure the trailer and verify the full load path before entry.",
          "A dockboard rating includes the truck, not just the pallet."
        ]
      }
    ]),
  },
  {
    module: "Ramps, Docks & Elevated Work",
    title: "Lifting People and Elevated Work",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Lifting People and Elevated Work"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Use equipment intended for people"
      },
      {
        "type": "paragraph",
        "html": "Never lift anyone on bare forks, a pallet or a makeshift platform. Do not treat a personnel platform as an exception allowing passengers during travel."
      },
      {
        "type": "paragraph",
        "html": "Personnel lifting requires an authorized truck/platform combination, manufacturer instructions and applicable fall-protection requirements. Guardrails or a harness alone do not make an improvised platform acceptable. Ask the qualified supervisor to select the proper equipment and plan."
      },
      {
        "type": "list",
        "items": [
          "Keep people clear of the mast, crush points and overhead electrical hazards.",
          "Stay at the controls and maintain communication as required by the approved procedure.",
          "Do not drive to another location with a person elevated. Lower the platform before relocation."
        ]
      },
      {
        "type": "key_takeaways",
        "items": [
          "No bare forks, pallets or improvised platforms for people.",
          "This operator course does not qualify you to improvise a personnel lift."
        ]
      }
    ]),
  },
  // ═══ MODULE 6: Parking, Unattended Forklift, and Shutdown ═══
  {
    module: "Parking & Shutdown",
    title: "Parking and Securing the Forklift",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      { type: "heading", level: 2, text: "Parking and Securing the Forklift" },
      { type: "heading", level: 3, text: "Parking Procedure" },
      { type: "paragraph", html: "Every shutdown follows the same sequence. Put the steps in order — you will do this at the end of every shift for the rest of your career." },
      { type: "drag_drop", mode: "ordering",
        prompt: "Arrange the parking procedure steps in the correct order.",
        items: [
          { id: "p1", label: "Lower forks completely flat to the ground" },
          { id: "p2", label: "Tilt forks slightly forward" },
          { id: "p3", label: "Set the parking brake" },
          { id: "p4", label: "Neutralize all controls" },
          { id: "p5", label: "Turn off the engine / power" },
          { id: "p6", label: "Remove the key" },
        ] },
      { type: "heading", level: 3, text: "Parking Location" },
      { type: "paragraph", html: "Park only in <strong>designated areas</strong>. Never block fire exits, emergency equipment, or traffic lanes. If parking on an incline, chock the wheels." },
      { type: "key_takeaways", items: [
        "Lower forks, set brake, neutralize controls, turn off engine, remove key",
        "Park only in designated areas",
        "Never block fire exits or emergency equipment",
        "Chock wheels if parking on an incline",
      ] },
    ]),
  },
  {
    module: "Parking & Shutdown",
    title: "Unattended Forklift Definition",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Unattended Forklift: When and What To Do"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Unattended means either condition"
      },
      {
        "type": "paragraph",
        "html": "A truck is <strong>unattended when you are 25 feet or more away while it remains in view, OR whenever it is out of your view</strong>. Either condition is enough."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Before leaving it unattended"
      },
      {
        "type": "list",
        "items": [
          "Fully lower forks/load-engaging means.",
          "Neutralize controls, shut off power and set brakes.",
          "Block the wheels if parked on an incline. Follow the site procedure for key removal and preventing unauthorized use."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Nearby and still in view"
      },
      {
        "type": "paragraph",
        "html": "If you dismount but remain less than 25 feet away with the truck in view, fully lower forks, neutralize controls and set brakes. Follow any stricter site shutdown rule."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Try the rule"
      },
      {
        "type": "paragraph",
        "html": "You step behind a rack ten feet away and cannot see the truck. It is unattended: distance does not cancel the out-of-view rule. Report all accidents and near-misses, even when nobody is injured."
      },
      {
        "type": "key_takeaways",
        "items": [
          "25 feet or more away OR out of view: unattended.",
          "Lower forks and secure the truck even for a brief stop."
        ]
      }
    ]),
  },
  {
    module: "Parking & Shutdown",
    title: "Knowledge Check: Safe Operation & Shutdown",
    type: "checkpoint",
    estimatedMinutes: 3,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Pedestrians always have the right of way around forklifts.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Pedestrians always have priority. Operators must yield to pedestrians at all times." },
      { question: "When approaching an intersection, you should:", type: "mcq_single", options: ["Speed up to clear it quickly", "Stop, sound horn, and look both ways", "Flash your headlights", "Assume no one is coming"], correctAnswers: "Stop, sound horn, and look both ways", explanation: "Operators must slow down/stop, sound the horn, and look before proceeding through any intersection." },
      { question: "When traveling UP a ramp with a load, the load should face:", type: "mcq_single", options: ["Downhill", "Uphill", "It doesn't matter", "Sideways"], correctAnswers: "Uphill", explanation: "When traveling on a ramp with a load, keep the load pointed uphill (upgrade) to prevent the load from sliding off the forks." },
    ],
  },

  // ═══ MODULE 7: Site-Specific Rules + Employer Packet ═══
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "Site-Specific Training Matters",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Site-Specific Training Matters"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Every Workplace Is Different"
      },
      {
        "type": "paragraph",
        "html": "Every worksite has unique hazards: narrow aisles, specific pedestrian traffic patterns, loading docks, racking configurations, cold storage areas, outdoor areas, and more. Your supervisor must review <strong>site-specific policies</strong> with you before you operate at any new location."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Site-Specific Topics"
      },
      {
        "type": "list",
        "items": [
          "Facility speed limits and traffic patterns",
          "Designated parking and charging areas",
          "Pedestrian zones and crossings",
          "Emergency procedures and assembly points",
          "Communication protocols (radio, signals)",
          "Specific equipment types and attachments used"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "What Your Employer Owes You"
      },
      {
        "type": "paragraph",
        "html": "OSHA puts specific duties on your employer. Flip each card to see what they are responsible for."
      },
      {
        "type": "flip_cards",
        "title": "Employer Responsibilities",
        "cards": [
          {
            "front": "Practical Training",
            "back": "Hands-on training on the specific equipment you will operate, at the actual worksite, before you work solo."
          },
          {
            "front": "Evaluation",
            "back": "A supervisor or qualified trainer must watch you operate and formally sign off on your competence."
          },
          {
            "front": "Documentation",
            "back": "Signed evaluation forms, permits, and attendance records kept on file — OSHA can request them during inspections."
          },
          {
            "front": "Refresher Training",
            "back": "Required after an accident or near-miss, when unsafe operation is observed, or when you move to new equipment or a new facility."
          },
          {
            "front": "Re-Evaluation",
            "back": "At least every 3 years, your employer must re-evaluate your performance to keep your certification current."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Hazardous atmospheres and ventilation"
      },
      {
        "type": "paragraph",
        "html": "LPG is not automatically safe indoors. Carbon monoxide and diesel exhaust can accumulate; carbon monoxide has no warning odor. Use only the truck type and ventilation approved for the area. If an alarm activates or you develop headache, dizziness or nausea, stop safely, leave for fresh air and follow the emergency plan. Do not rely on an open door alone."
      },
      {
        "type": "paragraph",
        "html": "Flammable vapor, combustible dust and fibers can require specially designated trucks under 1910.178(c). The E/EX/LP designations are different from the seven truck classes. Do not enter a classified area until the employer confirms the truck is suitable."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Walk the job with your evaluator"
      },
      {
        "type": "list",
        "items": [
          "Identify surfaces, slopes, dock edges, tight aisles, overhead obstacles, lighting and weather hazards.",
          "Review actual load weights, stacking heights, rack limits, pedestrian routes and restricted areas.",
          "Practice the controls, attachment and emergency procedure on the actual truck. Stop when conditions exceed its limits.",
          "Demonstrate inspection, travel, load handling and shutdown. Ask questions in a language you understand; a written test alone cannot demonstrate safe operation."
        ]
      },
      {"type": "scenario", "title": "Stop or go?", "prompt": "An LPG truck is available, but the enclosed room has poor ventilation and an exhaust alarm. What do you do?", "choices": [{"text": "Stop, leave the affected area safely and report it; use only an approved safe plan.", "correct": true, "feedback": "Correct. Fuel choice alone does not make an enclosed area safe."}, {"text": "Open a door and continue without checking.", "correct": false, "feedback": "An open door does not prove safe air. Follow the emergency and ventilation procedure."}]},
      {
        "type": "key_takeaways",
        "items": [
          "Every workplace has unique hazards that require site-specific training",
          "Your supervisor must review site policies before you operate",
          "Additional training is required for new equipment or facilities",
          "After accidents or observed unsafe behavior, retraining is required"
        ]
      }
    ]),
  },
  // Consolidated from three separate download steps into one to reduce
  // click-throughs before the final exam (2026-07-16). Same files, same URLs.
  {
    module: "Site-Specific Rules & Employer Packet",
    title: "Employer Packet & Reference Documents",
    type: "download",
    estimatedMinutes: 2,
    config: {
      description: "Your employer must complete a hands-on evaluation before you can operate a forklift at their facility. Provide the first three forms to your supervisor: the performance evaluation checklist, operator permit/authorization form, and site attendance sheet. Use the current OSHA standard and the truck manual for operating requirements; older presentation slides may conflict with current guidance.",
      downloads: [
        { label: "Performance Test (PDF)", url: "/api/documents/performance-evaluation/download", filename: "PERFORMANCE-TEST.pdf" },
        { label: "PIT Permit to Operate (PDF)", url: "/api/documents/operator-permit/download", filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf" },
        { label: "Attendance Form & Scheduling (PDF)", url: "/api/documents/attendance-sheet/download", filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf" },
      ],
      important: "Have your supervisor complete these forms and keep them on file. OSHA may request these records during inspections.",
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
      // 2026-09-03 (Alberto): exam replaced with the legacy site's question set
      // (same 27 questions Peter sent from training.miramarforklift.com), in a new
      // order. Two new-site-only questions were dropped per Alberto's direction
      // (obscure CFR standard number; OSHA fine amount).
      { question: "It is permissible to run over a loose object on the floor as long as the truck is not fully loaded.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "Never run over loose objects. Debris on the floor can destabilize the load or the truck and cause a tip-over or lost load." },
      {"question": "On a clear, level floor, how should you carry the load while traveling?", "type": "mcq_single", "options": ["High enough to see underneath", "Low, with only the clearance needed under the manual", "At eye level"], "correctAnswers": "Low, with only the clearance needed under the manual", "explanation": "Keep the load low; typically 4 to 6 inches on level surfaces, subject to the truck manual and surface clearance."},
      { question: "Only trained and authorized workers can operate a forklift.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "OSHA requires every operator to be trained and authorized by their employer before operating a powered industrial truck." },
      { question: "How soon should repairs be made to a forklift with a safety defect?", type: "mcq_single", options: ["At the next scheduled maintenance time", "As soon as you have availability to schedule it", "Before the unit is used"], correctAnswers: "Before the unit is used", explanation: "A forklift with a safety defect must be taken out of service and repaired before it is used again." },
      { question: "It is very easy to tip over on ramps and sloped surfaces whether the forklift is loaded or unloaded.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Ramps and slopes shift the center of gravity. Always travel straight up or down, slowly, and never turn on a ramp." },
      {"question": "If an aisle is empty, you may exceed the posted site speed limit.", "type": "mcq_single", "options": ["True", "False"], "correctAnswers": "False", "explanation": "Observe the posted limit and slow further when conditions require more stopping distance."},
      { question: "Added attachments and equipment have no effect on forklift capacity.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "Attachments change the center of gravity and REDUCE the rated capacity. Always check the adjusted capacity on the data plate." },
      { question: "When changing direction (example: forward to reverse), it is safest to:", type: "mcq_single", options: ["Slow down to about 1 mph", "Come to a complete stop", "Change direction at any speed"], correctAnswers: "Come to a complete stop", explanation: "Always come to a complete stop before changing direction. Abrupt direction changes can shift or spill the load." },
      {"question": "Unauthorized passengers may ride if they wear a harness.", "type": "mcq_single", "options": ["True", "False"], "correctAnswers": "False", "explanation": "A harness does not authorize passengers or make an improvised platform safe."},
      {"question": "Operator training requires:", "type": "mcq_single", "options": ["Formal instruction", "Practical training", "Evaluation of performance in the workplace", "All of the above"], "correctAnswers": "All of the above", "explanation": "All three parts are required; an online test cannot replace practice or workplace evaluation."},
      { question: "Excessive load tilting or sudden changes of direction can result in an overturned forklift and/or a spilled load.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Sudden movements shift the load and the center of gravity. Operate smoothly: no abrupt tilting, turning, or braking." },
      { question: "The forklift horn should be used to:", type: "mcq_single", options: ["Let everyone know you have the right of way", "Warn pedestrians and other traffic at intersections and blind spots", "Make workers get out of your path when you get too close"], correctAnswers: "Warn pedestrians and other traffic at intersections and blind spots", explanation: "The horn is a warning device, not a demand for right-of-way. Sound it at intersections, blind corners, and doorways." },
      { question: "If you wish to lift a load heavier than the forklift's capacity, have fellow employees stand on the counterweight.", type: "mcq_single", options: ["True", "False"], correctAnswers: "False", explanation: "Never use people as counterweight. If the load exceeds rated capacity, use a higher-capacity truck." },
      {"question": "You may lift a worker on bare forks if they ask you to.", "type": "mcq_single", "options": ["True", "False"], "correctAnswers": "False", "explanation": "Never lift people on bare forks or pallets. Use authorized equipment and the applicable personnel-lifting procedure."},
      { question: "What should you do when you approach an intersection?", type: "mcq_single", options: ["Slow down and sound the horn", "Check for hazards by leaning out of the cab", "Get through as quickly as possible"], correctAnswers: "Slow down and sound the horn", explanation: "At every intersection: slow down, sound the horn, and look both ways. Never lean outside the protective cage." },
      { question: "A forklift operator must keep all portions of their body inside the running lines of the safety cage at all times.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Keep your entire body inside the protective cage. Extending an arm or leg outside creates a crush hazard with the mast and surroundings." },
      {"question": "You are ten feet away, but a rack blocks your view of the truck. What applies?", "type": "mcq_single", "options": ["It is attended because you are nearby", "It is unattended: lower forks, neutralize controls, shut off power and set brakes", "Sounding the horn is enough"], "correctAnswers": "It is unattended: lower forks, neutralize controls, shut off power and set brakes", "explanation": "Out of view means unattended at any distance. Block wheels on inclines and follow the site key-removal rule."},
      { question: "All accidents or injuries, even small ones, must be reported to a supervisor immediately.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Report every accident, injury, and near-miss immediately, no matter how small. It protects you and fixes hazards before someone is seriously hurt." },
      { question: "Who has the right of way?", type: "mcq_single", options: ["Forklift in the main aisle", "Pedestrian", "Any forklift approaching from the right"], correctAnswers: "Pedestrian", explanation: "Pedestrians always have the right of way. Stop, make eye contact, and proceed only when they are clear." },
      {"question": "Smoking in a battery-charging area is allowed if you cannot smell gas.", "type": "mcq_single", "options": ["True", "False"], "correctAnswers": "False", "explanation": "No smoking, flames or sparks. Hydrogen can accumulate without a warning odor."},
      { question: "It is necessary for every forklift operator to know the load capacity of the forklift to which they are assigned.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Know your machine's rated capacity before you lift anything. It is on the data plate and it is your legal lifting limit." },
      {"question": "On a grade, how should the forks and load be positioned when tilt is applicable?", "type": "mcq_single", "options": ["As high as possible", "Tilted back, raised only enough to clear the surface", "Tilted forward when descending"], "correctAnswers": "Tilted back, raised only enough to clear the surface", "explanation": "Follow the truck manual and limits. Do not raise farther than necessary or apply tilt instructions to a design without that function."},
      { question: "When changing an LPG gas tank, operators should wear gloves.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Liquid propane causes frostbite on contact. Always wear gloves when handling LPG tanks." },
      { question: "Before making turns, a driver should slow down to prevent the equipment from turning over and to avoid spilling the load.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Slow down before the turn, not during it. Turning at speed shifts the center of gravity sideways and is a top tip-over cause." },
      { question: "Should the load capacity of a forklift ever be exceeded?", type: "mcq_single", options: ["Whenever there is sufficient clearance", "Never", "Whenever it improves your visibility"], correctAnswers: "Never", explanation: "Never exceed rated capacity, for any reason. Overloading is the primary cause of tip-overs." },
      { question: "As an operator, it is your responsibility to obey all company safety regulations and procedures, even if you are really busy.", type: "mcq_single", options: ["True", "False"], correctAnswers: "True", explanation: "Safety rules apply at all times, especially under pressure. Shortcuts around safety procedures cause accidents." },
      { question: "As a forklift operator:", type: "mcq_single", options: ["It is your responsibility to alert pedestrians of your presence using your horn and to make sure they are clear of your path", "It is the pedestrian's responsibility to stay out of the way after you have beeped your horn to let them know you are coming", "It is management's responsibility to keep pedestrians out of your work area"], correctAnswers: "It is your responsibility to alert pedestrians of your presence using your horn and to make sure they are clear of your path", explanation: "The operator owns pedestrian safety: warn with the horn, make eye contact, and verify the path is clear before moving." },
      // 2026-09-13 (Alberto): two harder questions to cut down on easy 100%
      // scores. Both are OSHA-accurate but trip up operators who pattern-match
      // the "obvious" answer instead of reasoning about the stability triangle.
      {"question": "The plate lists 5,000 lb at a 24-inch load center. Your 4,800 lb load has a 36-inch load center. What should you do?", "type": "mcq_single", "options": ["Lift because it weighs less than 5,000 lb", "Stop and verify plate/manufacturer capacity for that configuration", "Tilt fully back to increase capacity", "Add counterweight"], "correctAnswers": "Stop and verify plate/manufacturer capacity for that configuration", "explanation": "A longer load center can reduce capacity. The 24-inch rating does not authorize the lift at 36 inches; do not invent a safe capacity."},
      { question: "You are driving an UNLOADED forklift down a ramp. Which way should the forks point, and why?", type: "mcq_single", options: ["Uphill — same rule as a loaded truck", "Downhill — an unloaded truck's weight is over the rear, so forks point downgrade to keep the center of gravity stable", "It doesn't matter when the truck is empty", "Uphill — so you can see over the mast"], correctAnswers: "Downhill — an unloaded truck's weight is over the rear, so forks point downgrade to keep the center of gravity stable", explanation: "Loaded trucks travel with the load upgrade, but an UNLOADED truck is the opposite: with no load, the heavy counterweight is at the rear, so the forks point downhill. Mixing these two up is a common and dangerous mistake." },
    ],
  },
  {
    module: "Final Exam & Completion",
    title: "Congratulations: What's Next",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      { type: "heading", level: 2, text: "Formal Instruction Complete: What's Next" },
      { type: "heading", level: 3, text: "Your Certificate" },
      { type: "paragraph", html: "Congratulations on completing the formal instruction portion of your forklift operator certification! Your formal-instruction completion record is available once the course is completed. This is not employer authorization to operate. It includes a unique certificate number and QR code that employers can use for instant verification." },
      { type: "heading", level: 3, text: "Next Step: Practical Evaluation" },
      { type: "paragraph", html: "Remember, your employer must still complete the <strong>hands-on practical evaluation</strong> at your worksite. Share the employer documentation packet (available in Module 7) with your supervisor. It includes:" },
      { type: "list", items: [
        "Performance Evaluation Checklist",
        "Operator Permit / Authorization Form",
        "Site Attendance Sheet",
      ] },
      { type: "heading", level: 3, text: "Your Wallet Card" },
      // 2026-09-03 (Alberto): the card is NOT optional - every completer gets
      // one, shipped within 4-5 business days to the address the crew manager
      // provided at purchase. The paid option is the PHOTO version ($24.99).
      { type: "paragraph", html: "Your operator card will be mailed to the address provided when your training was purchased. Check your photo option below." },
      { type: "heading", level: 3, text: "Stay Safe" },
      { type: "paragraph", html: "Your training doesn't end here. Continue to follow safe operating procedures every day. If you ever have questions or need a refresher, you can revisit this course at any time. Stay safe out there!" },
      { type: "callout", variant: "tip", text: "Bookmark your verification page link — employers can use it to instantly verify your certification." },
      { type: "key_takeaways", items: [
        "Download your certificate from your certification page",
        "Share the employer packet with your supervisor for practical evaluation",
        "Your wallet card arrives within 4 to 5 business days",
        "Re-evaluation is required at least every 3 years",
      ] },
    ]),
  },
];
