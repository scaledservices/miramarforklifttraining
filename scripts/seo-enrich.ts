import { pool } from "../server/db";
import { storage } from "../server/storage";

const STATE_CONTEXT: Record<string, { economy: string; industries: string; facts: string }> = {
  "California": { economy: "California boasts the largest state economy in the U.S. and the fifth-largest economy in the world. The state's massive ports in Los Angeles and Long Beach handle over 40% of all imported goods entering the country, creating enormous demand for certified forklift operators.", industries: "major industries including agricultural production in the Central Valley, technology manufacturing in Silicon Valley, entertainment production in Hollywood, and an extensive network of distribution centers serving the state's 39 million residents", facts: "California's Division of Occupational Safety and Health (Cal/OSHA) enforces workplace safety standards that meet or exceed federal OSHA requirements" },
  "Texas": { economy: "Texas is the second-largest state economy, powered by energy, agriculture, technology, and a booming logistics sector. The state's central location makes it a critical distribution hub, with major intermodal facilities in Dallas-Fort Worth, Houston, and San Antonio.", industries: "oil and gas operations, petrochemical manufacturing, agricultural processing, defense contracting, and rapidly expanding e-commerce fulfillment centers across the Dallas-Fort Worth metroplex and Houston metropolitan area", facts: "Texas follows federal OSHA standards for forklift operations and has seen significant growth in warehouse construction, adding over 200 million square feet of industrial space in recent years" },
  "New York": { economy: "New York's economy is driven by finance, healthcare, technology, and a massive distribution network serving the tri-state area. The state's position as a gateway for international trade creates consistent demand for qualified forklift operators.", industries: "pharmaceutical distribution, food service logistics, garment district warehousing, construction material supply chains, and the expansive network of distribution centers serving New York City's 8+ million residents", facts: "New York State follows federal OSHA standards and has some of the highest concentrations of warehouse employment in the northeast corridor" },
  "Florida": { economy: "Florida's economy thrives on tourism, agriculture, international trade, and a growing technology sector. The state's extensive coastline and multiple deep-water ports make it a critical entry point for Caribbean and South American trade.", industries: "cruise line and hospitality supply chains, citrus and agricultural processing, aerospace manufacturing, healthcare distribution, and the rapidly growing e-commerce fulfillment sector serving the state's 22+ million residents", facts: "Florida follows federal OSHA workplace safety standards and has experienced significant industrial growth, particularly in the Interstate 4 corridor between Tampa and Orlando" },
  "Illinois": { economy: "Illinois serves as the transportation and logistics hub of the Midwest. Chicago's O'Hare International Airport, extensive rail network, and Great Lakes shipping access make the state central to national supply chain operations.", industries: "food processing and distribution, agricultural equipment manufacturing, pharmaceutical logistics, automotive parts supply chains, and the dense network of warehouses and distribution centers concentrated in the Chicago metropolitan area", facts: "Illinois follows federal OSHA standards and hosts one of the largest concentrations of warehouse and logistics employment in the nation, centered around the Chicago suburbs of Will and DuPage counties" },
  "Pennsylvania": { economy: "Pennsylvania's strategic location between the Northeast Corridor and the Midwest makes it a prime logistics hub. The state's well-developed transportation infrastructure includes major interstate highways, rail yards, and the Port of Philadelphia.", industries: "pharmaceutical manufacturing and distribution, steel production, food processing, energy sector operations, and a growing network of e-commerce fulfillment centers in the Lehigh Valley and central Pennsylvania regions", facts: "Pennsylvania follows federal OSHA standards and has seen significant warehouse development along the Interstate 78 corridor, attracting major distribution operations" },
  "Ohio": { economy: "Ohio's central location and extensive highway system make it accessible to over 60% of the U.S. and Canadian population within a one-day drive. This geographic advantage has made Ohio a critical distribution hub for national retailers.", industries: "automotive manufacturing, steel production, chemical processing, food and beverage distribution, and a rapidly expanding network of fulfillment centers serving the e-commerce boom across the Midwest", facts: "Ohio follows federal OSHA workplace safety standards and has consistently ranked among the top states for warehouse employment growth" },
  "Georgia": { economy: "Georgia, anchored by Atlanta, serves as the economic engine of the Southeast. The Port of Savannah is the fastest-growing container port in the nation, and Hartsfield-Jackson Atlanta International Airport is the world's busiest airport.", industries: "logistics and distribution, food processing, automotive manufacturing, film and entertainment production, and the extensive warehousing network along the Interstate 85 corridor between Atlanta and Savannah", facts: "Georgia follows federal OSHA standards and has invested heavily in logistics infrastructure, making it one of the fastest-growing states for warehouse employment" },
  "Michigan": { economy: "Michigan's economy is anchored by the automotive industry, with most major U.S. automakers maintaining significant manufacturing operations in the state. The state's Great Lakes access also supports shipping and heavy industry.", industries: "automotive manufacturing and parts supply chains, food processing, pharmaceutical production, furniture manufacturing, and the logistics operations supporting just-in-time automotive supply chains throughout the state", facts: "Michigan follows federal OSHA standards and requires forklift operators across its automotive supply chain to maintain current certifications due to the industry's strict safety requirements" },
  "Washington": { economy: "Washington State's economy is driven by technology, aerospace, agriculture, and international trade through the ports of Seattle and Tacoma. The state's Amazon headquarters has made it a center for e-commerce logistics innovation.", industries: "aerospace manufacturing at Boeing facilities, technology company fulfillment operations, agricultural export processing, timber industry operations, and the extensive network of distribution centers in the Puget Sound region", facts: "Washington State has its own occupational safety division (WISHA/DOSH) that enforces standards meeting or exceeding federal OSHA requirements for forklift operations" },
};

const CITY_CONTEXT: Record<string, { economy: string; industries: string; employers: string }> = {
  "Los Angeles": { economy: "Los Angeles is home to the largest port complex in the Western Hemisphere. The ports of Los Angeles and Long Beach handle approximately 40% of all containerized cargo entering the United States, creating massive demand for certified forklift operators across the region's sprawling network of warehouses and distribution centers.", industries: "port logistics and container operations, entertainment production and studio warehousing, garment district distribution, food processing and cold storage, aerospace component manufacturing", employers: "Major employers requiring certified operators include Amazon, FedEx, UPS, and hundreds of third-party logistics providers operating in the Inland Empire region" },
  "Houston": { economy: "Houston's economy is driven by the energy sector, the Texas Medical Center (the world's largest), and one of the nation's busiest port systems. The Houston Ship Channel supports extensive industrial operations requiring skilled forklift operators.", industries: "petrochemical manufacturing and distribution, medical supply logistics, energy sector equipment handling, food processing, construction material distribution", employers: "Energy companies, medical distribution centers, and construction supply operations throughout the Greater Houston area regularly seek certified forklift operators" },
  "Chicago": { economy: "Chicago is the rail hub of North America, with more rail lines converging in the city than anywhere else on the continent. This transportation advantage, combined with O'Hare Airport's massive cargo operations, makes Chicago one of the nation's most important logistics centers.", industries: "intermodal rail operations, food processing and distribution, manufacturing logistics, e-commerce fulfillment, cold storage operations", employers: "Major logistics operations in the Chicago suburbs of Joliet, Romeoville, and Elgin employ thousands of certified forklift operators in facilities serving national distribution networks" },
  "Phoenix": { economy: "Phoenix has emerged as a major distribution hub for the Southwest United States. The city's central location, available land for warehouse development, and growing population have attracted significant investment in logistics infrastructure.", industries: "e-commerce fulfillment, semiconductor manufacturing, food and beverage distribution, construction material supply, aerospace component logistics", employers: "Companies like Intel, Amazon, Kroger, and numerous third-party logistics providers operate large distribution facilities in the Greater Phoenix area" },
  "Dallas": { economy: "Dallas-Fort Worth is one of the fastest-growing metropolitan areas in the country and serves as a major distribution hub for the southern United States. The area's central location and extensive transportation infrastructure support a massive logistics industry.", industries: "e-commerce fulfillment, food distribution, telecommunications equipment handling, aerospace parts logistics, retail distribution", employers: "The DFW metroplex hosts distribution centers for major retailers, technology companies, and food service operations, creating consistent demand for certified operators" },
  "Atlanta": { economy: "Atlanta is the commercial capital of the Southeast, with the busiest airport in the world and a strategic location at the intersection of three major interstate highways. The city's logistics sector continues to expand rapidly.", industries: "air cargo operations, beverage manufacturing and distribution, automotive parts logistics, healthcare supply chain, film production equipment handling", employers: "Atlanta's warehouse and distribution sector serves as a regional hub for companies distributing products throughout the southeastern United States" },
  "Seattle": { economy: "Seattle's economy is anchored by technology giants including Amazon and Microsoft, along with Boeing's aerospace operations. The Port of Seattle is a major gateway for Pacific Rim trade, supporting extensive logistics operations.", industries: "e-commerce fulfillment and innovation, aerospace manufacturing, tech company warehouse operations, maritime cargo handling, agricultural export processing", employers: "Amazon's extensive fulfillment network, Boeing's manufacturing facilities, and Port of Seattle operations create strong demand for certified forklift operators" },
  "Denver": { economy: "Denver's mile-high location and central position make it a natural distribution hub for the Mountain West region. The city's growing population and expanding industrial base continue to drive demand for warehouse workers.", industries: "natural products and outdoor recreation equipment distribution, craft beverage manufacturing, cannabis industry logistics, construction material supply, e-commerce fulfillment", employers: "Denver's distribution corridor along Interstate 70 hosts major fulfillment centers and regional distribution operations serving the western United States" },
  "Miami": { economy: "Miami is the gateway to Latin America and the Caribbean, with extensive international trade operations. The Port of Miami and Miami International Airport handle billions of dollars in cargo annually, supporting a large logistics workforce.", industries: "international trade and customs operations, cruise line supply logistics, perishable food import/export, pharmaceutical distribution, construction material handling", employers: "Miami's position as a trade gateway creates unique demand for bilingual certified forklift operators in international logistics operations" },
  "San Diego": { economy: "San Diego's economy is driven by defense, biotechnology, telecommunications, and international trade with Mexico. The region's proximity to the border creates unique cross-border logistics operations.", industries: "defense and military logistics, biotechnology manufacturing, telecommunications equipment handling, cross-border trade operations, craft beverage production", employers: "Military installations, biotech firms, and cross-border logistics companies in the San Diego area regularly require certified forklift operators" },
};

function getStateContext(state: string): { economy: string; industries: string; facts: string } {
  if (STATE_CONTEXT[state]) return STATE_CONTEXT[state];
  return {
    economy: `${state}'s economy supports a diverse range of industries that rely on skilled forklift operators for safe and efficient material handling operations throughout the state.`,
    industries: `warehousing and distribution, manufacturing, construction, agricultural operations, and retail logistics operations that serve ${state}'s communities`,
    facts: `${state} follows federal OSHA workplace safety standards for forklift operations, requiring all operators to be properly trained and certified under 29 CFR 1910.178`,
  };
}

function getCityContext(city: string, state: string): { economy: string; industries: string; employers: string } {
  if (CITY_CONTEXT[city]) return CITY_CONTEXT[city];
  return {
    economy: `${city} is an important economic center in ${state}, with growing demand for certified forklift operators across multiple industries. The ${city} metropolitan area supports warehousing, distribution, and manufacturing operations that form a critical part of the regional economy.`,
    industries: `warehousing and distribution, retail logistics, construction material handling, food and beverage processing, and general manufacturing operations serving the ${city} area`,
    employers: `Employers throughout the ${city} area, including distribution centers, manufacturing facilities, and construction companies, seek operators with current OSHA-compliant forklift certification`,
  };
}

async function enrichPages() {
  console.log("[SEO Enrich] Starting content enrichment...");

  const allPages = await storage.listAllSeoPages();
  let enriched = 0;

  for (const page of allPages) {
    if (!page.canonicalSlug) {
      await storage.updateSeoPage(page.id, { canonicalSlug: page.slug });
    }
  }
  console.log("[SEO Enrich] Set self-referential canonicals for all pages");

  const statePages = allPages.filter(p => p.templateKey === "TEMPLATE_LOCATION_STATE");
  for (const page of statePages) {
    if (!page.state) continue;
    const ctx = getStateContext(page.state);
    const citiesInState = allPages.filter(p => p.templateKey === "TEMPLATE_LOCATION_CITY" && p.state === page.state);
    const cityNames = citiesInState.map(c => c.city).filter(Boolean);
    const topCities = cityNames.slice(0, 5).join(", ");
    const cityLinksData = citiesInState.slice(0, 15).map(c => ({ slug: c.slug, label: c.city || c.heroH1 }));

    const newIntro = `Whether you're in ${topCities || "any city in"} ${page.state}, our online forklift certification program is available to you. OSHA Standard 29 CFR 1910.178 is a federal regulation that applies in all 50 states, meaning your certification is recognized by employers throughout ${page.state} and nationwide. ${ctx.economy}`;

    const newBody = [
      {
        type: "rich_text",
        heading: `${page.state} Economy & Forklift Operator Demand`,
        content: `<p>${page.state} has a strong and diverse economy with ${ctx.industries}. These sectors create consistent demand for OSHA-certified forklift operators who can safely handle materials, manage inventory, and support efficient operations.</p><p>${ctx.facts}. Employers in ${page.state} who fail to ensure proper operator training face penalties up to $16,131 per serious violation under federal OSHA enforcement.</p>`,
      },
      {
        type: "icon_list",
        heading: `${page.state} Forklift Training Options`,
        items: [
          `Online certification — available statewide in ${page.state}, start immediately from any location`,
          "Complete the comprehensive 8-module course at your own pace, 24/7 access",
          "Same-day certification upon successful completion of the final exam",
          "Digital certificate with unique QR verification code for employer confirmation",
          `Meets federal OSHA requirements applicable in ${page.state} and all 50 states`,
          "Employer documentation kit included: evaluation checklists, authorization forms, attendance sheets",
        ],
      },
      {
        type: "step_list",
        heading: "How to Get Certified Online",
        steps: [
          { title: "Sign Up & Purchase", description: `Create your account and enroll in the certification course for $59.99. Available to all ${page.state} residents.` },
          { title: "Complete 8 Training Modules", description: "Work through lessons covering pre-operation inspections, load handling, stability, pedestrian safety, parking procedures, and OSHA regulations." },
          { title: "Pass the Final Exam", description: "Score 80% or higher on the certification exam. You get up to 3 attempts and can review materials between tries." },
          { title: "Download Your Certificate", description: "Get your digital certificate immediately. It includes a QR code that employers can scan to verify your certification." },
          { title: "Complete Employer Evaluation", description: `Your ${page.state} employer must conduct a hands-on practical evaluation at your worksite. We provide all the documentation tools they need.` },
        ],
      },
      {
        type: "callout",
        variant: "info",
        heading: `OSHA Compliance in ${page.state}`,
        content: `${ctx.facts}. Our training program covers all topics mandated by 29 CFR 1910.178, providing the formal instruction component of the three-part certification requirement. The remaining components — practical training and evaluation — must be completed by your employer at your specific worksite.`,
      },
      ...(cityLinksData.length > 0 ? [{
        type: "rich_text",
        heading: `Forklift Certification Locations in ${page.state}`,
        content: `<p>We serve forklift operators throughout ${page.state}. Our online program is accessible from any city or town in the state, including ${cityNames.join(", ")}. Select a city below to learn more about forklift certification requirements and local job market information for your area.</p>`,
      }] : []),
    ];

    const newFaqs = [
      { q: `Is forklift certification required in ${page.state}?`, a: `Yes. Federal OSHA Standard 29 CFR 1910.178 requires forklift operator training nationwide, including ${page.state}. Employers must ensure all operators are properly trained and certified before authorizing them to operate powered industrial trucks. ${ctx.facts}.` },
      { q: `How much does forklift certification cost in ${page.state}?`, a: `Our online certification is $59.99 — available to all ${page.state} residents. This is typically less expensive than in-person training programs in ${page.state} which range from $150-$300. The fee includes the full course, certification exam, digital certificate, and employer documentation kit.` },
      { q: `Can I use an online forklift certification in ${page.state}?`, a: `Yes. OSHA does not mandate a specific format for the formal instruction component. Online training is accepted throughout ${page.state} as long as it covers all required topics, which our program does. Your employer must still conduct the hands-on practical evaluation at your worksite.` },
      { q: `What industries hire forklift operators in ${page.state}?`, a: `${page.state} has strong demand for certified forklift operators in ${ctx.industries}. Having your certification ready makes you more competitive in the ${page.state} job market.` },
      { q: `How long is forklift certification valid in ${page.state}?`, a: `OSHA requires re-evaluation of forklift operators at least every three years. This applies in ${page.state} and all other states. Additionally, refresher training is needed after accidents, observed unsafe behavior, or changes in workplace conditions.` },
      { q: `Do I need to renew my forklift certification in ${page.state}?`, a: `Yes. Operators must be re-evaluated at least every three years under federal OSHA standards. If you change jobs, your new employer may require you to complete their site-specific practical evaluation even if your formal instruction certificate is current.` },
    ];

    await storage.updateSeoPage(page.id, {
      introParagraph: newIntro,
      bodySections: newBody,
      faqJson: newFaqs,
      internalLinks: cityLinksData.length > 0 ? cityLinksData : page.internalLinks,
    });
    enriched++;
  }

  const cityPages = allPages.filter(p => p.templateKey === "TEMPLATE_LOCATION_CITY");
  for (const page of cityPages) {
    if (!page.city || !page.state) continue;
    const ctx = getCityContext(page.city, page.state);
    const stateSlug = `forklift-certification-${page.state.toLowerCase().replace(/\s+/g, "-")}`;

    const newIntro = `Looking for forklift certification in ${page.city}? ForkliftCertified offers OSHA-compliant online training that you can complete from anywhere in the ${page.city} metropolitan area. Our comprehensive course covers all required topics under 29 CFR 1910.178, and you can earn your certificate the same day you complete the training. ${ctx.economy}`;

    const newBody = [
      {
        type: "rich_text",
        heading: `${page.city} Forklift Industry & Job Market`,
        content: `<p>${ctx.economy}</p><p>Key industries employing forklift operators in ${page.city} include ${ctx.industries}. ${ctx.employers}.</p>`,
      },
      {
        type: "icon_list",
        heading: `Why Choose Online Certification in ${page.city}?`,
        items: [
          `No need to travel to a training center in ${page.city} — complete your certification from home or office`,
          "Available 24/7 — study at your own pace with no scheduling conflicts",
          "Same OSHA-compliant content as in-person courses at a fraction of the cost ($59.99 vs. $150-$300)",
          `Certificate recognized by all ${page.city} area employers under federal OSHA standards`,
          "Employer documentation kit included for the hands-on evaluation your employer must complete",
          `Lifetime access to course materials for refresher training as required by your ${page.city} employer`,
        ],
      },
      {
        type: "step_list",
        heading: `How to Get Forklift Certified in ${page.city}`,
        steps: [
          { title: "Enroll Online", description: `Sign up from anywhere in ${page.city} and purchase the certification course for $59.99. No travel required.` },
          { title: "Complete 8 Modules", description: "Work through comprehensive lessons covering vehicle inspections, load handling, stability principles, pedestrian safety, and OSHA regulations." },
          { title: "Pass the Exam", description: "Score 80% or higher on the final certification exam. Three attempts included with full course review between tries." },
          { title: "Get Your Certificate", description: "Download your digital certificate with QR verification code immediately upon passing. Employers can verify it instantly." },
          { title: "Employer Practical Evaluation", description: `Your ${page.city} employer completes a hands-on evaluation at your worksite using our documentation forms. This fulfills the final OSHA requirement.` },
        ],
      },
      {
        type: "callout",
        variant: "info",
        heading: `${page.city} OSHA Compliance`,
        content: `Federal OSHA standards apply uniformly across ${page.city} and all of ${page.state}. Our online training fulfills the formal instruction requirement of 29 CFR 1910.178. Your employer is responsible for the remaining two components: practical training and evaluation at your specific ${page.city} worksite.`,
      },
      {
        type: "callout",
        variant: "tip",
        heading: "Career Opportunity",
        content: `Certified forklift operators in the ${page.city} area can earn between $35,000 and $55,000 annually depending on experience, industry, and shift preferences. Having your OSHA-compliant certification ready gives you a competitive advantage in the ${page.city} job market.`,
      },
    ];

    const newFaqs = [
      { q: `Where can I get forklift certified in ${page.city}?`, a: `You can complete your forklift certification online from anywhere in ${page.city}. Our OSHA-compliant program is available 24/7, so you can train at your convenience without traveling to a physical training center.` },
      { q: `How much does forklift certification cost in ${page.city}?`, a: `Our online certification is $59.99 — the same affordable price regardless of your location. In-person training centers in ${page.city} typically charge $150-$300 for comparable OSHA-compliant training.` },
      { q: `Is online forklift certification valid for ${page.city} employers?`, a: `Yes. OSHA certification requirements are federal and apply uniformly. ${page.city} employers accept online formal instruction as part of the three-component certification process required by 29 CFR 1910.178.` },
      { q: `What industries in ${page.city} hire forklift operators?`, a: `${page.city} has demand for certified operators in ${ctx.industries}. ${ctx.employers}.` },
      { q: `How quickly can I get certified in ${page.city}?`, a: `Most students complete our online course in 4-6 hours and receive their certificate the same day. You can start training immediately from your location in ${page.city} — no scheduling or waiting required.` },
      { q: `Can my ${page.city} employer verify my certification?`, a: `Yes. Each certificate includes a unique QR code and verification number. Your ${page.city} employer can scan the QR code or visit our verification page to instantly confirm your certification status, completion date, and expiration date.` },
      { q: `Do ${page.city} employers pay for forklift certification?`, a: `Many ${page.city} employers cover the cost of forklift certification as a business expense. Under OSHA requirements, employers are responsible for providing training at no cost to employees. Check with your employer — they may reimburse you or purchase training directly through our group training program.` },
      { q: `How often do I need to renew my certification in ${page.city}?`, a: `OSHA requires re-evaluation at least every three years, which applies in ${page.city} and throughout ${page.state}. Additional retraining is required after any accidents, near-misses, or observed unsafe operation at your ${page.city} worksite.` },
    ];

    await storage.updateSeoPage(page.id, {
      introParagraph: newIntro,
      bodySections: newBody,
      faqJson: newFaqs,
      internalLinks: [{ slug: stateSlug, label: `All ${page.state} locations` }],
    });
    enriched++;
  }

  console.log(`[SEO Enrich] Enriched ${enriched} pages (${statePages.length} states, ${cityPages.length} cities)`);
  console.log("[SEO Enrich] Set self-referential canonicals for all pages");
  await pool.end();
}

enrichPages().catch((err) => {
  console.error("[SEO Enrich] Fatal error:", err);
  process.exit(1);
});
