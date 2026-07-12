import { StepDef, QuestionDef } from "./course-content-aerial-ttt";

export const CANONICAL_COURSE_ES = {
  title: "Certificación Capacitar al Capacitador de Elevadores Aéreos y de Tijera",
  slug: "certificacion-capacitar-capacitador-elevadores-aereos-en-linea",
  description: "Certificación integral Capacitar al Capacitador en cumplimiento con OSHA para capacitación de operadores de elevadores aéreos y de tijera. Combina metodología de capacitación con contenido específico de elevadores aéreos cubriendo OSHA 29 CFR 1926.453, 1910.178(l)(2)(iii) y estándares ANSI/SAIA A92. Al completar, estará calificado para capacitar y evaluar operadores de elevadores aéreos y de tijera en sus instalaciones.",
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
  // ═══ MÓDULO 0: Marco Regulatorio OSHA para Elevadores Aéreos ═══
  {
    module: "Marco Regulatorio OSHA para Elevadores Aéreos",
    title: "Bienvenida y Marco Regulatorio de Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Bienvenida y Marco Regulatorio de Elevadores Aéreos",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Acerca de Este Curso", content: "<p>¡Bienvenido a la Certificación Capacitar al Capacitador de Elevadores Aéreos y de Tijera! Este curso lo prepara para convertirse en un <strong>instructor calificado de operadores de elevadores aéreos y de tijera</strong>.</p>" },
          { heading: "Calificaciones del Instructor", content: "<p>Bajo <strong>29 CFR 1910.178(l)(2)(iii)</strong>, la capacitación y evaluación debe ser conducida por personas con <strong>conocimiento, capacitación y experiencia</strong>.</p>" },
          { heading: "Marco Regulatorio", content: "<p>La capacitación de elevadores aéreos se rige por: <strong>29 CFR 1926.453</strong> (elevadores aéreos), <strong>29 CFR 1910.178(l)</strong> (camiones industriales), <strong>ANSI A92.20</strong> (diseño), <strong>A92.22</strong> (uso seguro), <strong>A92.24</strong> (capacitación).</p>" },
          { heading: "Nota Importante", content: "<p>Este curso lo califica para <strong>capacitar y evaluar operadores</strong>. <strong>No</strong> lo certifica para operar equipo.</p>" },
        ],
        takeaways: [
          "Calificaciones: conocimiento, capacitación y experiencia",
          "Regulado bajo 1926.453, 1910.178 y ANSI A92",
          "A92.24 cubre requisitos de capacitación de MEWP",
          "Califica instructores — no operadores",
        ],
        warning: "Este curso no lo certifica para operar elevadores aéreos.",
      }),
    },
  },
  {
    module: "Marco Regulatorio OSHA para Elevadores Aéreos",
    title: "Requisitos de Capacitación ANSI A92.24",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Requisitos de Capacitación ANSI A92.24",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Quién Debe Ser Capacitado?", content: "<p>ANSI A92.24 requiere capacitación para: <strong>operadores</strong>, <strong>ocupantes</strong>, <strong>supervisores</strong>, y <strong>personal de servicio</strong>.</p>" },
          { heading: "Contenido de Capacitación", content: "<p>Debe cubrir: manual del operador, inspección, peligros comunes, protección contra caídas, selección de MEWP, controles, movimiento, apagado.</p>" },
          { heading: "Familiarización", content: "<p>Antes de operar un MEWP específico, los operadores deben ser <strong>familiarizados</strong> con los controles, diferencias, características especiales, y el manual.</p>" },
          { heading: "Recapacitación", content: "<p>Requerida cuando: operación insegura, accidente, evaluación fallida, nuevo tipo de MEWP, o cambios en el lugar de trabajo.</p>" },
        ],
        takeaways: [
          "A92.24 requiere capacitación para operadores, ocupantes, supervisores, servicio",
          "Cubrir inspección, peligros, protección contra caídas, controles",
          "Familiarización con cada marca/modelo es requerida",
          "Recapacitación por operación insegura, accidentes, equipo nuevo",
        ],
        tip: "Mantenga un registro de familiarización para cada operador y cada marca/modelo de MEWP.",
      }),
    },
  },
  {
    module: "Marco Regulatorio OSHA para Elevadores Aéreos",
    title: "Verificación de Conocimiento: Marco Regulatorio",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Qué estándar ANSI cubre requisitos de capacitación para operadores de MEWP?", type: "mcq_single", options: ["A92.20", "A92.22", "A92.24", "A92.26"], correctAnswers: "A92.24", explanation: "ANSI A92.24 cubre requisitos de capacitación." },
      { question: "¿Qué deben completar los operadores antes de operar un MEWP específico?", type: "mcq_single", options: ["Un examen médico", "Familiarización con el equipo específico", "Un curso universitario", "Nada"], correctAnswers: "Familiarización con el equipo específico", explanation: "La familiarización con cada marca/modelo es requerida." },
      { question: "ANSI A92.24 requiere capacitación para:", type: "mcq_single", options: ["Solo operadores", "Solo supervisores", "Operadores, ocupantes, supervisores y personal de servicio", "Solo nuevos empleados"], correctAnswers: "Operadores, ocupantes, supervisores y personal de servicio", explanation: "A92.24 requiere capacitación para todos los cuatro grupos." },
    ],
  },

  // ═══ MÓDULO 1: Aprendizaje de Adultos y Diseño de Capacitación ═══
  {
    module: "Aprendizaje de Adultos y Diseño de Capacitación",
    title: "Principios de Aprendizaje de Adultos para Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Principios de Aprendizaje de Adultos para Elevadores Aéreos",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Principios Clave", content: "<p>Los adultos aprenden mejor cuando la capacitación es <strong>relevante</strong>, <strong>basada en experiencia</strong> y <strong>centrada en problemas</strong>.</p>" },
          { heading: "Estilos de Aprendizaje", content: "<p>Incluya <strong>visual</strong> (diagramas de estabilidad), <strong>auditivo</strong> (explicaciones), <strong>kinestésico</strong> (práctica con equipo).</p>" },
          { heading: "Estructura", content: "<ol><li><strong>Instrucción formal</strong> — OSHA/ANSI, tipos de equipo, estabilidad, protección contra caídas</li><li><strong>Capacitación práctica</strong> — inspección, controles, elevación, conducción, emergencias</li><li><strong>Evaluación</strong> — examen y habilidades prácticas</li><li><strong>Familiarización</strong> — orientación específica al equipo</li></ol>" },
          { heading: "Materiales", content: "<p>Manuales del fabricante, estándares ANSI A92, listas de inspección, equipo de protección contra caídas, formularios de evaluación, plantillas de plan de rescate.</p>" },
        ],
        takeaways: [
          "Haga la capacitación relevante con escenarios reales",
          "Incluya elementos visuales, auditivos y kinestésicos",
          "Estructura: instrucción, práctica, evaluación, familiarización",
          "Prepare manuales del fabricante y estándares ANSI",
        ],
      }),
    },
  },
  {
    module: "Aprendizaje de Adultos y Diseño de Capacitación",
    title: "Verificación de Conocimiento: Aprendizaje de Adultos",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Los adultos aprenden mejor cuando la capacitación es:", type: "mcq_single", options: ["Puramente teórica", "Relevante y basada en experiencia", "Basada en memorización", "En conferencias largas"], correctAnswers: "Relevante y basada en experiencia", explanation: "Los adultos aprenden mejor cuando es relevante y basada en experiencia." },
      { question: "La estructura recomendada incluye:", type: "mcq_single", options: ["Solo aula", "Instrucción formal, práctica, evaluación, familiarización", "Solo práctica", "Solo examen"], correctAnswers: "Instrucción formal, práctica, evaluación, familiarización", explanation: "Cuatro fases completas." },
    ],
  },

  // ═══ MÓDULO 2: Temas Requeridos de Elevadores Aéreos ═══
  {
    module: "Temas Requeridos de Elevadores Aéreos",
    title: "Temas Relacionados con el Equipo",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Temas Relacionados con el Equipo",
        image: img("aerial-lift-hero.svg"),
        sections: [
          { heading: "Conocimiento del Equipo", content: "<p>Cubra: tipos de MEWPs, operación de tijera y pluma, controles, capacidad, estabilidad, protección contra caídas, inspección, controles de emergencia, estabilizadores.</p>" },
          { heading: "Consejos de Enseñanza", content: "<p>Use el MEWP real, demuestre la placa de capacidad, muestre el equipo de protección contra caídas, camine por una inspección completa, demuestre el descenso de emergencia.</p>" },
        ],
        takeaways: [
          "Cubra todos los tipos: tijera, pluma, vertical",
          "Incluya protección contra caídas, estabilidad, capacidad, emergencias",
          "Use el MEWP real para enseñar controles",
        ],
      }),
    },
  },
  {
    module: "Temas Requeridos de Elevadores Aéreos",
    title: "Temas Relacionados con el Lugar de Trabajo",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Temas Relacionados con el Lugar de Trabajo",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Temas Específicos del Sitio", content: "<p>Condiciones de superficie, tráfico de peatones, peligros aéreos, clima, peligros eléctricos, protección contra caídas, atmósferas peligrosas, control de tráfico, rescate.</p>" },
          { heading: "Seguridad con Líneas de Energía", content: "<p>Distancias mínimas: hasta 50kV: 10 pies, 50kV-200kV: 15 pies, 200kV-350kV: 20 pies, 350kV-500kV: 25 pies.</p>" },
          { heading: "Planificación de Rescate", content: "<p>ANSI A92.22 requiere un <strong>plan de rescate</strong> antes del uso del MEWP.</p>" },
        ],
        takeaways: [
          "Personalice los temas a los peligros de su instalación",
          "Enseñe distancias de líneas de energía y procedimientos de emergencia",
          "ANSI A92.22 requiere un plan de rescate",
        ],
      }),
    },
  },
  {
    module: "Temas Requeridos de Elevadores Aéreos",
    title: "Verificación de Conocimiento: Temas Requeridos",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuál es la distancia mínima de líneas de energía hasta 50kV?", type: "mcq_single", options: ["5 pies", "10 pies", "15 pies", "25 pies"], correctAnswers: "10 pies", explanation: "Mínimo 10 pies." },
      { question: "¿Qué requiere ANSI A92.22 antes del uso del MEWP?", type: "mcq_single", options: ["Reporte climático", "Plan de rescate", "Segundo operador", "Grabación"], correctAnswers: "Plan de rescate", explanation: "Requiere un plan de rescate." },
      { question: "Los temas del lugar de trabajo deben ser:", type: "mcq_single", options: ["Genéricos", "Personalizados a su instalación", "Omitidos", "Memorizados"], correctAnswers: "Personalizados a su instalación", explanation: "Son específicos del sitio." },
    ],
  },

  // ═══ MÓDULO 3: Capacitación Práctica y Evaluación ═══
  {
    module: "Capacitación Práctica y Evaluación",
    title: "Metodología de Capacitación Práctica para Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Metodología de Capacitación Práctica para Elevadores Aéreos",
        image: img("scissor-lift-hero.svg"),
        sections: [
          { heading: "Habilidades a Practicar", content: "<p>Inspección pre-operación, controles, elevación/descenso, conducción, protección contra caídas, estabilizadores, descenso de emergencia, apagado.</p>" },
          { heading: "Ciclo Demostrar-Practicar-Evaluar", content: "<ol><li><strong>Demostrar</strong></li><li><strong>Práctica guiada</strong></li><li><strong>Práctica independiente</strong></li><li><strong>Evaluar</strong></li></ol>" },
          { heading: "Seguridad", content: "<p>El instructor es responsable de la seguridad. Mantenga área despejada, detenga comportamientos inseguros.</p>" },
        ],
        takeaways: [
          "Practique: inspección, controles, elevación, protección contra caídas, emergencias",
          "Use el ciclo demostrar-practicar-evaluar",
          "La seguridad es responsabilidad del instructor",
        ],
      }),
    },
  },
  {
    module: "Capacitación Práctica y Evaluación",
    title: "Evaluación de Operadores de Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Evaluación de Operadores de Elevadores Aéreos",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Lista de Evaluación", content: "<p>Inspección, protección contra caídas, controles, elevación, estabilizadores, condiciones de superficie, peligros aéreos, emergencias, apagado.</p>" },
          { heading: "Fallas Críticas", content: "<p>Sin arnés, operación cerca de líneas sin distancia, exceder capacidad, no desplegar estabilizadores.</p>" },
          { heading: "Documentación", content: "<p>Certifique con: nombre, fechas, identidad del instructor, tipo de equipo.</p>" },
        ],
        takeaways: [
          "Cree una lista de evaluación para habilidades de elevadores aéreos",
          "Fallas críticas: sin arnés, violación de líneas de energía, exceder capacidad",
          "Documente con nombre, fechas, instructor, tipo de equipo",
        ],
      }),
    },
  },
  {
    module: "Capacitación Práctica y Evaluación",
    title: "Verificación de Conocimiento: Capacitación Práctica",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuál es una falla crítica durante la evaluación?", type: "mcq_single", options: ["Conducción lenta", "No usar arnés", "Olvidar tocar la bocina", "Estacionarse descentrado"], correctAnswers: "No usar arnés", explanation: "No usar protección contra caídas es una falla crítica." },
      { question: "Durante la evaluación, el instructor debe:", type: "mcq_single", options: ["Coaching", "Observar sin coaching", "Tomar control", "Omitir items"], correctAnswers: "Observar sin coaching", explanation: "Observe sin coaching." },
    ],
  },

  // ═══ MÓDULO 4: Administración y Cultura de Seguridad ═══
  {
    module: "Administración y Cultura de Seguridad",
    title: "Administrando Su Programa de Capacitación de Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Administrando Su Programa de Capacitación de Elevadores Aéreos",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Gestión de Registros", content: "<p>Mantenga: registros de capacitación, listas de evaluación, registros de familiarización (por marca/modelo), planes de rescate, reportes de incidentes, recapacitación.</p>" },
          { heading: "Disparadores de Recapacitación", content: "<p>Operación insegura, accidente, evaluación fallida, nuevo MEWP, cambios en el lugar de trabajo, o cada 3 años.</p>" },
          { heading: "Cultura de Seguridad", content: "<p>Como instructor, es un <strong>líder de seguridad</strong>. Lidere con el ejemplo.</p>" },
        ],
        takeaways: [
          "Mantenga registros de capacitación, evaluación y familiarización",
          "Recapacitación por operación insegura, accidentes, equipo nuevo",
          "El instructor es un líder de seguridad",
        ],
      }),
    },
  },
  {
    module: "Administración y Cultura de Seguridad",
    title: "Verificación de Conocimiento: Administración y Cultura",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Los registros de familiarización deben llevarse por:", type: "mcq_single", options: ["Cada operador", "Cada marca/modelo de MEWP", "Cada instalación", "Cada año"], correctAnswers: "Cada marca/modelo de MEWP", explanation: "Rastree qué operadores están familiarizados con cada marca/modelo." },
      { question: "Como instructor, su rol es:", type: "mcq_single", options: ["Solo enseñar", "Ser líder de seguridad y liderar con el ejemplo", "Solo aplicar reglas", "Solo guardar registros"], correctAnswers: "Ser líder de seguridad y liderar con el ejemplo", explanation: "El instructor es un líder de seguridad." },
    ],
  },

  // ═══ MÓDULO 5: Examen Final y Finalización ═══
  {
    module: "Examen Final y Finalización",
    title: "Examen Final: Capacitar al Capacitador de Elevadores Aéreos",
    type: "exam",
    estimatedMinutes: 15,
    config: { passing_score: 80, max_attempts: 3, randomize_questions: true },
    questions: [
      { question: "¿Qué norma OSHA cubre elevadores aéreos?", type: "mcq_single", options: ["29 CFR 1910.178", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.450"], correctAnswers: "29 CFR 1926.453", explanation: "29 CFR 1926.453 cubre elevadores aéreos." },
      { question: "¿Qué estándar ANSI cubre requisitos de capacitación de MEWP?", type: "mcq_single", options: ["A92.20", "A92.22", "A92.24", "A92.26"], correctAnswers: "A92.24", explanation: "A92.24 cubre requisitos de capacitación." },
      { question: "¿Qué tres calificaciones debe poseer un instructor?", type: "mcq_single", options: ["Título, certificado, licencia", "Conocimiento, capacitación y experiencia", "Edad, educación, aptitud", "Antigüedad, aprobación, permanencia"], correctAnswers: "Conocimiento, capacitación y experiencia", explanation: "Conocimiento, capacitación y experiencia." },
      { question: "¿Qué deben completar los operadores antes de un MEWP específico?", type: "mcq_single", options: ["Examen médico", "Familiarización", "Curso universitario", "Nada"], correctAnswers: "Familiarización", explanation: "Familiarización con cada marca/modelo." },
      { question: "¿Distancia mínima de líneas hasta 50kV?", type: "mcq_single", options: ["5 pies", "10 pies", "15 pies", "25 pies"], correctAnswers: "10 pies", explanation: "Mínimo 10 pies." },
      { question: "¿Qué requiere ANSI A92.22 antes del uso del MEWP?", type: "mcq_single", options: ["Reporte climático", "Plan de rescate", "Segundo operador", "Grabación"], correctAnswers: "Plan de rescate", explanation: "Plan de rescate." },
      { question: "Desde 1998, qué protección contra caídas es requerida?", type: "mcq_single", options: ["Cinturón corporal", "Arnés de cuerpo completo", "Sin protección", "Red de seguridad"], correctAnswers: "Arnés de cuerpo completo", explanation: "Arnés de cuerpo completo." },
      { question: "¿Un elevador de tijera es qué grupo de MEWP?", type: "mcq_single", options: ["Grupo A", "Grupo B", "Grupo C", "Grupo D"], correctAnswers: "Grupo A", explanation: "Grupo A." },
      { question: "Durante la evaluación, el instructor debe:", type: "mcq_single", options: ["Coaching", "Observar sin coaching", "Tomar control", "Omitir items"], correctAnswers: "Observar sin coaching", explanation: "Observe sin coaching." },
      { question: "Este curso lo certifica para:", type: "mcq_single", options: ["Operar elevadores", "Capacitar y evaluar operadores de elevadores", "Inspeccionar para OSHA", "Vender materiales"], correctAnswers: "Capacitar y evaluar operadores de elevadores", explanation: "Capacitar y evaluar operadores." },
      { question: "La recapacitación es requerida cuando:", type: "mcq_single", options: ["Solo cada 3 años", "Se observa operación insegura", "Solo cuando OSHA visita", "Solo nuevos empleados"], correctAnswers: "Se observa operación insegura", explanation: "Operación insegura, accidentes, etc." },
      { question: "ANSI A92.24 requiere capacitación para:", type: "mcq_single", options: ["Solo operadores", "Solo supervisores", "Operadores, ocupantes, supervisores, servicio", "Solo nuevos"], correctAnswers: "Operadores, ocupantes, supervisores, servicio", explanation: "Los cuatro grupos." },
      { question: "Los temas del lugar de trabajo deben ser:", type: "mcq_single", options: ["Genéricos", "Personalizados a su instalación", "Omitidos", "Memorizados"], correctAnswers: "Personalizados a su instalación", explanation: "Específicos del sitio." },
      { question: "Como instructor, es un:", type: "mcq_single", options: ["Solo maestro", "Líder de seguridad", "Aplicador de reglas", "Guardián de registros"], correctAnswers: "Líder de seguridad", explanation: "Líder de seguridad." },
      { question: "¿Cuál es una falla crítica de evaluación?", type: "mcq_single", options: ["Conducción lenta", "No usar arnés", "Olvidar bocina", "Estacionarse descentrado"], correctAnswers: "No usar arnés", explanation: "No usar arnés es una falla crítica." },
      { question: "La línea debe attacherse a:", type: "mcq_single", options: ["Cualquier objeto", "Punto de anclaje designado", "Viga del edificio", "Protección superior"], correctAnswers: "Punto de anclaje designado", explanation: "Punto de anclaje designado por el fabricante." },
      { question: "Nunca opere un MEWP durante:", type: "mcq_single", options: ["Llovizna", "Tormenta/relámpagos", "Nublado", "Clima fresco"], correctAnswers: "Tormenta/relámpagos", explanation: "Nunca durante tormentas." },
      { question: "Si un MEWP contacta una línea, el operador debe:", type: "mcq_single", options: ["Saltar", "Quedarse y llamar al 911", "Empujar la línea", "Bajar por la pluma"], correctAnswers: "Quedarse y llamar al 911", explanation: "Quédese en la plataforma." },
      { question: "Los controles deben probarse:", type: "mcq_single", options: ["Semanalmente", "Mensualmente", "Cada día antes del uso", "Solo después de reparaciones"], correctAnswers: "Cada día antes del uso", explanation: "Diariamente antes del uso." },
      { question: "Los adultos aprenden mejor cuando:", type: "mcq_single", options: ["Puramente teórica", "Relevante y basada en experiencia", "Memorización", "Conferencias largas"], correctAnswers: "Relevante y basada en experiencia", explanation: "Relevante y basada en experiencia." },
    ],
  },
  {
    module: "Examen Final y Finalización",
    title: "Felicitaciones: Es un Instructor Certificado de Elevadores Aéreos",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "¡Es un Instructor Certificado de Elevadores Aéreos! ¿Qué Sigue?",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Su Certificación", content: "<p>¡Felicitaciones! Está calificado para <strong>capacitar y evaluar operadores de elevadores aéreos y de tijera</strong> bajo OSHA 29 CFR 1926.453, 1910.178(l)(2)(iii) y ANSI/SAIA A92.</p>" },
          { heading: "Próximos Pasos", content: "<ul><li>Descargue su certificado</li><li>Desarrolle su currículo específico</li><li>Cree listas de evaluación y planes de rescate</li><li>Programe familiarización para cada MEWP</li><li>Mantenga su competencia como operador</li></ul>" },
          { heading: "Manténgase Actualizado", content: "<p>Manténgase al día con OSHA y ANSI. Los estándares A92 fueron revisados en 2020.</p>" },
        ],
        takeaways: [
          "Está calificado para capacitar y evaluar operadores de elevadores aéreos",
          "Desarrolle currículo y planes de rescate específicos",
          "Programe familiarización para cada MEWP",
          "Manténgase al día con OSHA y ANSI A92",
        ],
        tip: "Comience con una sesión piloto para refinar su currículo.",
      }),
    },
  },
];
