export interface IndustryFaq {
  question: string;
  answer: string;
}

export interface IndustryData {
  slug: string;
  /** English display name */
  name: string;
  /** Spanish display name */
  nameEs: string;
  /** English SEO meta description */
  description: string;
  /** Spanish SEO meta description */
  descriptionEs: string;
  /** English hero subtitle */
  heroSubtitle: string;
  /** Spanish hero subtitle */
  heroSubtitleEs: string;
  /** Common equipment in this industry */
  equipment: string[];
  /** OSHA compliance concerns specific to this industry */
  oshaConcerns: string[];
  /** Why Miramar for this industry (EN) */
  whyMiramar: string[];
  /** Why Miramar for this industry (ES) */
  whyMiramarEs: string[];
  /** Industry-specific FAQs (EN) */
  faqs: IndustryFaq[];
  /** Industry-specific FAQs (ES) */
  faqsEs: IndustryFaq[];
}

export const INDUSTRIES: IndustryData[] = [
  {
    slug: "warehousing",
    name: "Warehousing",
    nameEs: "Almacenes",
    description:
      "OSHA-aligned forklift certification for warehousing operations in San Diego, Las Vegas & Fresno. Train on sit-down forklifts, pallet jacks, and reach trucks with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para operaciones de almacenamiento en San Diego, Las Vegas y Fresno. Capacitacion en montacargas, jinetas de paletas y reach trucks con certificacion el mismo dia.",
    heroSubtitle:
      "High-volume storage facilities need certified operators who can safely navigate narrow aisles, manage heavy pallet loads, and keep throughput moving. Our OSHA-aligned training covers the equipment your warehouse runs every day.",
    heroSubtitleEs:
      "Las instalaciones de almacenamiento de alto volumen necesitan operadores certificados que puedan navegar de forma segura pasillos estrechos, manejar cargas pesadas de paletas y mantener el rendimiento. Nuestra capacitacion alineada con OSHA cubre el equipo que su bodega usa cada dia.",
    equipment: [
      "Sit-down Counterbalance Forklift",
      "Electric Pallet Jack (EPJ)",
      "Reach Truck",
      "Order Picker",
      "Walkie Stacker",
    ],
    oshaConcerns: [
      "Narrow aisle operation and pedestrian traffic in confined spaces",
      "Load stability and capacity ratings for varying pallet configurations",
      "Rack stacking safety at height with reach trucks and order pickers",
      "Battery charging station hazards and LPG refueling procedures",
      "Pre-shift inspection requirements for high-utilization fleets",
    ],
    whyMiramar: [
      "On-site training at your warehouse on your actual equipment",
      "Experienced instructors who understand distribution operations",
      "Same-day certification so your team gets back to work fast",
      "Volume pricing for multi-operator crews and shift rotations",
    ],
    whyMiramarEs: [
      "Capacitacion en su bodega con su propio equipo",
      "Instructores experimentados que entienden operaciones de distribucion",
      "Certificacion el mismo dia para que su equipo regrese al trabajo rapido",
      "Precios por volumen para crews de multiples operadores y rotaciones de turno",
    ],
    faqs: [
      {
        question: "Can you train our operators on our specific reach trucks and forklifts?",
        answer:
          "Yes. We conduct on-site training at your warehouse using your actual equipment. This means your operators get certified on the exact sit-down forklifts, reach trucks, and pallet jacks they use every day, which is what OSHA requires for practical evaluation.",
      },
      {
        question: "How long does forklift certification take for warehouse operators?",
        answer:
          "Most warehouse operator certifications can be completed in a single day. The classroom portion takes 2-4 hours, followed by hands-on practical evaluation. We can train large groups efficiently to minimize downtime across shifts.",
      },
      {
        question: "Do we need to certify operators on each type of equipment separately?",
        answer:
          "OSHA requires training and evaluation on each class of powered industrial truck an operator will use. We offer multi-equipment bundles so your operators can get certified on forklifts, reach trucks, and pallet jacks in one session.",
      },
      {
        question: "How often do warehouse forklift operators need recertification?",
        answer:
          "OSHA requires recertification every 3 years, or sooner if an operator is involved in an accident, near-miss, or is observed operating unsafely. We offer renewal programs to keep your entire fleet compliant.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar a nuestros operadores en nuestros reach trucks y montacargas especificos?",
        answer:
          "Si. Realizamos capacitacion en su bodega usando su equipo actual. Sus operadores obtienen certificacion en los montacargas, reach trucks y jinetas de paletas exactos que usan cada dia, que es lo que OSHA requiere para la evaluacion practica.",
      },
      {
        question: "Cuanto tiempo toma la certificacion de montacargas para operadores de almacen?",
        answer:
          "La mayoria de las certificaciones para operadores de almacen se completan en un solo dia. La parte en salon toma 2-4 horas, seguida de la evaluacion practica. Podemos capacitar grupos grandes eficientemente para minimizar el tiempo de inactividad entre turnos.",
      },
      {
        question: "Necesitamos certificar a los operadores en cada tipo de equipo por separado?",
        answer:
          "OSHA requiere capacitacion y evaluacion en cada clase de camion industrial motorizado que un operador usara. Ofrecemos paquetes de multiples equipos para que sus operadores puedan certificarse en montacargas, reach trucks y jinetas de paletas en una sola sesion.",
      },
      {
        question: "Con que frecuencia necesitan recertificacion los operadores de montacargas de almacen?",
        answer:
          "OSHA requiere recertificacion cada 3 anos, o antes si un operador esta involucrado en un accidente, casi-accidente, o se observa operando de forma insegura. Ofrecemos programas de renovacion para mantener toda su flota cumpliendo.",
      },
    ],
  },
  {
    slug: "logistics",
    name: "Logistics",
    nameEs: "Logistica",
    description:
      "OSHA-aligned forklift certification for logistics and 3PL operations in San Diego, Las Vegas & Fresno. Train on forklifts and pallet jacks for shipping, receiving, and distribution with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para operaciones de logistica y 3PL en San Diego, Las Vegas y Fresno. Capacitacion en montacargas y jinetas de paletas para envio, recepcion y distribucion con certificacion el mismo dia.",
    heroSubtitle:
      "Logistics and 3PL providers move freight fast. Your operators need certifications that cover loading docks, trailer spotting, and cross-dock operations without slowing your supply chain.",
    heroSubtitleEs:
      "Los proveedores de logistica y 3PL mueven carga rapido. Sus operadores necesitan certificaciones que cubran muelles de carga, estacionamiento de remolques y operaciones cross-dock sin ralentizar su cadena de suministro.",
    equipment: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Electric Pallet Jack (EPJ)",
      "Walkie Stacker",
      "Dock Stocker",
    ],
    oshaConcerns: [
      "Trailer loading and unloading — dock plate capacity and wheel chock requirements",
      "Spotting trailers and yard truck coordination",
      "Cross-dock pedestrian traffic and blind corners",
      "Mixed LPG and electric equipment in the same facility",
      "High-throughput shift handoffs and operator fatigue",
    ],
    whyMiramar: [
      "On-site training at your distribution center or cross-dock",
      "Flexible scheduling across multiple shifts and facilities",
      "Instructors experienced with 3PL and shipping/receiving operations",
      "Same-day certification keeps your freight moving",
    ],
    whyMiramarEs: [
      "Capacitacion en su centro de distribucion o cross-dock",
      "Horarios flexibles a traves de multiples turnos e instalaciones",
      "Instructores experimentados en operaciones 3PL y envio/recepcion",
      "Certificacion el mismo dia mantiene su carga en movimiento",
    ],
    faqs: [
      {
        question: "Can you train operators across multiple shifts at our distribution center?",
        answer:
          "Yes. We schedule training sessions across all your shifts so every operator gets certified without shutting down your operation. We can train during off-peak hours or split sessions across multiple days.",
      },
      {
        question: "Do you cover trailer loading and dock safety in the training?",
        answer:
          "Absolutely. Dock operations are a major focus of our logistics training. We cover dock plate capacity, wheel chock requirements, trailer spotting procedures, and pedestrian-vehicle separation in cross-dock environments.",
      },
      {
        question: "Can you certify operators at multiple 3PL facilities?",
        answer:
          "Yes. We service San Diego, Las Vegas, and Fresno. If you operate facilities in multiple cities, we can coordinate training across all locations to keep your entire network compliant.",
      },
      {
        question: "What if our logistics operation uses both LPG and electric forklifts?",
        answer:
          "We train and evaluate operators on both LPG and electric equipment. OSHA requires certification on each type, so we cover the different operating characteristics, refueling vs. charging procedures, and safety considerations for each.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar operadores en multiples turnos en nuestro centro de distribucion?",
        answer:
          "Si. Programamos sesiones de capacitacion en todos sus turnos para que cada operador obtenga certificacion sin detener su operacion. Podemos capacitar durante horas de baja actividad o dividir sesiones en multiples dias.",
      },
      {
        question: "Cubren la carga de remolques y seguridad de muelle en la capacitacion?",
        answer:
          "Por supuesto. Las operaciones de muelle son un enfoque principal de nuestra capacitacion en logistica. Cubrimos capacidad de planchas de muelle, requisitos de cuñas para ruedas, procedimientos de estacionamiento de remolques y separacion peaton-vehiculo en entornos cross-dock.",
      },
      {
        question: "Pueden certificar operadores en multiples instalaciones 3PL?",
        answer:
          "Si. Servimos San Diego, Las Vegas y Fresno. Si opera instalaciones en multiples ciudades, podemos coordinar capacitacion en todas las ubicaciones para mantener toda su red cumpliendo.",
      },
      {
        question: "Que pasa si nuestra operacion de logistica usa montacargas de GLP y electricos?",
        answer:
          "Capacitamos y evaluamos operadores en equipos de GLP y electricos. OSHA requiere certificacion en cada tipo, por lo que cubrimos las diferentes caracteristicas de operacion, procedimientos de recarga vs. carga y consideraciones de seguridad para cada uno.",
      },
    ],
  },
  {
    slug: "construction",
    name: "Construction",
    nameEs: "Construccion",
    description:
      "OSHA-aligned forklift certification for construction sites in San Diego, Las Vegas & Fresno. Train on rough terrain forklifts, telehandlers, and aerial lifts with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para sitios de construccion en San Diego, Las Vegas y Fresno. Capacitacion en montacargas de terreno irregular, telehandlers y plataformas aereas con certificacion el mismo dia.",
    heroSubtitle:
      "Construction sites demand operators who can handle rough terrain, changing site conditions, and mixed equipment. Our OSHA-aligned training covers telehandlers, aerial lifts, and job site safety protocols specific to construction.",
    heroSubtitleEs:
      "Los sitios de construccion demandan operadores que puedan manejar terreno irregular, condiciones cambiantes del sitio y equipo mixto. Nuestra capacitacion alineada con OSHA cubre telehandlers, plataformas aereas y protocolos de seguridad de sitio especificos para construccion.",
    equipment: [
      "Rough Terrain Forklift (Class 7)",
      "Telehandler",
      "Aerial/Boom Lift",
      "Scissor Lift",
      "Sit-down Counterbalance Forklift",
    ],
    oshaConcerns: [
      "Rough terrain and uneven surface operation hazards",
      "Aerial lift fall protection and harness requirements",
      "Overhead power line clearance and electrocution risks",
      "Job site traffic management and ground worker safety",
      "Daily site condition changes requiring ongoing hazard assessment",
    ],
    whyMiramar: [
      "On-site training at your job site on your actual equipment",
      "Instructors who understand construction safety and OSHA 1926 standards",
      "Same-day certification so you can man the site immediately",
      "Coverage of telehandlers, aerial lifts, and rough terrain forklifts",
    ],
    whyMiramarEs: [
      "Capacitacion en su sitio de trabajo con su equipo actual",
      "Instructores que entienden seguridad de construccion y estandares OSHA 1926",
      "Certificacion el mismo dia para que pueda personalizar el sitio inmediatamente",
      "Cobertura de telehandlers, plataformas aereas y montacargas de terreno irregular",
    ],
    faqs: [
      {
        question: "Can you train at our active construction site?",
        answer:
          "Yes. We come to your job site and train on your equipment in real conditions. This is ideal for construction because operators learn on the actual rough terrain forklifts and telehandlers they will use on the job.",
      },
      {
        question: "Do you cover aerial lift certification for construction?",
        answer:
          "Yes. We offer combined forklift and aerial lift certification. Our training covers boom lifts, scissor lifts, and the fall protection requirements that OSHA mandates for aerial work platforms on construction sites.",
      },
      {
        question: "Does construction forklift training cover OSHA 1926 standards?",
        answer:
          "Yes. While forklift operator certification falls under 29 CFR 1910.178, our construction training also addresses site-specific requirements under OSHA 1926 construction standards, including traffic control, power line safety, and ground condition assessment.",
      },
      {
        question: "Can you certify a new crew quickly when we start a new project?",
        answer:
          "Absolutely. We specialize in same-day certification and can mobilize to your new job site quickly. Whether you have a small crew or a large project team, we can get everyone certified and ready to work.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar en nuestro sitio de construccion activo?",
        answer:
          "Si. Vamos a su sitio de trabajo y capacitamos en su equipo en condiciones reales. Esto es ideal para construccion porque los operadores aprenden en los montacargas de terreno irregular y telehandlers reales que usaran en el trabajo.",
      },
      {
        question: "Cubren la certificacion de plataformas aereas para construccion?",
        answer:
          "Si. Ofrecemos certificacion combinada de montacargas y plataformas aereas. Nuestra capacitacion cubre boom lifts, scissor lifts y los requisitos de proteccion contra caidas que OSHA exige para plataformas de trabajo aereo en sitios de construccion.",
      },
      {
        question: "La capacitacion de montacargas para construccion cubre los estandares OSHA 1926?",
        answer:
          "Si. Aunque la certificacion de operadores de montacargas cae bajo 29 CFR 1910.178, nuestra capacitacion para construccion tambien aborda requisitos especificos del sitio bajo los estandares de construccion OSHA 1926, incluyendo control de trafico, seguridad de lineas electricas y evaluacion de condiciones del terreno.",
      },
      {
        question: "Pueden certificar un crew nuevo rapidamente cuando comenzamos un nuevo proyecto?",
        answer:
          "Por supuesto. Nos especializamos en certificacion el mismo dia y podemos movilizarnos a su nuevo sitio de trabajo rapidamente. Ya sea un crew pequeno o un equipo de proyecto grande, podemos certificar a todos y tenerlos listos para trabajar.",
      },
    ],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    nameEs: "Manufactura",
    description:
      "OSHA-aligned forklift certification for manufacturing facilities in San Diego, Las Vegas & Fresno. Train on forklifts and walkie stackers for production floor material handling with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para instalaciones de manufactura en San Diego, Las Vegas y Fresno. Capacitacion en montacargas y walkie stackers para manejo de materiales en piso de produccion con certificacion el mismo dia.",
    heroSubtitle:
      "Manufacturing floors require operators who can move raw materials, work-in-progress, and finished goods safely around production lines, machinery, and foot traffic. Our training addresses the unique hazards of manufacturing environments.",
    heroSubtitleEs:
      "Los pisos de manufactura requieren operadores que puedan mover materias primas, trabajo en progreso y productos terminados de forma segura alrededor de lineas de produccion, maquinaria y trafico peatonal. Nuestra capacitacion aborda los peligros unicos de entornos de manufactura.",
    equipment: [
      "Sit-down Counterbalance Forklift",
      "Electric Pallet Jack (EPJ)",
      "Walkie Stacker",
      "Reach Truck",
      "Tow Tractor",
    ],
    oshaConcerns: [
      "Production floor pedestrian traffic and machine interface zones",
      "Load handling near active production lines and robotic cells",
      "Battery charging in close proximity to manufacturing operations",
      "Narrow aisle navigation between production equipment",
      "Hazardous material handling and spill containment awareness",
    ],
    whyMiramar: [
      "On-site training on your production floor with your equipment",
      "Instructors experienced with manufacturing environments",
      "Flexible scheduling around production runs and shift changes",
      "Same-day certification to minimize production downtime",
    ],
    whyMiramarEs: [
      "Capacitacion en su piso de produccion con su equipo",
      "Instructores experimentados en entornos de manufactura",
      "Horarios flexibles alrededor de corridas de produccion y cambios de turno",
      "Certificacion el mismo dia para minimizar el tiempo de inactividad de produccion",
    ],
    faqs: [
      {
        question: "Can you train operators without interrupting our production schedule?",
        answer:
          "Yes. We work around your production runs and shift changes. Training can be scheduled during planned downtime, between shifts, or in smaller groups to keep your manufacturing lines running.",
      },
      {
        question: "Do you cover the specific hazards of operating forklifts near production equipment?",
        answer:
          "Yes. Our manufacturing-focused training covers pedestrian traffic in production zones, machine interface areas, load handling near active lines, and battery charging safety in close proximity to manufacturing operations.",
      },
      {
        question: "Can you train operators on walkie stackers and tow tractors used on our production floor?",
        answer:
          "Yes. We certify operators on the full range of powered industrial trucks used in manufacturing, including walkie stackers, tow tractors, pallet jacks, and counterbalance forklifts. Each equipment type is evaluated per OSHA requirements.",
      },
      {
        question: "How do you handle training for multiple manufacturing shifts?",
        answer:
          "We can schedule sessions across all your shifts. Many manufacturing clients book us for a full day or multiple days so we can train first, second, and third shift operators without leaving anyone uncertified.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar operadores sin interrumpir nuestro horario de produccion?",
        answer:
          "Si. Trabajamos alrededor de sus corridas de produccion y cambios de turno. La capacitacion se puede programar durante tiempo de inactividad planificado, entre turnos, o en grupos mas pequenos para mantener sus lineas de manufactura funcionando.",
      },
      {
        question: "Cubren los peligros especificos de operar montacargas cerca de equipo de produccion?",
        answer:
          "Si. Nuestra capacitacion enfocada en manufactura cubre el trafico peatonal en zonas de produccion, areas de interfaz de maquinaria, manejo de carga cerca de lineas activas y seguridad de carga de baterias en proximidad cercana a operaciones de manufactura.",
      },
      {
        question: "Pueden capacitar operadores en walkie stackers y tractores de remolque usados en nuestro piso de produccion?",
        answer:
          "Si. Certificamos operadores en la gama completa de camiones industriales motorizados usados en manufactura, incluyendo walkie stackers, tractores de remolque, jinetas de paletas y montacargas de contrapeso. Cada tipo de equipo se evalua segun los requisitos de OSHA.",
      },
      {
        question: "Como manejan la capacitacion para multiples turnos de manufactura?",
        answer:
          "Podemos programar sesiones en todos sus turnos. Muchos clientes de manufactura nos reservan para un dia completo o multiples dias para que podamos capacitar operadores del primer, segundo y tercer turno sin dejar a nadie sin certificar.",
      },
    ],
  },
  {
    slug: "retail",
    name: "Retail",
    nameEs: "Retail",
    description:
      "OSHA-aligned forklift certification for retail distribution centers and big box stores in San Diego, Las Vegas & Fresno. Train on electric pallet jacks and forklifts with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para centros de distribucion de retail y tiendas big box en San Diego, Las Vegas y Fresno. Capacitacion en jinetas de paletas electricas y montacargas con certificacion el mismo dia.",
    heroSubtitle:
      "Retail distribution centers and big box stores rely on electric pallet jacks and forklifts to move inventory from receiving to the sales floor and backstock. Our training covers the equipment and safety protocols specific to retail environments.",
    heroSubtitleEs:
      "Los centros de distribucion de retail y tiendas big box dependen de jinetas de paletas electricas y montacargas para mover inventario de recepcion al piso de ventas y al backstock. Nuestra capacitacion cubre el equipo y protocolos de seguridad especificos para entornos de retail.",
    equipment: [
      "Electric Pallet Jack (EPJ)",
      "Sit-down Counterbalance Forklift",
      "Walkie Stacker",
      "Reach Truck",
    ],
    oshaConcerns: [
      "Customer and employee pedestrian traffic in retail-adjacent areas",
      "Electric pallet jack operation on sales floors and backroom aisles",
      "Load stability when moving mixed retail inventory",
      "Noise and safety protocols in customer-facing environments",
      "Seasonal staffing and temporary operator certification needs",
    ],
    whyMiramar: [
      "On-site training at your distribution center or retail backroom",
      "Fast same-day certification for seasonal and temporary staff",
      "Instructors who understand retail distribution operations",
      "Volume pricing for large teams and seasonal hiring surges",
    ],
    whyMiramarEs: [
      "Capacitacion en su centro de distribucion o backroom de retail",
      "Certificacion rapida el mismo dia para personal temporal y de temporada",
      "Instructores que entienden operaciones de distribucion de retail",
      "Precios por volumen para equipos grandes y aumentos de contratacion de temporada",
    ],
    faqs: [
      {
        question: "Can you certify seasonal and temporary retail employees quickly?",
        answer:
          "Yes. We specialize in same-day certification, which is ideal for seasonal hiring surges. We can train large groups of temporary employees efficiently so they are certified before your peak season begins.",
      },
      {
        question: "Do you cover electric pallet jack certification for retail operations?",
        answer:
          "Yes. Electric pallet jacks are the most common equipment in retail, and we provide full certification on EPJs, walkie stackers, and forklifts. Each operator is trained and evaluated on the specific equipment they will use.",
      },
      {
        question: "Can you train at our retail distribution center or store backroom?",
        answer:
          "Yes. We come to your facility and train on your equipment. Whether you operate a large distribution center or need operators certified for backroom pallet jack use, we conduct the training on-site in your actual environment.",
      },
      {
        question: "How do you handle training for large retail teams?",
        answer:
          "We offer volume pricing and can train large groups efficiently. Many retail clients schedule training days where we certify dozens of operators across multiple sessions to get their entire team compliant in one push.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden certificar empleados de retail temporales y de temporada rapidamente?",
        answer:
          "Si. Nos especializamos en certificacion el mismo dia, lo cual es ideal para aumentos de contratacion de temporada. Podemos capacitar grupos grandes de empleados temporales eficientemente para que esten certificados antes de que comience su temporada alta.",
      },
      {
        question: "Cubren la certificacion de jinetas de paletas electricas para operaciones de retail?",
        answer:
          "Si. Las jinetas de paletas electricas son el equipo mas comun en retail, y proveemos certificacion completa en EPJs, walkie stackers y montacargas. Cada operador es capacitado y evaluado en el equipo especifico que usara.",
      },
      {
        question: "Pueden capacitar en nuestro centro de distribucion de retail o backroom de tienda?",
        answer:
          "Si. Vamos a su instalacion y capacitamos en su equipo. Ya sea que opere un gran centro de distribucion o necesite operadores certificados para uso de jineta de paletas en backroom, realizamos la capacitacion en su entorno real.",
      },
      {
        question: "Como manejan la capacitacion para equipos grandes de retail?",
        answer:
          "Ofrecemos precios por volumen y podemos capacitar grupos grandes eficientemente. Muchos clientes de retail programan dias de capacitacion donde certificamos docenas de operadores en multiples sesiones para lograr que todo su equipo cumpla en un solo esfuerzo.",
      },
    ],
  },
  {
    slug: "food-beverage",
    name: "Food & Beverage",
    nameEs: "Alimentos y Bebidas",
    description:
      "OSHA-aligned forklift certification for food and beverage operations in San Diego, Las Vegas & Fresno. Train on forklifts and electric pallet jacks for cold storage and distribution with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para operaciones de alimentos y bebidas en San Diego, Las Vegas y Fresno. Capacitacion en montacargas y jinetes de paletas electricos para almacenamiento en frio y distribucion con certificacion el mismo dia.",
    heroSubtitle:
      "Food and beverage operations face unique challenges: cold storage environments, strict hygiene requirements, and fast turnaround on perishable goods. Our training addresses the specific safety needs of food distribution and cold chain logistics.",
    heroSubtitleEs:
      "Las operaciones de alimentos y bebidas enfrentan desafios unicos: entornos de almacenamiento en frio, requisitos estrictos de higiene y rapida rotacion de bienes perecederos. Nuestra capacitacion aborda las necesidades de seguridad especificas de distribucion de alimentos y logistica de cadena de frio.",
    equipment: [
      "Electric Pallet Jack (EPJ)",
      "Sit-down Counterbalance Forklift (Electric)",
      "Reach Truck",
      "Walkie Stacker",
    ],
    oshaConcerns: [
      "Cold storage environment hazards — reduced traction, condensation, limited visibility",
      "Electric equipment requirements in food-grade and cold storage areas",
      "Pedestrian traffic in loading docks during high-volume distribution",
      "Battery management in cold environments and charging station safety",
      "Allergen and contamination awareness during material handling",
    ],
    whyMiramar: [
      "On-site training at your cold storage or distribution facility",
      "Instructors experienced with food and beverage operations",
      "Same-day certification to keep your cold chain moving",
      "Coverage of electric equipment preferred in food-grade environments",
    ],
    whyMiramarEs: [
      "Capacitacion en su instalacion de almacenamiento en frio o distribucion",
      "Instructores experimentados en operaciones de alimentos y bebidas",
      "Certificacion el mismo dia para mantener su cadena de frio en movimiento",
      "Cobertura de equipo electrico preferido en entornos de grado alimenticio",
    ],
    faqs: [
      {
        question: "Can you train operators in cold storage environments?",
        answer:
          "Yes. We conduct on-site training in your cold storage facility so operators learn in the actual conditions they will work in. We cover cold-weather-specific hazards like reduced traction, condensation on surfaces, and limited visibility from fog.",
      },
      {
        question: "Do you cover the specific requirements for electric equipment in food facilities?",
        answer:
          "Yes. Most food and beverage operations use electric forklifts and pallet jacks to avoid emissions in food-grade areas. We train and certify operators on electric equipment, covering battery management, charging procedures, and cold-environment battery performance.",
      },
      {
        question: "Can you train at our food distribution center during operating hours?",
        answer:
          "We can schedule training around your distribution schedule. Many food and beverage clients book us during off-peak hours or between delivery cycles so we can train operators without disrupting the cold chain or delivery schedules.",
      },
      {
        question: "How do you handle training for seasonal food distribution peaks?",
        answer:
          "We offer fast same-day certification and volume pricing, which is ideal for seasonal peaks like holidays or harvest seasons. We can quickly certify additional operators to handle increased distribution volume during your busiest periods.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar operadores en entornos de almacenamiento en frio?",
        answer:
          "Si. Realizamos capacitacion en su instalacion de almacenamiento en frio para que los operadores aprendan en las condiciones reales en las que trabajaran. Cubrimos peligros especificos de clima frio como traccion reducida, condensacion en superficies y visibilidad limitada por niebla.",
      },
      {
        question: "Cubren los requisitos especificos para equipo electrico en instalaciones de alimentos?",
        answer:
          "Si. La mayoria de las operaciones de alimentos y bebidas usan montacargas electricos y jinetas de paletas para evitar emisiones en areas de grado alimenticio. Capacitamos y certificamos operadores en equipo electrico, cubriendo gestion de baterias, procedimientos de carga y rendimiento de baterias en entornos frios.",
      },
      {
        question: "Pueden capacitar en nuestro centro de distribucion de alimentos durante horas de operacion?",
        answer:
          "Podemos programar la capacitacion alrededor de su horario de distribucion. Muchos clientes de alimentos y bebidas nos reservan durante horas de baja actividad o entre ciclos de entrega para que podamos capacitar operadores sin interrumpir la cadena de frio o los horarios de entrega.",
      },
      {
        question: "Como manejan la capacitacion para picos estacionales de distribucion de alimentos?",
        answer:
          "Ofrecemos certificacion rapida el mismo dia y precios por volumen, lo cual es ideal para picos estacionales como dias festivos o temporadas de cosecha. Podemos certificar rapidamente operadores adicionales para manejar mayor volumen de distribucion durante sus periodos mas ocupados.",
      },
    ],
  },
  {
    slug: "lumber-building-materials",
    name: "Lumber & Building Materials",
    nameEs: "Madera y Materiales de Construccion",
    description:
      "OSHA-aligned forklift certification for lumber yards and building material suppliers in San Diego, Las Vegas & Fresno. Train on forklifts and telehandlers for yard operations with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para patios de madera y proveedores de materiales de construccion en San Diego, Las Vegas y Fresno. Capacitacion en montacargas y telehandlers para operaciones de patio con certificacion el mismo dia.",
    heroSubtitle:
      "Lumber yards and building material suppliers handle long, heavy, and unstable loads in outdoor yard environments. Our training covers the specific equipment and safety challenges of moving lumber, drywall, roofing materials, and other building products.",
    heroSubtitleEs:
      "Los patios de madera y proveedores de materiales de construccion manejan cargas largas, pesadas e inestables en entornos exteriores de patio. Nuestra capacitacion cubre el equipo especifico y los desafios de seguridad de mover madera, drywall, materiales de techado y otros productos de construccion.",
    equipment: [
      "Sit-down Counterbalance Forklift (LPG)",
      "Telehandler",
      "Rough Terrain Forklift (Class 7)",
      "Electric Pallet Jack (EPJ)",
    ],
    oshaConcerns: [
      "Long and unstable load handling — lumber bundles, drywall sheets, piping",
      "Outdoor yard surface hazards — gravel, mud, slopes, and weather conditions",
      "Customer traffic in retail yard environments",
      "Telehandler load charts and reach limitations for elevated loads",
      "Securing and transporting building materials safely",
    ],
    whyMiramar: [
      "On-site training at your lumber yard or building supply facility",
      "Instructors experienced with yard operations and building material handling",
      "Coverage of telehandlers and rough terrain forklifts for outdoor yards",
      "Same-day certification to keep your yard operations running",
    ],
    whyMiramarEs: [
      "Capacitacion en su patio de madera o instalacion de suministros de construccion",
      "Instructores experimentados en operaciones de patio y manejo de materiales de construccion",
      "Cobertura de telehandlers y montacargas de terreno irregular para patios exteriores",
      "Certificacion el mismo dia para mantener sus operaciones de patio funcionando",
    ],
    faqs: [
      {
        question: "Can you train operators at our lumber yard on our forklifts and telehandlers?",
        answer:
          "Yes. We come to your lumber yard and train on your actual equipment. Operators learn to handle long lumber bundles, drywall, and other building materials in the real yard conditions they work in every day.",
      },
      {
        question: "Do you cover telehandler certification for building material suppliers?",
        answer:
          "Yes. We provide telehandler certification covering load charts, reach limitations, and the specific hazards of lifting building materials at height. Telehandlers are common in lumber yards and building supply operations, and we ensure operators are fully certified.",
      },
      {
        question: "How do you address the hazards of handling long and unstable loads like lumber?",
        answer:
          "Our training specifically covers load stability for long and irregular loads. We teach operators how to properly secure lumber bundles, balance drywall sheets, handle piping and trim, and navigate yard surfaces with loads that extend beyond the forks.",
      },
      {
        question: "Can you train operators who work in both the yard and indoor retail areas?",
        answer:
          "Yes. Many building material suppliers have both outdoor yard operations and indoor retail showrooms. We can certify operators on the full range of equipment they will use, from rough terrain forklifts in the yard to pallet jacks in the showroom.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar operadores en nuestro patio de madera en nuestros montacargas y telehandlers?",
        answer:
          "Si. Vamos a su patio de madera y capacitamos en su equipo actual. Los operadores aprenden a manejar paquetes largos de madera, drywall y otros materiales de construccion en las condiciones reales del patio en las que trabajan cada dia.",
      },
      {
        question: "Cubren la certificacion de telehandlers para proveedores de materiales de construccion?",
        answer:
          "Si. Proveemos certificacion de telehandlers cubriendo tablas de carga, limitaciones de alcance y los peligros especificos de levantar materiales de construccion a altura. Los telehandlers son comunes en patios de madera y operaciones de suministros de construccion, y aseguramos que los operadores esten completamente certificados.",
      },
      {
        question: "Como abordan los peligros de manejar cargas largas e inestables como madera?",
        answer:
          "Nuestra capacitacion cubre especificamente la estabilidad de carga para cargas largas e irregulares. Ensenamos a los operadores como asegurar adecuadamente paquetes de madera, balancear hojas de drywall, manejar tuberia y molduras, y navegar superficies de patio con cargas que se extienden mas alla de las horquillas.",
      },
      {
        question: "Pueden capacitar operadores que trabajan tanto en el patio como en areas de retail interiores?",
        answer:
          "Si. Muchos proveedores de materiales de construccion tienen tanto operaciones de patio exterior como showrooms de retail interiores. Podemos certificar operadores en la gama completa de equipo que usaran, desde montacargas de terreno irregular en el patio hasta jinetas de paletas en el showroom.",
      },
    ],
  },
  {
    slug: "shipping-ports",
    name: "Shipping & Ports",
    nameEs: "Envio y Puertos",
    description:
      "OSHA-aligned forklift certification for shipping and port operations in San Diego, Las Vegas & Fresno. Train on forklifts and reach stackers for container handling with same-day certification.",
    descriptionEs:
      "Certificacion de montacargas alineada con OSHA para operaciones de envio y puertos en San Diego, Las Vegas y Fresno. Capacitacion en montacargas y reach stackers para manejo de contenedores con certificacion el mismo dia.",
    heroSubtitle:
      "Port operations and shipping terminals demand operators who can handle heavy containers, work in high-traffic dock environments, and maintain throughput under pressure. Our training covers the specialized equipment and safety protocols for port and shipping operations.",
    heroSubtitleEs:
      "Las operaciones portuarias y terminales de envio demandan operadores que puedan manejar contenedores pesados, trabajar en entornos de muelle de alto trafico y mantener el rendimiento bajo presion. Nuestra capacitacion cubre el equipo especializado y protocolos de seguridad para operaciones portuarias y de envio.",
    equipment: [
      "Heavy-duty Sit-down Forklift",
      "Reach Stacker",
      "Empty Container Handler",
      "Electric Pallet Jack (EPJ)",
      "Terminal Tractor / Yard Goat",
    ],
    oshaConcerns: [
      "Container handling — stacking, destacking, and securing heavy loads",
      "Dock and quay-side pedestrian and vehicle traffic management",
      "Reach stacker load charts and stability at extended reach",
      "Working near water and dock edge fall hazards",
      "High-noise environment communication and signal protocols",
    ],
    whyMiramar: [
      "On-site training at your port facility or shipping terminal",
      "Instructors experienced with heavy-duty equipment and port operations",
      "Coverage of reach stackers, container handlers, and heavy forklifts",
      "Same-day certification to maintain port throughput",
    ],
    whyMiramarEs: [
      "Capacitacion en su instalacion portuaria o terminal de envio",
      "Instructores experimentados en equipo pesado y operaciones portuarias",
      "Cobertura de reach stackers, manejadores de contenedores y montacargas pesados",
      "Certificacion el mismo dia para mantener el rendimiento del puerto",
    ],
    faqs: [
      {
        question: "Can you train operators on reach stackers and container handlers at our port facility?",
        answer:
          "Yes. We come to your port or terminal and train on your actual reach stackers, container handlers, and heavy-duty forklifts. Operators learn container handling, stacking protocols, and dock safety in the real environment.",
      },
      {
        question: "Do you address the specific hazards of working near water and dock edges?",
        answer:
          "Yes. Our port and shipping training covers dock edge fall hazards, water-side safety protocols, and the high-noise environment communication procedures that port operations require. We address the unique risks of working on and near waterfront facilities.",
      },
      {
        question: "Can you train terminal tractor (yard goat) operators?",
        answer:
          "Yes. We can include terminal tractor operation in the certification program. While OSHA's powered industrial truck standard covers forklifts, we address yard goat operation and the related safety protocols for moving trailers and containers in terminal environments.",
      },
      {
        question: "How do you handle training for 24/7 port operations?",
        answer:
          "We schedule training around your operational needs. Port operations run 24/7, and we can train operators across all shifts. Many port and shipping clients book us for multiple days to ensure every operator on every shift gets certified.",
      },
    ],
    faqsEs: [
      {
        question: "Pueden capacitar operadores en reach stackers y manejadores de contenedores en nuestra instalacion portuaria?",
        answer:
          "Si. Vamos a su puerto o terminal y capacitamos en sus reach stackers, manejadores de contenedores y montacargas pesados reales. Los operadores aprenden manejo de contenedores, protocolos de apilamiento y seguridad de muelle en el entorno real.",
      },
      {
        question: "Abordan los peligros especificos de trabajar cerca del agua y bordes de muelle?",
        answer:
          "Si. Nuestra capacitacion portuaria y de envio cubre peligros de caida en bordes de muelle, protocolos de seguridad del lado del agua y los procedimientos de comunicacion en entornos de alto ruido que las operaciones portuarias requieren. Abordamos los riesgos unicos de trabajar en y cerca de instalaciones costeras.",
      },
      {
        question: "Pueden capacitar operadores de tractores de terminal (yard goat)?",
        answer:
          "Si. Podemos incluir operacion de tractor de terminal en el programa de certificacion. Aunque el estandar de camiones industriales motorizados de OSHA cubre montacargas, abordamos la operacion de yard goat y los protocolos de seguridad relacionados para mover remolques y contenedores en entornos de terminal.",
      },
      {
        question: "Como manejan la capacitacion para operaciones portuarias 24/7?",
        answer:
          "Programamos la capacitacion alrededor de sus necesidades operacionales. Las operaciones portuarias funcionan 24/7, y podemos capacitar operadores en todos los turnos. Muchos clientes portuarios y de envio nos reservan por multiples dias para asegurar que cada operador en cada turno obtenga certificacion.",
      },
    ],
  },
];

export function getIndustryBySlug(slug: string): IndustryData | undefined {
  return INDUSTRIES.find((ind) => ind.slug === slug);
}

export function getAllIndustrySlugs(): string[] {
  return INDUSTRIES.map((ind) => ind.slug);
}
