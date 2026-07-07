import { StepDef, QuestionDef } from "./course-content";

export const CANONICAL_COURSE_ES = {
  title: "Certificación en Línea para Operador de Montacargas",
  slug: "certificacion-operador-montacargas-en-linea",
  description: "Capacitación integral para operador de camiones industriales motorizados (montacargas) en cumplimiento con OSHA. Cubre instrucción formal, procedimientos de seguridad, manejo de cargas y documentación del empleador. Complete la capacitación en video, las verificaciones de conocimiento y apruebe el examen final para recibir su certificación reconocida por la industria. Nota: OSHA también requiere capacitación práctica y evaluación conducida por el empleador.",
  category: "forklift",
  price: "45.00",
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
  const tipBlock = opts.tip ? `<div class="callout callout-tip"><strong>💡 Consejo:</strong> ${opts.tip}</div>` : "";
  const warnBlock = opts.warning ? `<div class="callout callout-warning"><strong>⚠️ Advertencia:</strong> ${opts.warning}</div>` : "";
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
<h4>📝 Puntos Clave</h4>
<ul>${takeawayItems}</ul>
</div>
</div>`;
}

export const COURSE_STEPS_ES: StepDef[] = [
  // ═══ MÓDULO 0: Bienvenida + Cumplimiento OSHA ═══
  {
    module: "Bienvenida y Cumplimiento OSHA",
    title: "Bienvenido a la Certificación de Operador de Montacargas",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Bienvenido a la Certificación de Operador de Montacargas",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "Acerca de Este Curso", content: "<p>¡Bienvenido! Este curso en línea proporciona la porción de <strong>instrucción formal</strong> de la certificación de operador de camiones industriales motorizados (PIT/montacargas) en cumplimiento con OSHA. El curso toma aproximadamente <strong>45–60 minutos</strong> para completar.</p>" },
          { heading: "Qué Incluye", content: "<ul><li>Módulos de capacitación interactivos que cubren todos los temas requeridos por OSHA</li><li>Cuestionarios de verificación de conocimiento a lo largo del curso</li><li>Examen final de certificación (80% para aprobar)</li><li>Certificado digital con credencial verificada por código QR</li><li>Paquete de documentación del empleador para evaluación práctica</li></ul>" },
          { heading: "Qué NO Incluye", content: "<p>OSHA requiere <strong>tres componentes</strong> para la certificación completa: (1) instrucción formal (este curso), (2) capacitación práctica/en persona, y (3) una evaluación del desempeño del operador. Su empleador debe realizar la parte práctica en su lugar de trabajo. Proporcionamos todos los formularios que necesitan en el Módulo 7.</p>" },
          { heading: "Cómo Navegar", content: "<p>Complete cada paso en orden. Puede seguir su progreso usando la barra lateral. Si necesita detenerse, su progreso se guarda automáticamente. Puede retomar el examen final hasta 3 veces.</p>" },
        ],
        takeaways: [
          "Este curso cubre el requisito de instrucción formal",
          "Su empleador también debe realizar capacitación práctica y evaluación",
          "Complete todos los módulos y apruebe el examen final con 80% o más",
          "Su progreso se guarda automáticamente — reanude en cualquier momento",
        ],
      }),
    },
  },
  {
    module: "Bienvenida y Cumplimiento OSHA",
    title: "Cumplimiento OSHA: Lo Que Cubre Este Curso",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Cumplimiento OSHA: Lo Que Cubre Este Curso",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Requisito de Tres Partes de OSHA", content: "<p>Bajo <strong>29 CFR 1910.178(l)</strong>, OSHA requiere que todos los operadores de montacargas reciban:</p><ol><li><strong>Instrucción formal</strong> — capacitación en aula o en línea cubriendo temas de seguridad (este curso)</li><li><strong>Capacitación práctica</strong> — experiencia práctica operando el equipo específico en el lugar de trabajo</li><li><strong>Evaluación</strong> — un supervisor debe observar y evaluar la competencia del operador</li></ol>" },
          { heading: "Lo Que Proporcionamos", content: "<ul><li>Instrucción formal completa cubriendo todos los temas requeridos por OSHA</li><li>Evaluación de conocimiento mediante examen final</li><li>Certificado de finalización para la porción de instrucción formal</li><li>Paquete de documentación del empleador incluyendo listas de evaluación, permisos y hojas de asistencia</li></ul>" },
          { heading: "Lo Que Su Empleador Debe Hacer", content: "<p>Después de completar este curso, su empleador/supervisor debe:</p><ul><li>Proporcionar capacitación práctica en el equipo específico que operará</li><li>Evaluar su desempeño en el lugar de trabajo real</li><li>Completar y mantener la documentación requerida (proporcionada en el Módulo 7)</li><li>Re-evaluar a los operadores al menos cada 3 años</li></ul>" },
          { content: "<p><em>Importante: Este curso en línea por sí solo no satisface completamente los requisitos de OSHA. La capacitación práctica y la evaluación deben ser completadas por su empleador en su lugar de trabajo.</em></p>" },
        ],
        takeaways: [
          "OSHA requiere instrucción formal + capacitación práctica + evaluación",
          "Este curso cubre la instrucción formal y la evaluación de conocimiento",
          "Su empleador debe completar la capacitación práctica y la evaluación",
          "Los operadores deben ser re-evaluados al menos cada 3 años",
        ],
        warning: "No opere un montacargas hasta que su empleador haya completado su capacitación práctica y evaluación.",
      }),
    },
  },
  {
    module: "Bienvenida y Cumplimiento OSHA",
    title: "Verificación de Conocimiento: Requisitos OSHA",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "La capacitación de OSHA para operadores de montacargas requiere instrucción formal, capacitación práctica Y una evaluación.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "OSHA requiere los tres componentes: instrucción formal, capacitación práctica y una evaluación del desempeño del operador." },
      { question: "Este curso en línea reemplaza la necesidad de evaluación práctica por parte de su empleador.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "Este curso cubre solo la instrucción formal. Su empleador aún debe realizar la capacitación práctica y la evaluación en su lugar de trabajo." },
      { question: "Si no está seguro acerca de una operación, debe preguntar a su supervisor antes de proceder.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Siempre consulte a su supervisor cuando tenga dudas. Operar un montacargas sin el conocimiento adecuado crea riesgos serios de seguridad." },
    ],
  },

  // ═══ MÓDULO 1: Fundamentos del Montacargas + Responsabilidades ═══
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "¿Qué es un Camión Industrial Motorizado (PIT)?",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "¿Qué es un Camión Industrial Motorizado (PIT)?",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Definición", content: "<p>Un <strong>Camión Industrial Motorizado (PIT)</strong> es cualquier vehículo móvil autopropulsado utilizado para transportar, empujar, jalar, levantar, apilar o escalonar materiales. Los nombres comunes incluyen montacargas, patín hidráulico, montacargas de conductor y camión elevador.</p><p>Los PITs pueden ser impulsados por motores eléctricos o motores de combustión interna (propano, gasolina, diésel).</p>" },
          { heading: "Clasificaciones de Equipo OSHA", content: "<ul><li><strong>Clase I:</strong> Montacargas Eléctricos de Conductor Sentado</li><li><strong>Clase II:</strong> Montacargas Eléctricos de Pasillo Angosto</li><li><strong>Clase III:</strong> Patines y Apiladores Eléctricos</li><li><strong>Clase IV:</strong> Montacargas de Combustión Interna — Llantas de Cojín</li><li><strong>Clase V:</strong> Montacargas de Combustión Interna — Llantas Neumáticas</li><li><strong>Clase VI:</strong> Tractores de Combustión Interna</li><li><strong>Clase VII:</strong> Montacargas para Terreno Difícil</li></ul>" },
          { heading: "Quién Puede Operar", content: "<p>Solo empleados <strong>capacitados y autorizados</strong> pueden operar un PIT. Debe tener al menos <strong>18 años de edad</strong>. Su certificación es válida por <strong>3 años</strong>, después de lo cual debe ser re-evaluado.</p>" },
          { heading: "Responsabilidades del Empleador vs. Operador", content: "<ul><li><strong>Empleador:</strong> Debe proporcionar capacitación, asegurar que el equipo esté mantenido, hacer cumplir las reglas de seguridad</li><li><strong>Operador:</strong> Debe seguir todas las reglas de seguridad, realizar inspecciones pre-turno, reportar peligros e incidentes inmediatamente</li></ul>" },
        ],
        takeaways: [
          "Un PIT es cualquier vehículo motorizado usado para mover, levantar o apilar materiales",
          "Hay 7 clasificaciones de OSHA para camiones industriales motorizados",
          "Los operadores deben tener 18+ años, estar capacitados y autorizados",
          "La certificación es válida por 3 años",
        ],
      }),
    },
  },
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "Autorización y Cultura de Trabajo Seguro",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Autorización y Cultura de Trabajo Seguro",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Reportar Peligros", content: "<p>Como operador, usted es responsable de reportar inmediatamente cualquier condición insegura: equipo dañado, derrames, obstrucciones, mala iluminación o incidentes cercanos. Nunca asuma que alguien más lo reportará.</p>" },
          { heading: "Sin Pasajeros — Nunca", content: "<p>Su montacargas está diseñado para transportar de forma segura <strong>solo una persona — el operador</strong>. Nunca permita pasajeros en las horquillas, los lados o cualquier parte del camión a menos que use una plataforma de seguridad aprobada por OSHA con barandillas, tablones de pie y un arnés de protección contra caídas.</p>" },
          { heading: "Manténgase Alerta", content: "<ul><li>No use el teléfono celular mientras opera</li><li>No use audífonos o auriculares</li><li>No juegue o conduzca de manera imprudente</li><li>Mantenga todo su cuerpo dentro de la jaula protectora en todo momento</li><li>Nunca opere bajo la influencia de drogas o alcohol</li></ul>" },
          { heading: "Aplicación de OSHA", content: "<p>OSHA puede realizar <strong>inspecciones sin previo aviso</strong>. Las multas por operadores no certificados pueden alcanzar <strong>$7,000 por día por empleado no calificado</strong>, retroactivas a la fecha de contratación. Un solo operador no certificado trabajando por un año podría resultar en casi <strong>$2 millones</strong> en multas.</p>" },
        ],
        takeaways: [
          "Reporte todos los peligros e incidentes inmediatamente",
          "No lleve pasajeros a menos que use una plataforma de seguridad aprobada",
          "Manténgase alerta — sin teléfonos, audífonos o juegos",
          "Las multas de OSHA por incumplimiento son severas",
        ],
        warning: "La conducción imprudente y el juego están estrictamente prohibidos y pueden resultar en terminación y violaciones de OSHA.",
      }),
    },
  },
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "Verificación de Conocimiento: Fundamentos y Responsabilidades",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuándo es aceptable llevar un pasajero en un montacargas?", type: "mcq_single", options: ["Al conducir lentamente", "Cuando una plataforma de seguridad aprobada por OSHA con barandillas está correctamente instalada", "Durante emergencias", "Cuando el supervisor lo aprueba"], correctAnswers: "Cuando una plataforma de seguridad aprobada por OSHA con barandillas está correctamente instalada", explanation: "Los pasajeros nunca están permitidos a menos que se use una plataforma de trabajo aprobada por OSHA con barandillas, tablones de pie y protección contra caídas." },
      { question: "Si nota una fuga menor de aceite en el montacargas durante la inspección pre-turno, debe:", type: "mcq_single", options: ["Continuar trabajando y reportar al final del turno", "Reportarlo inmediatamente y no operar hasta que se autorice", "Limpiarlo y seguir trabajando", "Solo reportar si empeora"], correctAnswers: "Reportarlo inmediatamente y no operar hasta que se autorice", explanation: "Cualquier preocupación de seguridad debe reportarse inmediatamente. Los vehículos no deben operarse hasta que se consideren seguros." },
      { question: "Todo su cuerpo debe permanecer dentro de la jaula protectora del montacargas en todo momento mientras opera.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Mantenga todas las partes del cuerpo dentro del área del operador para evitar peligros de aplastamiento con el mástil, la protección superior o los objetos circundantes." },
    ],
  },

  // ═══ MÓDULO 2: Estabilidad + Manejo de Cargas ═══
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Triángulo de Estabilidad y Centro de Gravedad",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Triángulo de Estabilidad y Centro de Gravedad",
        image: img("stability-triangle.svg"),
        sections: [
          { heading: "¿Qué es el Triángulo de Estabilidad?", content: "<p>El <strong>triángulo de estabilidad</strong> es la base de tres puntos formada por los dos extremos del eje delantero y el punto de pivote del eje trasero. Mientras el centro de gravedad combinado del camión y su carga se mantenga dentro de este triángulo, el montacargas permanece estable.</p>" },
          { heading: "Riesgo de Volcadura", content: "<p>Cuando el centro de gravedad se desplaza fuera del triángulo de estabilidad — debido a sobrecarga, giros bruscos u operación en pendientes — el montacargas puede <strong>volcarse</strong>. Las volcaduras son una de las principales causas de fatalidades con montacargas.</p><ul><li>Nunca haga giros bruscos a velocidad</li><li>Reduzca la velocidad antes de girar</li><li>Sea extra precavido en rampas, pendientes y superficies irregulares</li></ul>" },
          { heading: "Estabilidad Lateral", content: "<p>Girar demasiado rápido desplaza el centro de gravedad lateralmente. Cuanto más alta sea la carga, más inestable se vuelve el camión durante los giros. Siempre <strong>reduzca la velocidad antes de girar</strong>, no durante el giro.</p>" },
        ],
        takeaways: [
          "El triángulo de estabilidad está formado por los extremos del eje delantero y el pivote del eje trasero",
          "Mantenga el centro de gravedad dentro del triángulo para prevenir volcaduras",
          "Reduzca la velocidad antes de girar — los giros bruscos causan inestabilidad lateral",
          "Cargas más altas significan mayor riesgo de volcadura durante los giros",
        ],
        warning: "Las volcaduras están entre las principales causas de fatalidades de operadores de montacargas. Siempre respete el triángulo de estabilidad.",
      }),
    },
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Capacidad Nominal y Placa de Datos",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Capacidad Nominal y Placa de Datos",
        image: img("load-center.svg"),
        sections: [
          { heading: "La Placa de Datos", content: "<p>Cada montacargas tiene una <strong>placa de datos</strong> del fabricante que indica la capacidad máxima de elevación a varios centros de carga. Antes de levantar cualquier carga, verifique que su montacargas esté clasificado para manejar su peso.</p>" },
          { heading: "Centro de Carga", content: "<p>El <strong>centro de carga</strong> es la distancia desde la cara vertical de la horquilla hasta el centro de la carga. La capacidad de un montacargas disminuye a medida que aumenta el centro de carga. Siempre verifique que está usando el equipo correcto para el peso y tamaño de la carga.</p>" },
          { heading: "Los Accesorios Reducen la Capacidad", content: "<p>Usar accesorios (pinzas, rotadores, extensiones de horquilla) cambia el centro de gravedad del camión y <strong>reduce la capacidad nominal</strong>. Siempre verifique la capacidad ajustada cuando use cualquier accesorio.</p>" },
          { heading: "Nunca Sobrecargue", content: "<p>Exceder la capacidad nominal aumenta enormemente el riesgo de inestabilidad y volcadura. Muestre los límites de peso claramente en el vehículo. Si una carga parece demasiado pesada o desequilibrada, no intente levantarla — consiga un camión de mayor capacidad.</p>" },
        ],
        takeaways: [
          "Siempre verifique la placa de datos para la capacidad nominal antes de levantar",
          "La capacidad disminuye a medida que aumenta la distancia del centro de carga",
          "Los accesorios reducen la capacidad nominal del montacargas",
          "Nunca exceda la capacidad nominal — use un camión más grande si es necesario",
        ],
      }),
    },
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Recoger y Transportar Cargas de Forma Segura",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Recoger y Transportar Cargas de Forma Segura",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Posición de las Horquillas", content: "<p>Lleve las horquillas lo más bajo posible — típicamente <strong>4 a 6 pulgadas</strong> del suelo. Esto baja el centro de gravedad y reduce el riesgo de volcadura.</p>" },
          { heading: "Inclinación del Mástil", content: "<p>Incline el mástil ligeramente hacia atrás cuando viaje con una carga para estabilizarla. Nunca incline las cargas hacia adelante excepto al depositarlas. La inclinación excesiva hacia adelante puede causar que el camión se vuelque.</p>" },
          { heading: "Visibilidad", content: "<p>Si una carga bloquea su vista hacia adelante, <strong>conduzca en reversa</strong> para mantener una línea de visión clara. Use ayudantes cuando navegue espacios reducidos o áreas con visibilidad limitada.</p>" },
          { heading: "Asegurar las Cargas", content: "<p>Antes de transportar cualquier carga, asegúrese de que esté <strong>correctamente asegurada y balanceada</strong>. Puede necesitar película plástica o correas para prevenir el desplazamiento durante el transporte. Nunca mueva una carga no asegurada.</p>" },
        ],
        takeaways: [
          "Lleve las horquillas a 4–6 pulgadas del suelo",
          "Incline el mástil hacia atrás cuando viaje con una carga",
          "Conduzca en reversa si la carga bloquea su vista hacia adelante",
          "Siempre asegure las cargas antes de moverlas",
        ],
        tip: "Cuando no pueda ver más allá de la carga, viaje en reversa y use un ayudante para áreas reducidas.",
      }),
    },
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Verificación de Conocimiento: Estabilidad y Cargas",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Al viajar con una carga, las horquillas deben estar:", type: "mcq_single", options: ["Elevadas lo más alto posible", "A nivel de los ojos", "4 a 6 pulgadas del suelo", "Tocando el suelo"], correctAnswers: "4 a 6 pulgadas del suelo", explanation: "Llevar las horquillas a 4–6 pulgadas del suelo mantiene el centro de gravedad bajo y reduce el riesgo de volcadura." },
      { question: "Usar accesorios en un montacargas afecta:", type: "mcq_single", options: ["El color del montacargas", "La capacidad nominal — se reduce", "El volumen de la bocina", "La presión de las llantas"], correctAnswers: "La capacidad nominal — se reduce", explanation: "Los accesorios cambian el centro de gravedad y reducen la capacidad de elevación nominal del montacargas." },
      { question: "Debe reducir la velocidad antes de entrar en un giro, no durante el giro.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Reducir la velocidad durante un giro aumenta la inestabilidad lateral. Siempre reduzca la velocidad antes de comenzar a girar." },
      { question: "Si una carga es demasiado pesada para su montacargas, debe:", type: "mcq_single", options: ["Intentar levantarla con cuidado", "Usar un camión de mayor capacidad", "Agregar contrapeso en la parte trasera", "Conducir más rápido para impulso"], correctAnswers: "Usar un camión de mayor capacidad", explanation: "Nunca exceda la capacidad nominal. Consiga el equipo adecuado para el trabajo." },
    ],
  },

  // ═══ MÓDULO 3: Inspección Pre-Operación + Combustible/Carga ═══
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Lista de Inspección Pre-Turno",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Lista de Inspección Pre-Turno",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Su Responsabilidad", content: "<p>Como operador, es <strong>su responsabilidad</strong> realizar una inspección de seguridad diaria antes de usar la máquina. Esto debe hacerse al <strong>inicio de cada turno</strong>.</p>" },
          { heading: "Inspección Visual", content: "<p>Camine alrededor de todo el vehículo, verificando:</p><ul><li><strong>Llantas:</strong> Revise daños, inflado apropiado</li><li><strong>Horquillas:</strong> Inspeccione grietas, dobleces o desgaste excesivo</li><li><strong>Cadenas e hidráulicos:</strong> Revise fugas y daños</li><li><strong>Luces, bocina y alarma de reversa:</strong> Pruebe funcionalidad</li><li><strong>Frenos:</strong> Pruebe tanto los frenos de servicio como los de estacionamiento</li><li><strong>Dirección:</strong> Verifique la respuesta</li><li><strong>Niveles de fluidos:</strong> Revise combustible, aceite, refrigerante, fluido hidráulico</li><li><strong>Cinturón de seguridad:</strong> Asegúrese de que funcione correctamente</li></ul>" },
          { heading: "Marcar Equipo Inseguro", content: "<p>Si encuentra algún problema de seguridad, <strong>no opere el montacargas</strong>. Reporte el problema a su supervisor o equipo de mantenimiento inmediatamente. Marque el equipo para que nadie más lo use hasta que se completen las reparaciones.</p>" },
        ],
        takeaways: [
          "La inspección pre-turno es requerida antes de cada turno",
          "Revise llantas, horquillas, cadenas, hidráulicos, luces, bocina, frenos, dirección",
          "Marque y reporte cualquier equipo inseguro inmediatamente",
          "Nunca opere un montacargas que no pase la inspección",
        ],
        tip: "Siempre abróchese el cinturón de seguridad antes de arrancar el motor — es su protección principal en una volcadura.",
      }),
    },
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Mantenimiento y Reparaciones",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Mantenimiento y Reparaciones",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Reparar Antes de Usar", content: "<p>Si se identifica un problema de seguridad durante la inspección, <strong>las reparaciones deben hacerse antes de que se use el equipo</strong>. Nunca opere un montacargas con defectos conocidos.</p>" },
          { heading: "Fugas de Fluidos", content: "<p>No opere ningún vehículo con <strong>fugas de combustible, aceite o hidráulico</strong>. Las fugas hidráulicas pueden provocar la pérdida repentina del control de la carga, creando una situación extremadamente peligrosa.</p>" },
          { heading: "Documentar y Reportar", content: "<p>Todos los problemas de mantenimiento deben documentarse y reportarse. Esto crea un registro para el cumplimiento y ayuda a prevenir problemas recurrentes.</p>" },
        ],
        takeaways: [
          "Las reparaciones deben completarse antes de usar el equipo",
          "Nunca opere un montacargas con fugas de fluidos",
          "Documente todos los problemas de mantenimiento para el cumplimiento",
        ],
      }),
    },
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Seguridad en Combustible y Carga",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Seguridad en Combustible y Carga (GLP / Eléctrico)",
        image: img("ppe-gloves.svg"),
        sections: [
          { heading: "Solo en Áreas Designadas", content: "<p>El reabastecimiento y la recarga <strong>solo deben ocurrir en áreas designadas</strong> con ventilación adecuada. Nunca reabastezca en áreas de trabajo generales.</p>" },
          { heading: "Requisitos de EPP", content: "<ul><li>Use <strong>guantes</strong> al manejar tanques de GLP</li><li>Use <strong>protección ocular</strong> según corresponda</li><li>Siga los requisitos específicos de EPP de su instalación</li></ul>" },
          { heading: "Prohibido Fumar", content: "<p>Los empleados tienen <strong>estrictamente prohibido fumar</strong> o usar cualquier llama abierta mientras operan un montacargas. Las chispas o llamas abiertas deben mantenerse a al menos <strong>50 pies</strong> de las estaciones de reabastecimiento y áreas de recarga de baterías.</p>" },
          { heading: "Seguridad con GLP", content: "<p>Al cambiar tanques de propano: revise si hay fugas, asegure la conexión correcta y verifique que el tanque esté asegurado. Reporte cualquier olor a gas inmediatamente.</p>" },
          { heading: "Seguridad de Baterías Eléctricas", content: "<p>Al cargar baterías: apague el cargador antes de conectar/desconectar. Las baterías eléctricas producen gas hidrógeno durante la carga — asegure ventilación adecuada para prevenir riesgo de explosión.</p>" },
        ],
        takeaways: [
          "Reabastezca/recargue solo en áreas designadas y ventiladas",
          "Use EPP al manejar tanques de GLP y baterías",
          "Prohibido fumar a 50 pies de estaciones de combustible y recarga",
          "Asegure ventilación adecuada al cargar baterías eléctricas",
        ],
      }),
    },
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Verificación de Conocimiento: Inspección y Combustible",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuándo debe realizarse la inspección pre-turno?", type: "mcq_single", options: ["Al final de cada turno", "Solo cuando el supervisor lo solicita", "Al inicio de cada turno, antes de operar", "Una vez a la semana"], correctAnswers: "Al inicio de cada turno, antes de operar", explanation: "Las inspecciones pre-turno son obligatorias al inicio de cada turno antes de operar el montacargas." },
      { question: "Si descubre una fuga hidráulica durante la inspección pre-turno, debe:", type: "mcq_single", options: ["Continuar trabajando con cuidado", "Reportarlo y NO operar el montacargas", "Rellenar el fluido hidráulico y continuar", "Revisar de nuevo al final del turno"], correctAnswers: "Reportarlo y NO operar el montacargas", explanation: "Nunca opere un montacargas con fugas de fluidos. Las fugas hidráulicas pueden causar pérdida repentina del control de la carga." },
      { question: "Está prohibido fumar dentro de cuántos pies de las áreas de combustible o carga:", type: "mcq_single", options: ["10 pies", "25 pies", "50 pies", "100 pies"], correctAnswers: "50 pies", explanation: "Prohibido fumar o llamas abiertas dentro de 50 pies de estaciones de reabastecimiento y áreas de recarga de baterías." },
    ],
  },

  // ═══ MÓDULO 4: Conducción Segura + Peatones ═══
  {
    module: "Conducción Segura y Peatones",
    title: "Velocidad y Control del Vehículo",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Velocidad y Control del Vehículo",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Límites de Velocidad", content: "<p>La velocidad segura en un almacén es típicamente <strong>5 mph o menos</strong>. Siempre siga los límites de velocidad publicados en su instalación. Factores que requieren velocidades más lentas incluyen:</p><ul><li>Pisos húmedos o resbalosos</li><li>Áreas congestionadas</li><li>Pasillos estrechos</li><li>Intersecciones y esquinas ciegas</li><li>Áreas cerca de peatones</li></ul>" },
          { heading: "Dirección Trasera", content: "<p>Los montacargas tienen <strong>dirección trasera</strong>, lo que significa que la parte trasera oscila hacia afuera al girar. Esto es lo opuesto a un automóvil. Esté atento al espacio alrededor de la parte trasera del montacargas al girar.</p>" },
          { heading: "Frenado", content: "<p>Mantenga una distancia de frenado segura. Frene gradualmente — el frenado brusco puede causar deslizamiento de la carga o volcadura. Nunca frene bruscamente a menos que sea una emergencia.</p>" },
        ],
        takeaways: [
          "Velocidad máxima segura en almacén: 5 mph o menos",
          "Los montacargas tienen dirección trasera — la parte trasera oscila al girar",
          "Frene gradualmente para evitar deslizamiento de carga",
          "Reduzca la velocidad en pisos húmedos, áreas congestionadas y cerca de peatones",
        ],
      }),
    },
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Intersecciones y Puntos Ciegos",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Intersecciones y Puntos Ciegos",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Protocolo en Intersecciones", content: "<p>En cada intersección, puerta o área donde los peatones puedan estar presentes:</p><ol><li><strong>Deténgase completamente</strong></li><li><strong>Toque la bocina</strong></li><li>Mire en ambas direcciones</li><li>Proceda lentamente solo cuando sea seguro</li></ol>" },
          { heading: "Esquinas Ciegas", content: "<p>Las esquinas ciegas son especialmente peligrosas. Use espejos, reduzca la velocidad y <strong>siempre toque la bocina</strong> antes de proceder alrededor de cualquier esquina donde no pueda ver lo que viene.</p>" },
          { heading: "Puertas y Entradas", content: "<p>Al acercarse a puertas, reduzca la velocidad y toque la bocina. Nunca pase rápidamente por una puerta.</p>" },
        ],
        takeaways: [
          "Deténgase, toque la bocina y mire antes de pasar por cualquier intersección",
          "Use espejos y bocina en esquinas ciegas",
          "Reduzca la velocidad al acercarse a puertas y entradas",
          "Los peatones siempre tienen el derecho de paso",
        ],
      }),
    },
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Seguridad de Peatones",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Seguridad de Peatones",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "Los Peatones Siempre Tienen el Derecho de Paso", content: "<p>Como operador de montacargas, usted <strong>siempre</strong> debe ceder el paso a los peatones. Si un peatón está en su camino, deténgase y espere. Nunca asuma que se moverán.</p>" },
          { heading: "Zonas de Seguridad para Peatones", content: "<p>Muchos lugares de trabajo tienen carriles peatonales designados y cruces peatonales. Respete estas zonas y nunca conduzca a través de un cruce peatonal mientras los peatones estén presentes.</p>" },
          { heading: "Contacto Visual", content: "<p>Haga contacto visual con los peatones cuando sea posible. Use la bocina para alertar su presencia. No confíe en que los peatones escuchen o noten su montacargas.</p>" },
          { heading: "Nunca Levante Personas en las Horquillas", content: "<p>Es <strong>absolutamente prohibido</strong> levantar o transportar una persona en las horquillas vacías o en una tarima sobre las horquillas. Solo se permite elevar personas usando una plataforma de seguridad aprobada por OSHA.</p>" },
        ],
        takeaways: [
          "Los peatones siempre tienen el derecho de paso",
          "Respete las zonas y cruces peatonales designados",
          "Haga contacto visual y use la bocina para alertar su presencia",
          "Nunca levante personas en las horquillas sin una plataforma aprobada",
        ],
      }),
    },
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Conducción en Superficies Difíciles",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Conducción en Superficies Difíciles",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Pisos Mojados o Resbalosos", content: "<p>Reduzca significativamente la velocidad en pisos mojados, aceitosos o resbalosos. La distancia de frenado aumenta dramáticamente en superficies resbalosas.</p>" },
          { heading: "Superficies Irregulares", content: "<p>Cuando opere en superficies irregulares, reduzca la velocidad y tenga precaución extrema. Los baches, grietas y superficies irregulares pueden desestabilizar la carga o causar una volcadura.</p>" },
          { heading: "Operación al Aire Libre", content: "<p>Cuando opere al aire libre, tenga en cuenta condiciones climáticas adversas — viento, lluvia, nieve o hielo. El viento puede desestabilizar cargas altas. Lluvia y hielo aumentan la distancia de frenado.</p>" },
        ],
        takeaways: [
          "Reduzca la velocidad significativamente en pisos mojados o resbalosos",
          "Tenga extrema precaución en superficies irregulares",
          "Considere las condiciones climáticas al operar al aire libre",
          "La distancia de frenado aumenta en superficies mojadas",
        ],
      }),
    },
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Verificación de Conocimiento: Conducción Segura",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuál es la velocidad máxima segura recomendada para un montacargas en un almacén?", type: "mcq_single", options: ["3 mph", "5 mph", "10 mph", "15 mph"], correctAnswers: "5 mph", explanation: "OSHA recomienda un máximo de 5 mph en ambientes de almacén." },
      { question: "En intersecciones y esquinas ciegas, los operadores de montacargas deben:", type: "mcq_single", options: ["Acelerar para pasar rápidamente", "Detenerse, tocar la bocina y proceder lentamente después de verificar", "Confiar en que los peatones se moverán", "Encender las luces"], correctAnswers: "Detenerse, tocar la bocina y proceder lentamente después de verificar", explanation: "Los operadores deben detenerse, tocar la bocina y mirar en ambas direcciones antes de proceder por cualquier intersección." },
      { question: "Los peatones cerca de operaciones de montacargas:", type: "mcq_single", options: ["Deben moverse rápidamente", "Siempre tienen el derecho de paso", "Deben usar chalecos reflectantes para ser vistos", "Deben señalar al operador"], correctAnswers: "Siempre tienen el derecho de paso", explanation: "Los peatones siempre tienen el derecho de paso. Los operadores de montacargas deben ceder el paso a los peatones en todo momento." },
    ],
  },

  // ═══ MÓDULO 5: Rampas, Muelles y Trabajo Elevado ═══
  {
    module: "Rampas, Muelles y Elevación",
    title: "Operación en Rampas y Pendientes",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Operación en Rampas y Pendientes",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Regla de Rampas", content: "<p>La regla es sencilla: <strong>la carga siempre apunta cuesta arriba</strong>.</p><ul><li><strong>Subiendo con carga:</strong> Conduzca hacia adelante (la carga mira cuesta arriba)</li><li><strong>Bajando con carga:</strong> Conduzca en reversa (la carga sigue mirando cuesta arriba)</li><li><strong>Sin carga:</strong> Las horquillas vacías siempre apuntan cuesta abajo</li></ul>" },
          { heading: "Nunca Gire en una Rampa", content: "<p>Nunca gire o cruce lateralmente una pendiente. El riesgo de volcadura lateral es extremo en rampas.</p>" },
          { heading: "Velocidad en Rampas", content: "<p>Mantenga una velocidad lenta y controlada. Nunca exceda los límites de velocidad publicados en rampas. No se detenga en una rampa con carga a menos que sea absolutamente necesario.</p>" },
        ],
        takeaways: [
          "La carga siempre apunta cuesta arriba en rampas",
          "Nunca gire o cruce lateralmente en una pendiente",
          "Mantenga velocidad lenta y controlada en rampas",
          "Sin carga: las horquillas apuntan cuesta abajo",
        ],
      }),
    },
  },
  {
    module: "Rampas, Muelles y Elevación",
    title: "Operaciones en Muelles de Carga",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Operaciones en Muelles de Carga",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Antes de Entrar a un Remolque", content: "<p>Antes de conducir dentro de cualquier camión o remolque:</p><ul><li>Verifique que el remolque esté <strong>correctamente calzado</strong> (calzas en las ruedas)</li><li>Confirme que los <strong>frenos del remolque estén puestos</strong></li><li>Revise la condición del piso del remolque — busque podredumbre, hoyos o debilidad</li><li>Asegúrese de que una <strong>placa de muelle</strong> esté correctamente posicionada</li></ul>" },
          { heading: "Placas de Muelle", content: "<p>Nunca intente conducir directamente del muelle al remolque sin una placa de muelle. Esto puede resultar en una carga derramada o un montacargas atascado. Mantenga las horquillas a la altura recomendada de <strong>4–6 pulgadas</strong> al entrar.</p>" },
          { heading: "Conciencia del Borde", content: "<p>Mantenga al menos <strong>el ancho de una llanta</strong> de distancia de los bordes del muelle o bordes de la plataforma. Los peligros de caída son un riesgo serio en áreas de muelle.</p>" },
          { heading: "Movimiento del Remolque", content: "<p>La fuerza de frenado de un montacargas puede causar que un remolque sin frenos se aleje del muelle, potencialmente atrapando el montacargas adentro. <strong>Siempre verifique calzas y frenos</strong> antes de entrar.</p>" },
        ],
        takeaways: [
          "Siempre verifique calzas y frenos antes de entrar a un remolque",
          "Use una placa de muelle — nunca salte el espacio",
          "Revise la condición del piso del remolque antes de conducir sobre él",
          "Mantenga al menos el ancho de una llanta del borde del muelle",
        ],
      }),
    },
  },
  {
    module: "Rampas, Muelles y Elevación",
    title: "Elevación de Personas y Trabajo Elevado",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Elevación de Personas y Trabajo Elevado",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Nunca Eleve Personas en las Horquillas Vacías", content: "<p>Es <strong>nunca aceptable</strong> elevar a una persona en las horquillas sin una plataforma de seguridad aprobada. Esto incluye pararse sobre tarimas, cubetas o cualquier plataforma improvisada.</p>" },
          { heading: "Plataformas de Seguridad Aprobadas", content: "<p>Una plataforma de seguridad aprobada por OSHA debe incluir:</p><ul><li><strong>Barandillas de 42 pulgadas</strong> en todos los lados</li><li>Barandilla intermedia posicionada a mitad de camino entre la barandilla superior y la plataforma</li><li><strong>Tablones de pie de 4 pulgadas</strong></li><li>Sujeción segura al mástil (cadena o dispositivo de cierre)</li><li><strong>Protección superior de 7 pies</strong> para protección contra aplastamiento</li><li>Protección personal contra caídas (línea de seguridad y arnés)</li></ul>" },
          { heading: "Responsabilidades del Operador Durante la Elevación", content: "<p>Al elevar a una persona en una plataforma: el motor debe permanecer encendido, el operador debe <strong>permanecer en los controles en todo momento</strong>, y el montacargas no debe ser conducido a otra ubicación con una persona elevada.</p>" },
        ],
        takeaways: [
          "Nunca eleve personas en horquillas vacías o plataformas improvisadas",
          "Solo use plataformas aprobadas por OSHA con barandillas y protección contra caídas",
          "El operador debe permanecer en los controles mientras alguien esté elevado",
          "Nunca mueva el montacargas con una persona elevada en una plataforma",
        ],
      }),
    },
  },
  {
    module: "Rampas, Muelles y Elevación",
    title: "Verificación de Conocimiento: Rampas, Muelles y Elevación",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Al viajar SUBIENDO una rampa con carga, la carga debe mirar:", type: "mcq_single", options: ["Cuesta abajo", "Cuesta arriba", "No importa", "De lado"], correctAnswers: "Cuesta arriba", explanation: "Al viajar en una rampa con carga, mantenga la carga apuntando cuesta arriba para evitar que se deslice de las horquillas." },
      { question: "¿Es aceptable elevar a un trabajador de mantenimiento en las horquillas sin una plataforma de seguridad?", type: "mcq_single", options: ["Sí, si se sujeta", "No, nunca sin una plataforma de seguridad aprobada", "Sí, para tareas rápidas", "Solo con aprobación del supervisor"], correctAnswers: "No, nunca sin una plataforma de seguridad aprobada", explanation: "Elevar personas en horquillas vacías nunca es aceptable. Se requiere una plataforma de seguridad aprobada por OSHA con barandillas, tablones de pie y protección contra caídas." },
      { question: "Una plataforma de seguridad aprobada por OSHA debe incluir barandillas, tablones de pie y protección contra caídas.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Las plataformas aprobadas deben tener barandillas de 42 pulgadas, barandillas intermedias, tablones de pie de 4 pulgadas, sujeción segura al mástil, protección superior y protección personal contra caídas." },
    ],
  },

  // ═══ MÓDULO 6: Estacionamiento, Montacargas Desatendido y Apagado ═══
  {
    module: "Estacionamiento y Apagado",
    title: "Estacionamiento y Aseguramiento del Montacargas",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Estacionamiento y Aseguramiento del Montacargas",
        image: img("parking-shutdown.svg"),
        sections: [
          { heading: "Procedimiento de Estacionamiento", content: "<p>Al estacionar su montacargas:</p><ol><li><strong>Baje las horquillas</strong> completamente planas al suelo</li><li>Incline las horquillas ligeramente hacia adelante</li><li><strong>Ponga el freno de estacionamiento</strong></li><li><strong>Neutralice todos los controles</strong></li><li><strong>Apague el motor/energía</strong></li><li><strong>Retire la llave</strong></li></ol>" },
          { heading: "Ubicación de Estacionamiento", content: "<p>Estacione solo en <strong>áreas designadas</strong>. Nunca bloquee salidas de incendio, equipo de emergencia o carriles de tráfico. Si estaciona en una pendiente, calce las ruedas.</p>" },
        ],
        takeaways: [
          "Baje horquillas, ponga freno, neutralice controles, apague motor, retire llave",
          "Estacione solo en áreas designadas",
          "Nunca bloquee salidas de incendio o equipo de emergencia",
          "Calce las ruedas si estaciona en una pendiente",
        ],
      }),
    },
  },
  {
    module: "Estacionamiento y Apagado",
    title: "Definición de Montacargas Desatendido",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "Montacargas Desatendido: Cuándo y Qué Hacer",
        image: img("parking-shutdown.svg"),
        sections: [
          { heading: "Qué Significa 'Desatendido'", content: "<p>Un montacargas se considera <strong>desatendido</strong> cuando el operador está a <strong>más de 25 pies de distancia</strong> del vehículo Y el vehículo está <strong>fuera de su línea de visión</strong>.</p>" },
          { heading: "Procedimiento de Desatendido", content: "<p>Al dejar un montacargas desatendido:</p><ul><li>Apague la energía</li><li>Ponga los frenos</li><li>Baje las horquillas completamente</li><li>Regrese el mástil a posición vertical</li><li>Retire la llave para prevenir uso no autorizado</li><li>Calce las ruedas si está en una pendiente</li></ul>" },
          { heading: "Temporalmente Desmontado (Dentro de 25 Pies)", content: "<p>Si está dentro de 25 pies y tiene el montacargas en su línea de visión:</p><ul><li>Baje las horquillas</li><li>Neutralice los controles</li><li>Ponga los frenos</li></ul><p>No necesita retirar la llave en este caso, pero el montacargas debe estar asegurado.</p>" },
          { heading: "Reportar Accidentes", content: "<p>Reporte <strong>todos los accidentes</strong>, incluso los menores — incluyendo rasguños menores, casi-accidentes y daños a la propiedad. No reportar puede resultar en acción disciplinaria y oculta problemas de seguridad que necesitan ser abordados.</p>" },
        ],
        takeaways: [
          "Desatendido = 25+ pies de distancia Y fuera de la línea de visión",
          "Apagado completo requerido cuando desatendido: energía apagada, freno puesto, llave retirada",
          "Dentro de 25 pies: baje horquillas, neutralice controles, ponga frenos",
          "Reporte TODOS los accidentes, incluso los menores",
        ],
      }),
    },
  },
  {
    module: "Estacionamiento y Apagado",
    title: "Verificación de Conocimiento: Estacionamiento y Apagado",
    type: "checkpoint",
    estimatedMinutes: 1,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Al dejar un montacargas desatendido, los pasos correctos incluyen:", type: "mcq_single", options: ["Solo apagar el motor", "Bajar horquillas, poner freno, apagar motor, retirar llave", "Solo poner el freno", "Nada si es solo por unos minutos"], correctAnswers: "Bajar horquillas, poner freno, apagar motor, retirar llave", explanation: "Cuando desatendido: apague la energía, ponga los frenos, baje las horquillas, regrese el mástil a posición vertical y retire la llave." },
      { question: "Debe reportar accidentes incluso si parecen menores.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Todos los accidentes deben reportarse, incluyendo los menores y los casi-accidentes. Esto ayuda a identificar y corregir problemas de seguridad." },
    ],
  },

  // ═══ MÓDULO 7: Reglas Específicas del Sitio + Paquete del Empleador ═══
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "La Importancia de la Capacitación Específica del Sitio",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "La Importancia de la Capacitación Específica del Sitio",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Cada Lugar de Trabajo es Diferente", content: "<p>Cada lugar de trabajo tiene peligros únicos: pasillos estrechos, patrones de tráfico peatonal específicos, muelles de carga, configuraciones de estantería, áreas de almacenamiento frío, áreas exteriores y más. Su supervisor debe revisar las <strong>políticas específicas del sitio</strong> con usted antes de operar en cualquier nueva ubicación.</p>" },
          { heading: "Temas Específicos del Sitio", content: "<ul><li>Límites de velocidad de la instalación y patrones de tráfico</li><li>Áreas designadas de estacionamiento y carga</li><li>Zonas peatonales y cruces</li><li>Procedimientos de emergencia y puntos de reunión</li><li>Protocolos de comunicación (radio, señales)</li><li>Tipos de equipo específicos y accesorios utilizados</li></ul>" },
          { heading: "Capacitación de Actualización", content: "<p>Se requiere capacitación adicional cuando:</p><ul><li>Opera un nuevo tipo de equipo</li><li>Trabaja en una nueva instalación</li><li>Después de un accidente o casi-accidente</li><li>Cuando se observa operación insegura</li></ul>" },
        ],
        takeaways: [
          "Cada lugar de trabajo tiene peligros únicos que requieren capacitación específica del sitio",
          "Su supervisor debe revisar las políticas del sitio antes de que usted opere",
          "Se requiere capacitación adicional para equipo o instalaciones nuevas",
          "Después de accidentes o comportamiento inseguro observado, se requiere recapacitación",
        ],
      }),
    },
  },
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "Reglas y Regulaciones de OSHA (Referencia)",
    type: "download",
    estimatedMinutes: 1,
    config: {
      description: "Este documento de referencia describe las normas de seguridad esenciales de OSHA para operadores de camiones industriales motorizados. Su capacitación ha sido cubierta por las lecciones de este curso — esto se proporciona como referencia adicional.",
      downloads: [
        { label: "Directrices de OSHA para Operación Segura de PITs (PDF)", url: "/api/documents/osha-rules-regulations/download?locale=es", filename: "OSHA-Guidelines-for-the-Safe-Operation-of-Powered-Industrial-Trucks.pdf" },
      ],
    },
  },
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "Paquete de Evaluación Práctica del Empleador",
    type: "download",
    estimatedMinutes: 2,
    config: {
      description: "Su empleador debe completar una evaluación práctica antes de que pueda operar un montacargas en su instalación. Proporcione estos formularios a su supervisor. Incluyen la lista de evaluación de desempeño, formulario de permiso/autorización del operador y hoja de asistencia del sitio.",
      downloads: [
        { label: "Prueba de Desempeño (PDF)", url: "/api/documents/performance-evaluation/download?locale=es", filename: "PERFORMANCE-TEST.pdf" },
        { label: "Permiso de Operación PIT (PDF)", url: "/api/documents/operator-permit/download?locale=es", filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf" },
        { label: "Formulario de Asistencia y Programación (PDF)", url: "/api/documents/attendance-sheet/download?locale=es", filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf" },
      ],
      important: "Haga que su supervisor complete estos formularios y los mantenga archivados. OSHA puede solicitar estos registros durante las inspecciones.",
    },
  },
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "Presentación del Sitio (Referencia)",
    type: "download",
    estimatedMinutes: 1,
    config: {
      description: "Esta presentación cubre las directrices de OSHA, tipos de equipo, procedimientos de operación segura y protocolos de carga. Sirve como referencia integral para operadores de montacargas.",
      downloads: [
        { label: "Presentación de Capacitación Forklift Certified (PDF)", url: "/api/documents/site-presentation/download?locale=es", filename: "Forklift-Certified-Training.pdf" },
      ],
    },
  },

  // ═══ MÓDULO 8: Examen Final + Finalización ═══
  {
    module: "Examen Final y Finalización",
    title: "Examen Final: Certificación de Operador de Montacargas",
    type: "exam",
    estimatedMinutes: 15,
    config: {
      passing_score: 80,
      max_attempts: 3,
      randomize_questions: true,
    },
    questions: [
      { question: "¿Cuál es la velocidad máxima segura recomendada para un montacargas en un almacén?", type: "mcq_single", options: ["3 mph", "5 mph", "10 mph", "15 mph"], correctAnswers: "5 mph", explanation: "OSHA recomienda un máximo de 5 mph en ambientes de almacén." },
      { question: "Antes de operar un montacargas al inicio de cada turno, debe:", type: "mcq_single", options: ["Arrancar el motor y probarlo mientras conduce", "Realizar una inspección pre-operación", "Cargar primero para probar las horquillas", "Solo revisar el nivel de combustible"], correctAnswers: "Realizar una inspección pre-operación", explanation: "Se debe realizar una inspección pre-operación completa antes de cada turno." },
      { question: "¿Qué norma de OSHA cubre los camiones industriales motorizados (montacargas)?", type: "mcq_single", options: ["29 CFR 1910.176", "29 CFR 1910.178", "29 CFR 1910.180", "29 CFR 1926.602"], correctAnswers: "29 CFR 1910.178", explanation: "29 CFR 1910.178 es la norma específica de OSHA para camiones industriales motorizados." },
      { question: "¿Con qué frecuencia deben ser re-evaluados los operadores de montacargas según OSHA?", type: "mcq_single", options: ["Cada año", "Cada 2 años", "Cada 3 años", "Cada 5 años"], correctAnswers: "Cada 3 años", explanation: "OSHA requiere re-evaluación del operador al menos cada tres años." },
      { question: "Al viajar con una carga grande que bloquea su vista hacia adelante, debe:", type: "mcq_single", options: ["Conducir lentamente hacia adelante", "Viajar en reversa para mantener una línea de visión clara", "Tocar la bocina repetidamente mientras conduce hacia adelante", "Hacer que alguien camine adelante"], correctAnswers: "Viajar en reversa para mantener una línea de visión clara", explanation: "Cuando una carga obstruye la visión hacia adelante, el operador debe viajar en reversa para mantener una línea de visión clara." },
      { question: "El triángulo de estabilidad en un montacargas está formado por:", type: "mcq_single", options: ["Las luces de advertencia del tablero", "Los dos extremos del eje delantero y el punto de pivote del eje trasero", "Los tres pedales", "El medidor de combustible, temperatura e indicadores de batería"], correctAnswers: "Los dos extremos del eje delantero y el punto de pivote del eje trasero", explanation: "El triángulo de estabilidad es la base de tres puntos formada por los dos extremos del eje delantero y el punto de pivote del eje trasero." },
      { question: "¿Cuándo es aceptable llevar pasajeros en un montacargas?", type: "mcq_single", options: ["Nunca, a menos que una plataforma de seguridad aprobada por OSHA esté montada", "Al ir lentamente", "Solo en emergencias", "Cuando un supervisor lo permite"], correctAnswers: "Nunca, a menos que una plataforma de seguridad aprobada por OSHA esté montada", explanation: "Los pasajeros nunca están permitidos a menos que se use una plataforma de trabajo aprobada por OSHA con barandillas y protección contra caídas." },
      { question: "En intersecciones y esquinas ciegas, los operadores de montacargas deben:", type: "mcq_single", options: ["Acelerar para pasar rápidamente", "Detenerse, tocar la bocina y proceder lentamente después de verificar", "Confiar en que los peatones se moverán", "Encender las luces"], correctAnswers: "Detenerse, tocar la bocina y proceder lentamente después de verificar", explanation: "Los operadores deben detenerse, tocar la bocina y mirar en ambas direcciones antes de proceder por cualquier intersección." },
      { question: "Los montacargas deben ser reabastecidos o recargados:", type: "mcq_single", options: ["En cualquier lugar conveniente", "Solo en áreas designadas con ventilación adecuada", "Mientras el motor está encendido", "Cerca del muelle de carga"], correctAnswers: "Solo en áreas designadas con ventilación adecuada", explanation: "El reabastecimiento/recarga solo debe ocurrir en áreas designadas y bien ventiladas." },
      { question: "La causa principal de volcaduras de montacargas es:", type: "mcq_single", options: ["Falla del motor", "Sobrecarga y giros inadecuados", "Llantas defectuosas", "Bajo combustible"], correctAnswers: "Sobrecarga y giros inadecuados", explanation: "La mayoría de las volcaduras resultan de exceder la capacidad de carga o girar demasiado bruscamente/rápidamente." },
      { question: "¿Cuál es la edad mínima requerida para operar un montacargas?", type: "mcq_single", options: ["16", "18", "21", "Sin mínimo con capacitación"], correctAnswers: "18", explanation: "OSHA requiere que los operadores tengan al menos 18 años de edad." },
      { question: "¿Quién es responsable de asegurar que los operadores de montacargas estén debidamente capacitados?", type: "mcq_single", options: ["El operador", "El empleador", "OSHA directamente", "El fabricante del montacargas"], correctAnswers: "El empleador", explanation: "Bajo 29 CFR 1910.178(l), el empleador es responsable de asegurar que los operadores estén capacitados y evaluados." },
      { question: "Al SUBIR una rampa con carga, debe:", type: "mcq_single", options: ["Conducir hacia adelante con la carga apuntando cuesta arriba", "Conducir en reversa con la carga apuntando cuesta abajo", "Conducir de lado para estabilidad", "Acelerar para impulso"], correctAnswers: "Conducir hacia adelante con la carga apuntando cuesta arriba", explanation: "Al subir una rampa con carga, viaje con la carga apuntando cuesta arriba — conduzca hacia adelante subiendo la rampa." },
      { question: "¿A qué distancia del suelo deben llevarse las horquillas al viajar?", type: "mcq_single", options: ["A la altura de la rodilla", "A la altura de la cintura", "4 a 6 pulgadas", "Completamente en el suelo"], correctAnswers: "4 a 6 pulgadas", explanation: "Lleve las horquillas a 4–6 pulgadas del suelo para mantener el centro de gravedad bajo y reducir el riesgo de volcadura." },
      { question: "Al estacionar un montacargas y dejarlo desatendido, debe:", type: "mcq_single", options: ["Solo apagar el motor", "Bajar horquillas, poner freno, apagar motor y retirar la llave", "Dejarlo encendido para el siguiente operador", "Solo poner el freno de estacionamiento"], correctAnswers: "Bajar horquillas, poner freno, apagar motor y retirar la llave", explanation: "Se requiere apagado completo: bajar horquillas, poner freno, apagar motor, retirar llave y calzar las ruedas si está en una pendiente." },
      { question: "Un montacargas se considera 'desatendido' cuando el operador está:", type: "mcq_single", options: ["A 5 pies", "A 10 pies", "A más de 25 pies y fuera de la línea de visión", "En el mismo edificio"], correctAnswers: "A más de 25 pies y fuera de la línea de visión", explanation: "Un vehículo está desatendido cuando el operador está a más de 25 pies Y el vehículo está fuera de su vista." },
      { question: "Usar accesorios en un montacargas:", type: "mcq_single", options: ["Aumenta la capacidad nominal", "No tiene efecto en la capacidad", "Reduce la capacidad nominal", "Solo afecta la velocidad"], correctAnswers: "Reduce la capacidad nominal", explanation: "Los accesorios cambian el centro de gravedad y reducen la capacidad de elevación nominal del montacargas." },
      { question: "Los peatones cerca de operaciones de montacargas:", type: "mcq_single", options: ["Deben moverse rápidamente", "Siempre tienen el derecho de paso", "Deben usar chalecos reflectantes para ser vistos", "Deben señalar al operador"], correctAnswers: "Siempre tienen el derecho de paso", explanation: "Los peatones siempre tienen el derecho de paso. Los operadores de montacargas deben ceder el paso a los peatones en todo momento." },
      { question: "Este curso en línea por sí solo satisface completamente todos los requisitos de capacitación de OSHA para montacargas.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "OSHA requiere instrucción formal (este curso) MÁS capacitación práctica y evaluación conducida por el empleador." },
      { question: "Si descubre una fuga hidráulica durante la inspección pre-turno, debe:", type: "mcq_single", options: ["Continuar trabajando con cuidado", "Reportarlo y NO operar el montacargas", "Rellenar el fluido hidráulico y continuar", "Revisar de nuevo al final del turno"], correctAnswers: "Reportarlo y NO operar el montacargas", explanation: "Nunca opere un montacargas con fugas de fluidos. Las fugas hidráulicas pueden causar pérdida repentina del control de la carga." },
      { question: "Está prohibido fumar dentro de cuántos pies de las áreas de combustible o carga:", type: "mcq_single", options: ["10 pies", "25 pies", "50 pies", "100 pies"], correctAnswers: "50 pies", explanation: "Prohibido fumar o llamas abiertas dentro de 50 pies de estaciones de reabastecimiento y áreas de recarga de baterías." },
      { question: "Antes de conducir dentro de un remolque en un muelle de carga, debe verificar:", type: "mcq_single", options: ["El color del remolque coincide con el pedido", "Las calzas están en su lugar y los frenos están puestos", "El remolque está vacío", "La luz del muelle está verde"], correctAnswers: "Las calzas están en su lugar y los frenos están puestos", explanation: "Siempre verifique que las calzas estén colocadas y los frenos del remolque estén puestos para prevenir que el remolque se separe del muelle." },
      { question: "¿Cuándo deben los operadores de montacargas tocar su bocina?", type: "mcq_single", options: ["Solo en emergencias", "En intersecciones, esquinas ciegas y áreas con peatones", "Solo cuando el supervisor está mirando", "Solo al aire libre"], correctAnswers: "En intersecciones, esquinas ciegas y áreas con peatones", explanation: "Toque la bocina en intersecciones, esquinas ciegas, puertas y cuando sea que los peatones puedan estar presentes." },
      { question: "Una plataforma de seguridad aprobada por OSHA para elevar personas debe incluir:", type: "mcq_single", options: ["Solo una superficie plana", "Barandillas, tablones de pie, sujeción al mástil y protección contra caídas", "Una escalera", "Nada especial — cualquier plataforma funciona"], correctAnswers: "Barandillas, tablones de pie, sujeción al mástil y protección contra caídas", explanation: "OSHA requiere barandillas de 42 pulgadas, barandillas intermedias, tablones de pie de 4 pulgadas, sujeción segura al mástil, protección superior y protección personal contra caídas." },
      { question: "Los operadores deben mantener todo su cuerpo dentro de la jaula protectora del montacargas en todo momento.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Nunca extienda ninguna parte del cuerpo más allá de la jaula protectora para evitar peligros de aplastamiento." },
      { question: "Las multas de OSHA por operar sin la certificación adecuada de montacargas pueden alcanzar:", type: "mcq_single", options: ["$100 por empleado", "$1,000 por empleado", "$7,000 por día por empleado no calificado", "Sin multas, solo advertencias"], correctAnswers: "$7,000 por día por empleado no calificado", explanation: "OSHA puede multar a los empleadores hasta $7,000 por día por operador no certificado, retroactivo a la fecha de contratación." },
      { question: "Después de aprobar exitosamente el examen final, ¿qué debe hacer aún su empleador?", type: "mcq_single", options: ["Nada — está completamente certificado", "Realizar capacitación práctica y evaluación en el lugar de trabajo", "Presentar documentación ante OSHA", "Comprarle un casco"], correctAnswers: "Realizar capacitación práctica y evaluación en el lugar de trabajo", explanation: "El empleador aún debe proporcionar capacitación práctica específica al equipo y lugar de trabajo, y evaluar el desempeño del operador." },
    ],
  },
  {
    module: "Examen Final y Finalización",
    title: "Felicitaciones: ¿Qué Sigue?",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "¡Está Certificado! ¿Qué Sigue?",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "Su Certificado", content: "<p>¡Felicitaciones por completar la porción de instrucción formal de su certificación de operador de montacargas! Su certificado digital ahora está disponible para descargar. Incluye un número de certificado único y código QR que los empleadores pueden usar para verificación instantánea.</p>" },
          { heading: "Siguiente Paso: Evaluación Práctica", content: "<p>Recuerde, su empleador aún debe completar la <strong>evaluación práctica en persona</strong> en su lugar de trabajo. Comparta el paquete de documentación del empleador (disponible en el Módulo 7) con su supervisor. Incluye:</p><ul><li>Lista de Evaluación de Desempeño</li><li>Formulario de Permiso / Autorización del Operador</li><li>Hoja de Asistencia del Sitio</li></ul>" },
          { heading: "Tarjeta de Billetera (Opcional)", content: "<p>¿Desea una tarjeta de identificación de operador profesional tamaño billetera? Ordene su tarjeta física desde su página de certificación. Facilita mostrar prueba de capacitación en el trabajo.</p>" },
          { heading: "Manténgase Seguro", content: "<p>Su capacitación no termina aquí. Continúe siguiendo los procedimientos de operación segura todos los días. Si alguna vez tiene preguntas o necesita una actualización, puede volver a visitar este curso en cualquier momento. ¡Manténgase seguro!</p>" },
        ],
        takeaways: [
          "Descargue su certificado desde su página de certificación",
          "Comparta el paquete del empleador con su supervisor para la evaluación práctica",
          "Considere ordenar una tarjeta de identificación de operador tamaño billetera",
          "La re-evaluación es requerida al menos cada 3 años",
        ],
        tip: "Guarde el enlace de su página de verificación — los empleadores pueden usarlo para verificar instantáneamente su certificación.",
      }),
    },
  },
];
