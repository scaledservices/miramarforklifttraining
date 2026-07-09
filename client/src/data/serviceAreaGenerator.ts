// Expands compact city facts (serviceAreaCityFacts.ts) into full bilingual
// ServiceAreaCity page content at runtime. Keeping the prose in template
// functions — rather than pre-generating 100+ fully-written entries — keeps
// the bundle small while every page stays city-specific: tier-aware CTAs,
// county/landmark/industry references, and rotating phrasing variants.
//
// Hand-written pages in serviceAreas.ts always override these on slug conflict.

import { CITY_FACTS, type CityFacts, type FacilitySlug } from "./serviceAreaCityFacts";
import type { ServiceAreaCity } from "./serviceAreas";

export const FACILITY_INFO: Record<FacilitySlug, { name: string; address: string; stateAbbrev: string }> = {
  "san-diego": { name: "San Diego", address: "6365 Marindustry Dr #A, San Diego, CA 92121", stateAbbrev: "CA" },
  "las-vegas": { name: "Las Vegas", address: "3301 Martin Ave Suite A, Las Vegas, NV 89118", stateAbbrev: "NV" },
  fresno: { name: "Fresno", address: "3515 N. Sabre Drive, Fresno, CA 93727", stateAbbrev: "CA" },
};

const INDUSTRY_LABELS: Record<string, { en: string; es: string }> = {
  warehousing: { en: "Warehousing & Distribution", es: "Almacenamiento y Distribución" },
  logistics: { en: "Logistics & Freight", es: "Logística y Transporte de Carga" },
  portLogistics: { en: "Port & Intermodal Logistics", es: "Logística Portuaria e Intermodal" },
  manufacturing: { en: "Manufacturing", es: "Manufactura" },
  construction: { en: "Construction & Building Materials", es: "Construcción y Materiales de Construcción" },
  agriculture: { en: "Agriculture & Produce Packing", es: "Agricultura y Empaque de Productos Agrícolas" },
  foodProcessing: { en: "Food & Beverage Processing", es: "Procesamiento de Alimentos y Bebidas" },
  coldStorage: { en: "Cold Storage & Refrigerated Warehousing", es: "Almacenamiento en Frío y Refrigerado" },
  ecommerce: { en: "E-commerce Fulfillment", es: "Cumplimiento de Pedidos de E-commerce" },
  aerospace: { en: "Aerospace & Aviation", es: "Aeroespacial y Aviación" },
  defense: { en: "Military & Defense Contracting", es: "Contratación Militar y de Defensa" },
  biotech: { en: "Biotech & Life Sciences", es: "Biotecnología y Ciencias de la Vida" },
  hospitality: { en: "Hospitality & Event Logistics", es: "Hospitalidad y Logística de Eventos" },
  retail: { en: "Retail & Big-Box Distribution", es: "Comercio Minorista y Distribución" },
  buildingMaterials: { en: "Lumber & Building Materials", es: "Madera y Materiales de Construcción" },
  energy: { en: "Energy & Utilities", es: "Energía y Servicios Públicos" },
};

const REGION_ES: Record<string, string> = {
  "San Diego County": "Condado de San Diego",
  "Southwest Riverside County": "Suroeste del Condado de Riverside",
  "Greater Los Angeles": "Gran Los Ángeles",
  "Antelope Valley": "Valle del Antílope",
  "Orange County": "Condado de Orange",
  "Inland Empire": "Inland Empire",
  "Ventura County": "Condado de Ventura",
  "Central Valley": "Valle Central",
  "Las Vegas Valley": "Valle de Las Vegas",
};

const COUNTY_ES: Record<string, string> = {
  "San Diego County": "el condado de San Diego",
  "Riverside County": "el condado de Riverside",
  "Los Angeles County": "el condado de Los Ángeles",
  "Orange County": "el condado de Orange",
  "San Bernardino County": "el condado de San Bernardino",
  "Ventura County": "el condado de Ventura",
  "Fresno County": "el condado de Fresno",
  "Madera County": "el condado de Madera",
  "Merced County": "el condado de Merced",
  "Tulare County": "el condado de Tulare",
  "Kings County": "el condado de Kings",
  "Kern County": "el condado de Kern",
  "Clark County": "el condado de Clark",
  "Nye County": "el condado de Nye",
};

const STATE_ES: Record<string, string> = { California: "California", Nevada: "Nevada" };

// Deterministic per-city variant selection so phrasing rotates across pages
// without changing between builds.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function pick<T>(slug: string, salt: number, options: T[]): T {
  return options[(hash(slug) + salt) % options.length];
}

function industryList(c: CityFacts, lang: "en" | "es"): string[] {
  return c.industries.map((tag) => INDUSTRY_LABELS[tag]?.[lang] ?? tag);
}

// "the Mira Mesa area of San Diego" vs "Chula Vista"
function placeEn(c: CityFacts): string {
  return c.kind === "district" && c.parentCity ? `the ${c.name} area of ${c.parentCity}` : c.name;
}
function placeEs(c: CityFacts): string {
  return c.kind === "district" && c.parentCity ? `la zona de ${c.name} en ${c.parentCity}` : c.name;
}

function countyEs(c: CityFacts): string {
  return COUNTY_ES[c.county] ?? c.county;
}

const OSHA_BODY: Record<string, { en: string; es: string }> = {
  California: {
    en: "In California, Cal/OSHA enforces the federal OSHA standard 29 CFR 1910.178 for powered industrial trucks",
    es: "En California, Cal/OSHA hace cumplir la norma federal OSHA 29 CFR 1910.178 para vehículos industriales motorizados",
  },
  Nevada: {
    en: "In Nevada, Nevada OSHA (a federally approved state plan) enforces OSHA standard 29 CFR 1910.178 for powered industrial trucks",
    es: "En Nevada, Nevada OSHA (un plan estatal aprobado a nivel federal) hace cumplir la norma OSHA 29 CFR 1910.178 para vehículos industriales motorizados",
  },
};

export function generateServiceAreaCity(c: CityFacts): ServiceAreaCity {
  const fac = FACILITY_INFO[c.facility];
  const indEn = industryList(c, "en");
  const indEs = industryList(c, "es");
  const topIndEn = indEn.slice(0, 2).join(" and ").toLowerCase();
  const topIndEs = indEs.slice(0, 2).join(" y ").toLowerCase();
  const nearby3 = c.nearby.slice(0, 3).join(", ");

  // ── Hero ────────────────────────────────────────────────────────────────
  const heroHeadline =
    c.tier === "facility"
      ? `Forklift Training & Certification in ${c.name}, ${c.stateAbbrev}`
      : `Onsite Forklift Training in ${c.name}, ${c.stateAbbrev}`;
  const heroHeadlineEs =
    c.tier === "facility"
      ? `Capacitación y Certificación de Montacargas en ${c.name}, ${c.stateAbbrev}`
      : `Capacitación de Montacargas en Sitio en ${c.name}, ${c.stateAbbrev}`;

  const heroSubtitle =
    c.tier === "facility"
      ? `Our ${fac.name} training center is about ${c.driveMinutes} minutes from ${placeEn(c)} — get OSHA-aligned, hands-on forklift certification the same day, or we'll bring the training to your facility.`
      : c.tier === "nearby"
        ? `We offer onsite forklift training in ${c.name} — our ${fac.name}-based instructors bring OSHA-aligned certification to your warehouse, jobsite, or facility anywhere in ${c.region}.`
        : `Onsite forklift training is available in ${c.name} and surrounding areas — our instructors travel to your facility with OSHA-aligned certification for your whole crew.`;
  const heroSubtitleEs =
    c.tier === "facility"
      ? `Nuestro centro de capacitación de ${fac.name} está a unos ${c.driveMinutes} minutos de ${placeEs(c)} — obtenga la certificación práctica de montacargas alineada con OSHA el mismo día, o llevamos la capacitación a su instalación.`
      : c.tier === "nearby"
        ? `Ofrecemos capacitación de montacargas en sitio en ${c.name} — nuestros instructores con base en ${fac.name} llevan la certificación alineada con OSHA a su almacén, obra o instalación en cualquier parte de ${REGION_ES[c.region] ?? c.region}.`
        : `La capacitación de montacargas en sitio está disponible en ${c.name} y sus alrededores — nuestros instructores viajan a su instalación con certificación alineada con OSHA para todo su equipo.`;

  // ── SEO ─────────────────────────────────────────────────────────────────
  // Meta descriptions must stay under 160 chars even for long city names —
  // the trailing sentence is dropped when the full version would run over.
  const clamp160 = (full: string, tail: string) =>
    full.length <= 160 ? full : full.slice(0, full.length - tail.length).trimEnd();
  const seo = {
    title: `Forklift Training ${c.name}, ${c.stateAbbrev} | OSHA Certification`,
    description: clamp160(
      `Forklift certification in ${c.name}, ${c.stateAbbrev}. OSHA-aligned onsite training from $200/person, hands-on classes, and a $45 online course. Same-day certificates.`,
      " Same-day certificates.",
    ),
  };
  const seoEs = {
    title: `Capacitación de Montacargas ${c.name}, ${c.stateAbbrev} | Certificación OSHA`,
    description: clamp160(
      `Certificación de montacargas en ${c.name}, ${c.stateAbbrev}. Capacitación en sitio alineada con OSHA desde $200/persona y curso en línea de $45. Certificados el mismo día.`,
      " Certificados el mismo día.",
    ),
  };

  // ── Intro (~170 words, 3 rotating openings × tier-specific close) ───────
  const openEn = pick(c.slug, 0, [
    `${c.name} employers in ${topIndEn} depend on qualified forklift operators every single shift, and OSHA holds the employer responsible for making sure every operator is trained and evaluated before touching the controls.`,
    `From operations near ${c.landmark} to facilities throughout ${c.county}, businesses in ${placeEn(c)} run on forklifts — and every operator is required by OSHA standard 29 CFR 1910.178 to be trained, evaluated, and certified.`,
    `Whether you run a ${indEn[0]?.toLowerCase() ?? "warehouse"} operation or a growing crew in ${placeEn(c)}, forklift certification isn't optional: OSHA requires formal instruction, hands-on evaluation, and employer documentation for every operator.`,
  ]);
  const closeEn =
    c.tier === "facility"
      ? `Miramar Forklift Training makes that easy for ${c.name} companies and operators. Our ${fac.name} training center at ${fac.address} is roughly ${c.driveMinutes} minutes away, with hands-on classes running Monday, Wednesday, and Friday and same-day certification cards. Prefer zero downtime? We also bring the full program — classroom, practical evaluation, and documentation — directly to your facility, training your crew on the exact equipment they use every day.`
      : c.tier === "nearby"
        ? `Miramar Forklift Training serves ${c.name} directly from our ${fac.name} facility, about ${c.driveMinutes} minutes away. Our instructors come to your site with everything needed — classroom instruction, hands-on evaluation on your own equipment, and same-day certification cards — or your operators can train hands-on at our ${fac.name} training center. Either way, your team is certified and documented in a single session.`
        : `Miramar Forklift Training brings the complete program to ${c.name}: OSHA-required classroom instruction, hands-on evaluation on your own equipment, and same-day certification cards, all at your facility. For individual operators, our online certification covers the formal-instruction portion in about two hours, and hands-on classes are available at our ${fac.name} training center for those who can travel.`;
  const intro = `${openEn} ${closeEn} Training is available in English and Spanish, and we document everything your business needs to pass an inspection.`;

  const openEs = pick(c.slug, 0, [
    `Los empleadores de ${c.name} en ${topIndEs} dependen de operadores de montacargas calificados en cada turno, y OSHA hace responsable al empleador de garantizar que cada operador esté capacitado y evaluado antes de tocar los controles.`,
    `Desde operaciones cerca de ${c.landmark} hasta instalaciones en todo ${countyEs(c)}, las empresas de ${placeEs(c)} funcionan con montacargas — y la norma OSHA 29 CFR 1910.178 exige que cada operador esté capacitado, evaluado y certificado.`,
    `Ya sea que dirija una operación de ${indEs[0]?.toLowerCase() ?? "almacén"} o un equipo en crecimiento en ${placeEs(c)}, la certificación de montacargas no es opcional: OSHA exige instrucción formal, evaluación práctica y documentación del empleador para cada operador.`,
  ]);
  const closeEs =
    c.tier === "facility"
      ? `Miramar Forklift Training lo hace fácil para las empresas y los operadores de ${c.name}. Nuestro centro de capacitación de ${fac.name} en ${fac.address} está a unos ${c.driveMinutes} minutos, con clases prácticas los lunes, miércoles y viernes y tarjetas de certificación el mismo día. ¿Prefiere cero tiempo perdido? También llevamos el programa completo — aula, evaluación práctica y documentación — directamente a su instalación, capacitando a su equipo en el equipo exacto que usa todos los días.`
      : c.tier === "nearby"
        ? `Miramar Forklift Training atiende a ${c.name} directamente desde nuestra instalación de ${fac.name}, a unos ${c.driveMinutes} minutos. Nuestros instructores van a su sitio con todo lo necesario — instrucción en aula, evaluación práctica en su propio equipo y tarjetas de certificación el mismo día — o sus operadores pueden capacitarse de manera práctica en nuestro centro de ${fac.name}. De cualquier forma, su equipo queda certificado y documentado en una sola sesión.`
        : `Miramar Forklift Training lleva el programa completo a ${c.name}: instrucción en aula requerida por OSHA, evaluación práctica en su propio equipo y tarjetas de certificación el mismo día, todo en su instalación. Para operadores individuales, nuestra certificación en línea cubre la parte de instrucción formal en unas dos horas, y hay clases prácticas disponibles en nuestro centro de ${fac.name} para quienes puedan viajar.`;
  const introEs = `${openEs} ${closeEs} La capacitación está disponible en inglés y español, y documentamos todo lo que su empresa necesita para pasar una inspección.`;

  // ── What's included (6 blocks, ~270 words) ──────────────────────────────
  const whatsIncluded = [
    {
      title: "Formal Classroom Instruction",
      description: `OSHA-required classroom training covering equipment fundamentals, load handling and stability, hazard recognition, and pedestrian safety — delivered at your ${c.name} facility or at our ${fac.name} training center.`,
    },
    {
      title: "Hands-On Practical Evaluation",
      description: `Every operator is evaluated on real equipment — counterbalance forklifts, reach trucks, order pickers, electric pallet jacks, or scissor lifts. For onsite sessions in ${c.name}, we evaluate on the exact machines your crew runs daily.`,
    },
    {
      title: "Pre-Operational Inspection Training",
      description: `Operators learn and demonstrate proper pre-shift inspection procedures so they catch maintenance and safety issues before they become incidents — a frequent focus of ${c.state === "Nevada" ? "Nevada OSHA" : "Cal/OSHA"} inspections.`,
    },
    {
      title: "Same-Day Certification Cards",
      description: `Operators who pass walk away with their wallet-sized certification card the same day. Your ${c.name} team is documented and compliant before the session ends — no waiting on paperwork.`,
    },
    {
      title: "Employer Compliance Documentation",
      description: `You receive complete records — evaluation forms, training rosters, and certificates — exactly what a ${c.state === "Nevada" ? "Nevada OSHA" : "Cal/OSHA"} inspector will ask for when they visit a ${c.county} facility.`,
    },
    {
      title: "Bilingual Instruction (English & Spanish)",
      description: `Our instructors deliver the full program in English or Spanish, so every operator on your ${c.name} crew fully understands the material and is fairly evaluated.`,
    },
  ];
  const whatsIncludedEs = [
    {
      title: "Instrucción Formal en Aula",
      description: `Capacitación en aula requerida por OSHA que cubre los fundamentos del equipo, el manejo y la estabilidad de cargas, el reconocimiento de peligros y la seguridad peatonal — impartida en su instalación de ${c.name} o en nuestro centro de ${fac.name}.`,
    },
    {
      title: "Evaluación Práctica",
      description: `Cada operador es evaluado en equipo real — montacargas de contrapeso, reach trucks, order pickers, transpaletas eléctricas o plataformas de tijera. En las sesiones en sitio en ${c.name}, evaluamos en las máquinas exactas que su equipo usa a diario.`,
    },
    {
      title: "Capacitación en Inspección Preoperacional",
      description: `Los operadores aprenden y demuestran los procedimientos correctos de inspección antes del turno para detectar problemas de mantenimiento y seguridad antes de que se conviertan en incidentes — un punto frecuente en las inspecciones de ${c.state === "Nevada" ? "Nevada OSHA" : "Cal/OSHA"}.`,
    },
    {
      title: "Tarjetas de Certificación el Mismo Día",
      description: `Los operadores que aprueban se llevan su tarjeta de certificación el mismo día. Su equipo de ${c.name} queda documentado y en cumplimiento antes de que termine la sesión — sin esperar papeleo.`,
    },
    {
      title: "Documentación de Cumplimiento para el Empleador",
      description: `Usted recibe registros completos — formularios de evaluación, listas de capacitación y certificados — exactamente lo que un inspector de ${c.state === "Nevada" ? "Nevada OSHA" : "Cal/OSHA"} pedirá al visitar una instalación de ${countyEs(c)}.`,
    },
    {
      title: "Instrucción Bilingüe (Inglés y Español)",
      description: `Nuestros instructores imparten el programa completo en inglés o español, para que cada operador de su equipo en ${c.name} comprenda el material por completo y sea evaluado con justicia.`,
    },
  ];

  // ── Why onsite / why us (~150 words, rotating) ──────────────────────────
  const whyTitleEn =
    c.tier === "facility"
      ? `Why ${c.name} Companies Train with Miramar`
      : `Why Onsite Training Makes Sense in ${c.name}`;
  const whyBodyEn = pick(c.slug, 1, [
    `Pulling a crew off the floor and sending them across ${c.region} for training means lost shifts, travel time, and scheduling headaches. Onsite training eliminates all of it: our instructor comes to your ${c.name} facility, your operators train on the equipment they actually use, and everyone is certified in a single session.`,
    `Generic classroom courses train operators on theory; your ${c.name} operation runs on specific equipment, aisle widths, dock layouts, and loads. Training onsite means your operators are evaluated in the real conditions they work in — which produces safer operators and cleaner compliance records.`,
    `Every uncertified operator on a ${c.name} floor is a liability — OSHA penalties for untrained forklift operators can exceed $16,000 per violation. One scheduled session closes that gap: we train, evaluate, and document your whole crew at once.`,
  ]);
  const whyCloseEn =
    c.tier === "facility"
      ? ` And because our ${fac.name} training center is only about ${c.driveMinutes} minutes away, individual operators or new hires can also grab a seat in our Monday, Wednesday, or Friday hands-on classes and come back certified the same day.`
      : ` For businesses in ${topIndEn} — the backbone of the ${c.name} economy — we schedule around your shifts, including split sessions and weekends, so production never stops for training.`;

  const whyTitleEs =
    c.tier === "facility"
      ? `Por Qué las Empresas de ${c.name} se Capacitan con Miramar`
      : `Por Qué la Capacitación en Sitio Tiene Sentido en ${c.name}`;
  const whyBodyEs = pick(c.slug, 1, [
    `Sacar a un equipo del piso y enviarlo al otro lado de ${REGION_ES[c.region] ?? c.region} para capacitarse significa turnos perdidos, tiempo de viaje y dolores de cabeza de programación. La capacitación en sitio elimina todo eso: nuestro instructor va a su instalación en ${c.name}, sus operadores se capacitan en el equipo que realmente usan y todos quedan certificados en una sola sesión.`,
    `Los cursos genéricos en aula capacitan en teoría; su operación en ${c.name} funciona con equipos, pasillos, muelles y cargas específicos. Capacitarse en sitio significa que sus operadores son evaluados en las condiciones reales en las que trabajan — lo que produce operadores más seguros y registros de cumplimiento más sólidos.`,
    `Cada operador sin certificar en un piso de ${c.name} es un riesgo — las multas de OSHA por operadores de montacargas sin capacitar pueden superar los $16,000 por infracción. Una sola sesión programada cierra esa brecha: capacitamos, evaluamos y documentamos a todo su equipo de una vez.`,
  ]);
  const whyCloseEs =
    c.tier === "facility"
      ? ` Y como nuestro centro de capacitación de ${fac.name} está a solo unos ${c.driveMinutes} minutos, los operadores individuales o las nuevas contrataciones también pueden tomar un lugar en nuestras clases prácticas de lunes, miércoles o viernes y regresar certificados el mismo día.`
      : ` Para las empresas de ${topIndEs} — la columna vertebral de la economía de ${c.name} — programamos según sus turnos, incluyendo sesiones divididas y fines de semana, para que la producción nunca se detenga por la capacitación.`;

  // ── FAQs (6, ~450 words) — factual answers AI models can cite ──────────
  const faqs = [
    {
      question: `How much does forklift certification cost in ${c.name}?`,
      answer: `Onsite forklift training in ${c.name} starts at $200 per person for standard counterbalance certification, with the exact price depending on group size, equipment types, and location — request a quote for an exact number. Hands-on classes at our ${fac.name} training center start at $280 per person. The online certification course is a flat $45 and covers the OSHA-required formal instruction portion.`,
    },
    {
      question: `How long does forklift training take in ${c.name}?`,
      answer: `A hands-on certification session takes 3 to 4 hours for new operators and about 1.5 to 2 hours for experienced operators renewing their certification. An onsite group session at your ${c.name} facility typically runs 3 to 4 hours for one equipment type, or 5 to 6 hours for multiple equipment types. The online course is self-paced and takes most operators 1 to 2 hours.`,
    },
    {
      question: `Is online forklift certification valid in ${c.state}?`,
      answer: `${OSHA_BODY[c.state]?.en ?? "OSHA standard 29 CFR 1910.178 applies"}. Online training covers the formal instruction portion of that requirement; the employer must also ensure a hands-on evaluation on the specific equipment the operator will use. Many ${c.state} employers accept our online course combined with an in-house practical evaluation, and we can also provide the hands-on evaluation onsite or at our ${fac.name} facility.`,
    },
    {
      question: `Can you come to our facility in ${c.name}?`,
      answer: `Yes. We provide onsite forklift training throughout ${c.county}, including ${nearby3} and the surrounding ${c.region} area. Our instructor brings the full program — classroom instruction, hands-on evaluation, and same-day certification cards — to your site. You'll need the equipment your operators use available for the practical evaluation. Group scheduling is flexible, including evenings and weekends.`,
    },
    {
      question: `What equipment do you train on in ${c.name}?`,
      answer: `We train and certify operators on sit-down counterbalance forklifts (LPG), reach trucks, order pickers, electric pallet jacks (EPJ), scissor lifts, and aerial/boom lifts. For ${c.name} operations in ${topIndEn}, we tailor the session to the equipment mix your crew actually runs, and operators can be certified on multiple equipment types in one visit.`,
    },
    {
      question: `Where is the nearest Miramar training facility to ${c.name}?`,
      answer:
        c.tier === "facility"
          ? `Our ${fac.name} training center at ${fac.address} is about ${c.driveMinutes} minutes from ${placeEn(c)}. Hands-on classes run Monday, Wednesday, and Friday at 9:00 AM and 1:00 PM — book online and get certified the same day.`
          : `Our nearest training center is in ${fac.name} at ${fac.address}, roughly ${c.driveMinutes} minutes from ${c.name}. Most ${c.name} companies choose onsite training instead — we come to you, so nobody spends half a day on the road. Individual operators can book a hands-on class at the facility or complete the online course from home.`,
    },
  ];
  const faqsEs = [
    {
      question: `¿Cuánto cuesta la certificación de montacargas en ${c.name}?`,
      answer: `La capacitación de montacargas en sitio en ${c.name} comienza en $200 por persona para la certificación estándar de contrapeso; el precio exacto depende del tamaño del grupo, los tipos de equipo y la ubicación — solicite una cotización para un número exacto. Las clases prácticas en nuestro centro de ${fac.name} comienzan en $280 por persona. El curso de certificación en línea cuesta $45 y cubre la parte de instrucción formal requerida por OSHA.`,
    },
    {
      question: `¿Cuánto dura la capacitación de montacargas en ${c.name}?`,
      answer: `Una sesión práctica de certificación toma de 3 a 4 horas para operadores nuevos y de 1.5 a 2 horas para operadores con experiencia que renuevan su certificación. Una sesión grupal en sitio en su instalación de ${c.name} normalmente dura de 3 a 4 horas para un tipo de equipo, o de 5 a 6 horas para varios tipos. El curso en línea es a su propio ritmo y a la mayoría de los operadores les toma de 1 a 2 horas.`,
    },
    {
      question: `¿La certificación de montacargas en línea es válida en ${STATE_ES[c.state] ?? c.state}?`,
      answer: `${OSHA_BODY[c.state]?.es ?? "Se aplica la norma OSHA 29 CFR 1910.178"}. La capacitación en línea cubre la parte de instrucción formal de ese requisito; el empleador también debe garantizar una evaluación práctica en el equipo específico que usará el operador. Muchos empleadores de ${STATE_ES[c.state] ?? c.state} aceptan nuestro curso en línea combinado con una evaluación práctica interna, y también podemos realizar la evaluación práctica en sitio o en nuestra instalación de ${fac.name}.`,
    },
    {
      question: `¿Pueden venir a nuestra instalación en ${c.name}?`,
      answer: `Sí. Ofrecemos capacitación de montacargas en sitio en todo ${countyEs(c)}, incluyendo ${nearby3} y el área circundante de ${REGION_ES[c.region] ?? c.region}. Nuestro instructor lleva el programa completo — instrucción en aula, evaluación práctica y tarjetas de certificación el mismo día — a su sitio. Necesitará tener disponible el equipo que usan sus operadores para la evaluación práctica. La programación de grupos es flexible, incluyendo tardes y fines de semana.`,
    },
    {
      question: `¿En qué equipo capacitan en ${c.name}?`,
      answer: `Capacitamos y certificamos operadores en montacargas de contrapeso (LPG), reach trucks, order pickers, transpaletas eléctricas (EPJ), plataformas de tijera y plataformas aéreas/de pluma. Para operaciones de ${c.name} en ${topIndEs}, adaptamos la sesión a la combinación de equipos que su personal realmente usa, y los operadores pueden certificarse en varios tipos de equipo en una sola visita.`,
    },
    {
      question: `¿Dónde está la instalación de Miramar más cercana a ${c.name}?`,
      answer:
        c.tier === "facility"
          ? `Nuestro centro de capacitación de ${fac.name} en ${fac.address} está a unos ${c.driveMinutes} minutos de ${placeEs(c)}. Las clases prácticas son los lunes, miércoles y viernes a las 9:00 AM y 1:00 PM — reserve en línea y certifíquese el mismo día.`
          : `Nuestro centro de capacitación más cercano está en ${fac.name}, en ${fac.address}, a unos ${c.driveMinutes} minutos de ${c.name}. La mayoría de las empresas de ${c.name} eligen la capacitación en sitio — vamos a usted, para que nadie pase medio día en la carretera. Los operadores individuales pueden reservar una clase práctica en la instalación o completar el curso en línea desde casa.`,
    },
  ];

  // ── CTA band ────────────────────────────────────────────────────────────
  const ctaTitle =
    c.tier === "facility"
      ? `Get Forklift Certified in ${c.name} This Week`
      : `Ready to Schedule Onsite Forklift Training in ${c.name}?`;
  const ctaSubtitle =
    c.tier === "facility"
      ? `Book a hands-on class at our ${fac.name} training center — about ${c.driveMinutes} minutes away — or request a quote and we'll bring the training to your facility.`
      : `Request a quote today and we'll build a training plan around your ${c.name} facility, equipment, and shift schedule. Most quotes go out within one business day.`;
  const ctaTitleEs =
    c.tier === "facility"
      ? `Certifíquese en Montacargas en ${c.name} Esta Semana`
      : `¿Listo para Programar Capacitación de Montacargas en Sitio en ${c.name}?`;
  const ctaSubtitleEs =
    c.tier === "facility"
      ? `Reserve una clase práctica en nuestro centro de ${fac.name} — a unos ${c.driveMinutes} minutos — o solicite una cotización y llevamos la capacitación a su instalación.`
      : `Solicite una cotización hoy y crearemos un plan de capacitación adaptado a su instalación, equipo y turnos en ${c.name}. La mayoría de las cotizaciones se envían en un día hábil.`;

  return {
    slug: c.slug,
    city: c.name,
    state: c.state,
    stateAbbrev: c.stateAbbrev,
    region: c.region,
    regionGroup: c.regionGroup,
    county: c.county,
    population: c.population,
    zipPrefixes: c.zipPrefixes,
    landmark: c.landmark,
    distanceTier: c.tier,
    nearestFacility: { slug: c.facility, name: fac.name, address: fac.address, driveMinutes: c.driveMinutes },
    heroImageAlt: `Forklift operator training near ${c.landmark} in ${c.name}, ${c.stateAbbrev}`,
    heroHeadline,
    heroSubtitle,
    seo,
    intro,
    industriesServed: indEn,
    nearbyAreas: c.nearby,
    whatsIncluded,
    whyOnsite: { title: whyTitleEn, description: whyBodyEn + whyCloseEn },
    faqs,
    ctaTitle,
    ctaSubtitle,
    es: {
      heroHeadline: heroHeadlineEs,
      heroSubtitle: heroSubtitleEs,
      seo: seoEs,
      intro: introEs,
      region: REGION_ES[c.region] ?? c.region,
      industriesServed: indEs,
      whatsIncluded: whatsIncludedEs,
      whyOnsite: { title: whyTitleEs, description: whyBodyEs + whyCloseEs },
      faqs: faqsEs,
      ctaTitle: ctaTitleEs,
      ctaSubtitle: ctaSubtitleEs,
      heroImageAlt: `Capacitación de operadores de montacargas cerca de ${c.landmark} en ${c.name}, ${c.stateAbbrev}`,
    },
  };
}

export const GENERATED_SERVICE_AREA_CITIES: Record<string, ServiceAreaCity> = Object.fromEntries(
  CITY_FACTS.map((c) => [c.slug, generateServiceAreaCity(c)]),
);
