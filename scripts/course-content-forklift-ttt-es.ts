import { StepDef, QuestionDef } from "./course-content-forklift-ttt";

export const CANONICAL_COURSE_ES = {
  title: "Certificación Capacitar al Capacitador de Montacargas",
  slug: "certificacion-capacitar-capacitador-montacargas-en-linea",
  description: "Certificación integral Capacitar al Capacitador en cumplimiento con OSHA para capacitación de operadores de montacargas. Cubre las calificaciones de instructor bajo OSHA 29 CFR 1910.178(l)(2)(iii), principios de aprendizaje de adultos, diseño de programas de capacitación, todos los temas requeridos por OSHA, metodología de capacitación práctica, evaluación de operadores, administración de programas y cultura de seguridad. Al completar, estará calificado para capacitar y evaluar operadores de montacargas en sus instalaciones.",
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
  // ═══ MÓDULO 0: Marco Regulatorio OSHA ═══
  {
    module: "Marco Regulatorio OSHA",
    title: "Bienvenida y Marco Regulatorio OSHA",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Bienvenida y Marco Regulatorio OSHA",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Acerca de Este Curso", content: "<p>¡Bienvenido a la Certificación Capacitar al Capacitador de Montacargas! Este curso lo prepara para convertirse en un <strong>instructor calificado de operadores de montacargas</strong> bajo OSHA 29 CFR 1910.178(l)(2)(iii). El curso toma aproximadamente <strong>2-3 horas</strong>.</p>" },
          { heading: "Calificaciones del Instructor (1910.178(l)(2)(iii))", content: "<p>OSHA establece: <em>\"Toda la capacitación y evaluación de operadores será conducida por personas que tengan el conocimiento, capacitación y experiencia para capacitar operadores de camiones industriales motorizados y evaluar su competencia.\"</em></p><p>OSHA <strong>no</strong> requiere una certificación específica para instructores. Se requieren tres calificaciones:</p><ol><li><strong>Conocimiento</strong> — de la norma OSHA y el tema</li><li><strong>Capacitación</strong> — capacitación formal sobre los temas que enseñará</li><li><strong>Experiencia</strong> — experiencia práctica operando el equipo</li></ol>" },
          { heading: "Lo Que Cubre Este Curso", content: "<ul><li>Revisión completa de 29 CFR 1910.178</li><li>Responsabilidades del empleador bajo la norma</li><li>Requisitos de documentación y certificación</li><li>Los 22 temas requeridos de capacitación</li><li>Principios de aprendizaje de adultos y metodología</li><li>Diseño de capacitación práctica y evaluación de operadores</li><li>Administración de programas y cultura de seguridad</li></ul>" },
          { heading: "Nota Importante", content: "<p>Este curso lo califica para <strong>capacitar y evaluar operadores</strong>. <strong>No</strong> lo certifica para operar equipo. Debe ser un operador competente de montacargas antes de tomar este curso.</p>" },
        ],
        takeaways: [
          "OSHA requiere que los instructores tengan conocimiento, capacitación y experiencia",
          "No se requiere certificación específica de instructor por OSHA",
          "Este curso cubre la capacitación formal para instructores",
          "Capacitar al Capacitador NO lo certifica para operar equipo",
        ],
        warning: "Este curso no lo certifica para operar un montacargas. Debe ser un operador competente.",
      }),
    },
  },
  {
    module: "Marco Regulatorio OSHA",
    title: "Responsabilidades del Empleador y Documentación",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Responsabilidades del Empleador y Documentación",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Deber del Empleador (1910.178(l)(1))", content: "<p>El empleador es responsable de asegurar que cada operador sea <strong>capacitado</strong>, <strong>evaluado</strong> y <strong>certificado</strong>. Esto incluye capacitación inicial, evaluación de competencia, recapacitación cuando sea necesaria, y re-evaluación al menos cada 3 años.</p>" },
          { heading: "Requisitos de Certificación (1910.178(l)(6))", content: "<p>La certificación debe incluir: <strong>nombre del operador</strong>, <strong>fecha de capacitación</strong>, <strong>fecha de evaluación</strong>, y <strong>identidad de la persona(s)</strong> que realiza la capacitación o evaluación.</p>" },
          { heading: "Conservación de Registros", content: "<p>Mantenga registros de capacitación disponibles para inspección de OSHA. Mejor práctica: conservar durante el empleo más 3 años. Incluya: currículo, listas de evaluación, permisos de operador, registros de recapacitación, reportes de incidentes.</p>" },
          { heading: "Inspección y Aplicación de OSHA", content: "<p>OSHA puede realizar <strong>inspecciones sin previo aviso</strong>. Las multas por incumplimiento pueden alcanzar <strong>$15,625 por violación seria</strong> (2023), y hasta <strong>$156,259</strong> por violaciones intencionales o repetidas.</p>" },
        ],
        takeaways: [
          "El empleador es responsable de la capacitación y evaluación de operadores",
          "La certificación debe incluir nombre, fechas y identidad del instructor",
          "Conserve registros durante el empleo más 3 años",
          "Las multas de OSHA pueden exceder $15,000 por violación",
        ],
        tip: "Cree un archivo de capacitación para cada operador con certificación, evaluaciones y recapacitación.",
      }),
    },
  },
  {
    module: "Marco Regulatorio OSHA",
    title: "Verificación de Conocimiento: Marco OSHA",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Qué tres calificaciones debe tener un instructor de montacargas según OSHA?", type: "mcq_single", options: ["Título universitario, certificado de enseñanza, 5 años de experiencia", "Conocimiento, capacitación y experiencia", "Diploma de secundaria, certificación de montacargas, aprobación del supervisor", "Certificación de OSHA, primeros auxilios, licencia de conducir"], correctAnswers: "Conocimiento, capacitación y experiencia", explanation: "OSHA requiere que los instructores tengan conocimiento, capacitación y experiencia para capacitar operadores y evaluar su competencia." },
      { question: "¿Qué debe incluir la certificación del operador según 1910.178(l)(6)?", type: "mcq_single", options: ["Número de Seguro Social del operador", "Nombre del operador, fecha de capacitación, fecha de evaluación, identidad del instructor", "Registros médicos del operador", "Solo la firma del operador"], correctAnswers: "Nombre del operador, fecha de capacitación, fecha de evaluación, identidad del instructor", explanation: "La certificación debe incluir nombre, fechas de capacitación y evaluación, e identidad del instructor/evaluador." },
      { question: "¿Con qué frecuencia deben ser re-evaluados los operadores según OSHA?", type: "mcq_single", options: ["Cada año", "Cada 2 años", "Cada 3 años", "Cada 5 años"], correctAnswers: "Cada 3 años", explanation: "OSHA requiere re-evaluación al menos cada tres años." },
    ],
  },

  // ═══ MÓDULO 1: Principios de Aprendizaje de Adultos ═══
  {
    module: "Principios de Aprendizaje de Adultos",
    title: "Cómo Aprenden los Adultos: Andragogía",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Cómo Aprenden los Adultos: Andragogía",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Teoría de Aprendizaje de Adultos", content: "<p>Los adultos aprenden diferente que los niños. Principios clave (<strong>andragogía</strong>):</p><ul><li><strong>Autodirigidos:</strong> Quieren responsabilidad por su aprendizaje</li><li><strong>Basados en experiencia:</strong> Traen experiencia valiosa</li><li><strong>Orientados a relevancia:</strong> Aprenden mejor cuando es relevante para su trabajo</li><li><strong>Centrados en problemas:</strong> Prefieren aprendizaje que resuelve problemas reales</li><li><strong>Motivados internamente:</strong> Por autoestima, mejor calidad de trabajo</li></ul>" },
          { heading: "Estilos de Aprendizaje", content: "<p>Incluya los tres estilos en su capacitación:</p><ul><li><strong>Visual:</strong> Diagramas, videos, demostraciones</li><li><strong>Auditivo:</strong> Conferencias, discusiones, explicaciones verbales</li><li><strong>Kinestésico:</strong> Práctica hands-on, operación de equipo</li></ul>" },
          { heading: "Técnicas de Presentación Efectivas", content: "<ul><li>Comience con el <strong>por qué</strong> — explique la justificación de seguridad</li><li>Use <strong>ejmplos del mundo real</strong> del lugar de trabajo</li><li>Sesiones <strong>cortas</strong> (15-20 minutos por tema)</li><li>Fomente <strong>preguntas y discusión</strong></li><li>Use <strong>multimedia</strong> — videos, diapositivas, demostraciones</li><li>Proporcione <strong>práctica hands-on</strong> inmediatamente</li></ul>" },
          { heading: "Gestión de Dinámica de Grupo", content: "<p>Cree un <strong>ambiente de aprendizaje seguro</strong>, maneje participantes dominantes, involucre participantes callados, aborde concepciones erróneas de seguridad, mantenga el <strong>horario</strong>.</p>" },
        ],
        takeaways: [
          "Los adultos son autodirigidos, basados en experiencia y orientados a relevancia",
          "Incluya elementos visuales, auditivos y kinestésicos",
          "Comience con el 'por qué' y use ejemplos del mundo real",
          "Cree un ambiente de aprendizaje seguro",
        ],
        tip: "Pregunte a los participantes sobre su experiencia al inicio. Sus historias son excelentes ejemplos de enseñanza.",
      }),
    },
  },
  {
    module: "Principios de Aprendizaje de Adultos",
    title: "Estrategias de Evaluación",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Estrategias de Evaluación",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Evaluación de Conocimiento", content: "<p>Pruebe la comprensión mediante: <strong>exámenes escritos</strong>, <strong>preguntas orales</strong>, <strong>cuestionarios throughout</strong>, <strong>estudios de caso</strong>.</p>" },
          { heading: "Evaluación Práctica", content: "<p>Evalúe habilidades mediante: <strong>demostración</strong>, <strong>observación</strong>, <strong>listas de verificación</strong>, <strong>evaluación progresiva</strong>.</p>" },
          { heading: "Criterios de Aprobación/Reprobación", content: "<p>Establezca criterios claros: puntuación de aprobación (típicamente 80%), habilidades obligatorias, fallas críticas de seguridad (reprobación automática), intentos permitidos, remediación.</p>" },
          { heading: "Proporcionar Retroalimentación", content: "<p>Retroalimentación <strong>específica</strong>, <strong>oportuna</strong>, <strong>equilibrada</strong> (fortalezas y debilidades), <strong>accionable</strong>.</p>" },
        ],
        takeaways: [
          "Use evaluaciones de conocimiento y prácticas",
          "Establezca criterios claros antes de la capacitación",
          "Use listas de verificación estandarizadas",
          "Proporcione retroalimentación específica y oportuna",
        ],
      }),
    },
  },
  {
    module: "Principios de Aprendizaje de Adultos",
    title: "Verificación de Conocimiento: Aprendizaje de Adultos",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Los adultos aprenden mejor cuando la capacitación es:", type: "mcq_single", options: ["Puramente teórica", "Directamente relevante para su trabajo", "Basada en memorización", "En sesiones largas"], correctAnswers: "Directamente relevante para su trabajo", explanation: "Los adultos son orientados a relevancia — aprenden mejor cuando el contenido es aplicable a su trabajo." },
      { question: "¿Cuál NO es uno de los tres estilos de aprendizaje?", type: "mcq_single", options: ["Visual", "Auditivo", "Kinestésico", "Olfativo"], correctAnswers: "Olfativo", explanation: "Los tres estilos son visual, auditivo y kinestésico." },
      { question: "La retroalimentación debe ser:", type: "mcq_single", options: ["Retrasada varios días", "General y vaga", "Específica, oportuna, equilibrada y accionable", "Solo sobre debilidades"], correctAnswers: "Específica, oportuna, equilibrada y accionable", explanation: "La retroalimentación efectiva es específica, oportuna, equilibrada y accionable." },
    ],
  },

  // ═══ MÓDULO 2: Diseño del Programa de Capacitación ═══
  {
    module: "Diseño del Programa de Capacitación",
    title: "Diseñando Su Programa de Capacitación",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Diseñando Su Programa de Capacitación",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Evaluación de Necesidades", content: "<p>Identifique: <strong>tipos de equipo</strong> en uso, <strong>condiciones del lugar de trabajo</strong>, <strong>niveles de experiencia</strong>, <strong>peligros específicos del sitio</strong>, <strong>requisitos regulatorios</strong>.</p>" },
          { heading: "Objetivos de Aprendizaje", content: "<p>Escriba <strong>objetivos medibles</strong> con verbos de acción: \"demostrar\", \"identificar\", \"realizar\". Evite términos vagos como \"entender\".</p>" },
          { heading: "Estructura del Currículo", content: "<ol><li><strong>Instrucción formal</strong> — teoría y conocimiento</li><li><strong>Capacitación práctica</strong> — demostraciones y práctica guiada</li><li><strong>Evaluación</strong> — conocimiento y habilidades</li><li><strong>Documentación</strong> — registros de certificación</li></ol>" },
          { heading: "Materiales de Capacitación", content: "<p>Prepare: presentaciones, manuales de equipo, listas de inspección, formularios de evaluación, examen escrito, reglas de seguridad del sitio, ayudas visuales.</p>" },
        ],
        takeaways: [
          "Comience con evaluación de necesidades de su instalación",
          "Escriba objetivos medibles con verbos de acción",
          "Estructura: instrucción formal, práctica, evaluación, documentación",
          "Prepare todos los materiales antes de la sesión",
        ],
        tip: "Personalice su capacitación a su lugar de trabajo específico.",
      }),
    },
  },
  {
    module: "Diseño del Programa de Capacitación",
    title: "Diseño de Ejercicios Prácticos",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Diseño de Ejercicios Prácticos",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Desarrollo Progresivo de Habilidades", content: "<ol><li><strong>Controles básicos</strong> — arrancar, girar, detener</li><li><strong>Maniobras simples</strong> — adelante, reversa, giros</li><li><strong>Manejo de cargas</strong> — recoger, transportar, apilar</li><li><strong>Operaciones complejas</strong> — rampas, muelles, pasillos estrechos</li><li><strong>Tareas específicas del sitio</strong></li></ol>" },
          { heading: "Configuración de Área de Práctica", content: "<p>Conos, tarimas, rampa simulada, pasillo estrecho, espacio libre de tráfico.</p>" },
          { heading: "Técnica de Práctica Guiada", content: "<ol><li><strong>Demostrar</strong> la habilidad</li><li><strong>Explicar</strong> cada paso</li><li>Practicar con <strong>guía</strong></li><li><strong>Retroalimentación inmediata</strong></li><li>Práctica <strong>independiente</strong></li><li><strong>Evaluar</strong></li></ol>" },
          { heading: "Corregir Comportamientos Inseguros", content: "<p><strong>Detener</strong> inmediatamente, explicar por qué es inseguro, demostrar el procedimiento correcto, repetir correctamente.</p>" },
        ],
        takeaways: [
          "Desarrolle habilidades progresivamente",
          "Configure un área de práctica designada",
          "Use el ciclo demostrar-practicar-evaluar",
          "Detenga comportamientos inseguros inmediatamente",
        ],
      }),
    },
  },
  {
    module: "Diseño del Programa de Capacitación",
    title: "Verificación de Conocimiento: Diseño del Programa",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Los objetivos de aprendizaje deben usar:", type: "mcq_single", options: ["Términos vagos como 'entender'", "Verbos de acción medibles como 'demostrar'", "Párrafos largos", "Solo los objetivos del instructor"], correctAnswers: "Verbos de acción medibles como 'demostrar'", explanation: "Los objetivos deben usar verbos de acción medibles." },
      { question: "La progresión recomendada para capacitación práctica es:", type: "mcq_single", options: ["Comenzar con operaciones complejas", "Comenzar con controles básicos y construir progresivamente", "Solo evaluar al final", "Saltar a tareas específicas"], correctAnswers: "Comenzar con controles básicos y construir progresivamente", explanation: "Construya habilidades progresivamente." },
    ],
  },

  // ═══ MÓDULO 3: Temas Requeridos Profundización ═══
  {
    module: "Temas Requeridos Profundización",
    title: "Temas Relacionados con el Camión (1910.178(l)(3)(i))",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Temas Relacionados con el Camión (1910.178(l)(3)(i))",
        image: img("forklift-hero.svg"),
        sections: [
          { heading: "OSHA Requiere 13 Temas Relacionados con el Camión", content: "<p>OSHA 1910.178(l)(3)(i) requiere capacitación en <strong>13 temas relacionados con el camión</strong> (A-M):</p>" },
          { heading: "Temas A-E", content: "<ul><li>(A) Instrucciones de operación, advertencias y precauciones</li><li>(B) Diferencias entre el camión y el automóvil</li><li>(C) Controles e instrumentación del camión</li><li>(D) Operación del motor</li><li>(E) Dirección y maniobras</li></ul>" },
          { heading: "Temas F-I", content: "<ul><li>(F) Visibilidad (incluyendo restricciones por carga)</li><li>(G) Adaptación de horquillas y accesorios</li><li>(H) Capacidad del vehículo</li><li>(I) Estabilidad del vehículo (triángulo de estabilidad)</li></ul>" },
          { heading: "Temas J-M", content: "<ul><li>(J) Inspección y mantenimiento que el operador debe realizar</li><li>(K) Reabastecimiento de combustible y carga de baterías</li><li>(L) Limitaciones de operación</li><li>(M) Otras instrucciones del manual del operador</li></ul>" },
        ],
        takeaways: [
          "OSHA requiere 13 temas relacionados con el camión",
          "Cubra controles, dirección, visibilidad, capacidad, estabilidad",
          "Use el equipo real para enseñar controles",
          "Cree una lista de verificación de los 13 temas",
        ],
        tip: "Cree una lista de verificación de los 13 temas y márquelos a medida que los cubre.",
      }),
    },
  },
  {
    module: "Temas Requeridos Profundización",
    title: "Temas Relacionados con el Lugar de Trabajo (1910.178(l)(3)(ii))",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Temas Relacionados con el Lugar de Trabajo (1910.178(l)(3)(ii))",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "OSHA Requiere 9 Temas del Lugar de Trabajo", content: "<p>OSHA 1910.178(l)(3)(ii) requiere <strong>9 temas relacionados con el lugar de trabajo</strong> (A-I). Son específicos del sitio:</p>" },
          { heading: "Temas A-C", content: "<ul><li>(A) Condiciones de superficie</li><li>(B) Composición de cargas y estabilidad</li><li>(C) Manipulación, apilado y desapilado de cargas</li></ul>" },
          { heading: "Temas D-F", content: "<ul><li>(D) Tráfico de peatones</li><li>(E) Pasillos estrechos y lugares restringidos</li><li>(F) Ubicaciones peligrosas clasificadas</li></ul>" },
          { heading: "Temas G-I", content: "<ul><li>(G) Rampas y superficies inclinadas</li><li>(H) Ambientes cerrados y ventilación</li><li>(I) Otras condiciones ambientales únicas</li></ul>" },
        ],
        takeaways: [
          "OSHA requiere 9 temas del lugar de trabajo",
          "Son específicos del sitio y deben personalizarse",
          "Camine por la instalación real durante la capacitación",
          "Cubra superficies, cargas, peatones, rampas, ventilación",
        ],
      }),
    },
  },
  {
    module: "Temas Requeridos Profundización",
    title: "Verificación de Conocimiento: Temas Requeridos",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "¿Cuántos temas relacionados con el camión requiere OSHA?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "13", explanation: "OSHA requiere 13 temas relacionados con el camión (A-M)." },
      { question: "¿Cuántos temas del lugar de trabajo requiere OSHA?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "9", explanation: "OSHA requiere 9 temas del lugar de trabajo (A-I)." },
      { question: "Los temas del lugar de trabajo deben ser:", type: "mcq_single", options: ["Genéricos", "Personalizados a su instalación específica", "Memorizados del texto de OSHA", "Omitidos para operadores experimentados"], correctAnswers: "Personalizados a su instalación específica", explanation: "Los temas del lugar de trabajo son específicos del sitio." },
    ],
  },

  // ═══ MÓDULO 4: Metodología de Capacitación Práctica ═══
  {
    module: "Metodología de Capacitación Práctica",
    title: "Conducción de Sesiones de Capacitación Práctica",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Conducción de Sesiones de Capacitación Práctica",
        image: img("warehouse-aisle.svg"),
        sections: [
          { heading: "Configuración para el Éxito", content: "<p>Área <strong>libre de peatones</strong>, montacargas en <strong>condiciones seguras</strong>, <strong>listas de evaluación</strong> listas, revisar <strong>procedimientos de emergencia</strong>.</p>" },
          { heading: "Ciclo Demostración-Práctica-Evaluación", content: "<ol><li><strong>Demostrar</strong> cada habilidad</li><li><strong>Práctica guiada</strong> con coaching</li><li><strong>Práctica independiente</strong></li><li><strong>Evaluar</strong> contra la lista</li></ol>" },
          { heading: "Habilidades Clave a Practicar", content: "<p>Inspección pre-turno, conducción básica, manejo de cargas, operación en rampas, operaciones de muelle, estacionamiento y apagado.</p>" },
          { heading: "Seguridad Durante la Capacitación", content: "<p>El instructor es responsable de la seguridad. Mantenga <strong>ruta de escape</strong>, nunca permita <strong>maniobras peligrosas</strong>, detenga ejercicios inseguros inmediatamente.</p>" },
        ],
        takeaways: [
          "Use el ciclo demostrar-practicar-evaluar",
          "Practique: inspección, conducción, cargas, rampas, muelles",
          "Mantenga el área despejada",
          "Detenga comportamientos inseguros inmediatamente",
        ],
        warning: "Como instructor, es responsable de la seguridad durante la capacitación práctica.",
      }),
    },
  },
  {
    module: "Metodología de Capacitación Práctica",
    title: "Verificación de Conocimiento: Capacitación Práctica",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "El ciclo recomendado de capacitación es:", type: "mcq_single", options: ["Probar primero, luego enseñar", "Demostrar, práctica guiada, práctica independiente, evaluar", "Solo conferencia", "Solo evaluar"], correctAnswers: "Demostrar, práctica guiada, práctica independiente, evaluar", explanation: "El ciclo efectivo es demostrar, guiar práctica, permitir práctica independiente, luego evaluar." },
      { question: "Si un participante realiza una maniobra insegura, debe:", type: "mcq_single", options: ["Dejarlo terminar y abordarlo después", "Detener el ejercicio inmediatamente", "Ignorarlo si nadie resultó herido", "Solo anotarlo en la evaluación"], correctAnswers: "Detener el ejercicio inmediatamente", explanation: "Detenga el comportamiento inseguro inmediatamente." },
    ],
  },

  // ═══ MÓDULO 5: Evaluación de Operadores ═══
  {
    module: "Evaluación de Operadores",
    title: "Conducción de la Evaluación del Operador",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Conducción de la Evaluación del Operador",
        image: img("pre-shift-checklist.svg"),
        sections: [
          { heading: "Evaluación vs. Capacitación", content: "<p>La capacitación y evaluación son <strong>actividades separadas</strong>. La evaluación determina si el operador es competente para operar independientemente. <strong>Observe sin coaching</strong>.</p>" },
          { heading: "Diseño de Lista de Evaluación", content: "<p>Inspección pre-turno, arranque, conducción, manejo de cargas, rampas/muelles, estacionamiento, conciencia de seguridad.</p>" },
          { heading: "Conducción de la Evaluación", content: "<ol><li>Explicar qué se evaluará</li><li>Aclarar que es evaluación, no capacitación</li><li>Observar y calificar</li><li>Tomar notas</li><li>Debriefing después</li></ol>" },
          { heading: "Decisiones de Aprobación/Reprobación", content: "<p><strong>Aprobar:</strong> todo seguro. <strong>Reprobación automática:</strong> riesgo de volcadura, casi-accidente con peatón, exceder capacidad. Proporcione remediación y re-evaluación.</p>" },
        ],
        takeaways: [
          "La evaluación es separada de la capacitación",
          "Use listas estandarizadas",
          "Establezca criterios claros de aprobación/reprobación",
          "Proporcione remediación para reprobados",
        ],
      }),
    },
  },
  {
    module: "Evaluación de Operadores",
    title: "Verificación de Conocimiento: Evaluación de Operadores",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Durante una evaluación, el instructor debe:", type: "mcq_single", options: ["Coaching en cada paso", "Observar sin coaching", "Tomar control si lucha", "Omitir items conocidos"], correctAnswers: "Observar sin coaching", explanation: "La evaluación es separada de la capacitación — observe sin coaching." },
      { question: "Si un operador reprueba la evaluación, debe:", type: "mcq_single", options: ["Certificarlo de todos modos", "Proporcionar capacitación adicional y re-evaluar", "Despedir al operador", "Ignorar la reprobación"], correctAnswers: "Proporcionar capacitación adicional y re-evaluar", explanation: "Proporcione remediación y re-evaluación." },
    ],
  },

  // ═══ MÓDULO 6: Administración y Cultura de Seguridad ═══
  {
    module: "Administración y Cultura de Seguridad",
    title: "Administrando Su Programa de Capacitación",
    type: "lesson",
    estimatedMinutes: 5,
    config: {
      html_content: lessonHtml({
        title: "Administrando Su Programa de Capacitación",
        image: img("osha-compliance.svg"),
        sections: [
          { heading: "Gestión de Registros", content: "<p>Mantenga: fecha de capacitación, currículo, resultados de evaluación, certificación, recapacitación, re-evaluación, reportes de incidentes.</p>" },
          { heading: "Disparadores de Recapacitación (1910.178(l)(4))", content: "<p>Recapacitación requerida cuando: operación insegura observada, accidente o casi-accidente, evaluación revela operación insegura, nuevo tipo de camión, cambio en condiciones del lugar de trabajo. Más evaluación cada <strong>3 años</strong>.</p>" },
          { heading: "Gestión de Equipo Nuevo", content: "<p>Capacitación específica al equipo antes de permitir operación. Revise el manual. Familiarización con controles. Evalúe antes de certificar.</p>" },
          { heading: "Mejora Continua", content: "<p>Revise datos de accidentes, actualice materiales cuando cambien las regulaciones, solicite retroalimentación, manténgase al día con OSHA.</p>" },
        ],
        takeaways: [
          "Mantenga registros detallados de capacitación",
          "La recapacitación es requerida por operación insegura, accidentes, equipo nuevo",
          "Proporcione capacitación específica al equipo nuevo",
          "Mejore continuamente basado en datos",
        ],
      }),
    },
  },
  {
    module: "Administración y Cultura de Seguridad",
    title: "Construyendo una Cultura de Seguridad",
    type: "lesson",
    estimatedMinutes: 4,
    config: {
      html_content: lessonHtml({
        title: "Construyendo una Cultura de Seguridad",
        image: img("pedestrian-safety.svg"),
        sections: [
          { heading: "El Rol del Instructor", content: "<p>Como instructor, es un <strong>líder de seguridad</strong>. Su actitud y comportamiento establecen el tono. Lidere con el ejemplo.</p>" },
          { heading: "Promover Mentalidad de 'Seguridad Primero'", content: "<p>Fomente detener el trabajo si es inseguro, recompense reportar peligros, nunca presione para apresurar, haga la seguridad un tema regular, reconozca comportamientos seguros.</p>" },
          { heading: "Compromiso de la Gerencia", content: "<p>Abogue por: tiempo adecuado de capacitación, mantenimiento de equipo, aplicación de reglas, investigación de accidentes, auditorías regulares.</p>" },
          { heading: "Seguridad como Proceso Continuo", content: "<p>La seguridad no es un evento único — es un proceso continuo de refuerzo, recapacitación y comunicación.</p>" },
        ],
        takeaways: [
          "El instructor es un líder de seguridad",
          "Fomente una política de 'detener el trabajo'",
          "Abogue por compromiso de la gerencia",
          "La seguridad es un proceso continuo",
        ],
        tip: "Comience cada turno con un briefing de seguridad de 2 minutos.",
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
      { question: "La recapacitación es requerida cuando:", type: "mcq_single", options: ["Solo cada 3 años", "Se observa operación insegura", "Solo cuando OSHA visita", "Solo para nuevos empleados"], correctAnswers: "Se observa operación insegura", explanation: "La recapacitación es requerida por operación insegura, accidentes, evaluaciones fallidas, equipo nuevo, o cambios en el lugar de trabajo." },
      { question: "Como instructor, su rol en la cultura de seguridad es:", type: "mcq_single", options: ["Solo enseñar el material", "Liderar con el ejemplo y ser un líder de seguridad", "Aplicar reglas pero no seguirlas", "Solo reportar a la gerencia"], correctAnswers: "Liderar con el ejemplo y ser un líder de seguridad", explanation: "El instructor es un líder de seguridad que establece el tono." },
    ],
  },

  // ═══ MÓDULO 7: Examen Final y Finalización ═══
  {
    module: "Examen Final y Finalización",
    title: "Examen Final: Certificación Capacitar al Capacitador",
    type: "exam",
    estimatedMinutes: 15,
    config: { passing_score: 80, max_attempts: 3, randomize_questions: true },
    questions: [
      { question: "¿Qué norma OSHA establece las calificaciones del instructor?", type: "mcq_single", options: ["29 CFR 1910.178(l)(2)(iii)", "29 CFR 1926.453", "29 CFR 1910.147", "29 CFR 1926.500"], correctAnswers: "29 CFR 1910.178(l)(2)(iii)", explanation: "29 CFR 1910.178(l)(2)(iii) establece que la capacitación debe ser conducida por personas con conocimiento, capacitación y experiencia." },
      { question: "¿Qué tres calificaciones debe poseer un instructor?", type: "mcq_single", options: ["Título, certificado, licencia", "Conocimiento, capacitación y experiencia", "Edad, educación, aptitud física", "Antigüedad, aprobación, permanencia"], correctAnswers: "Conocimiento, capacitación y experiencia", explanation: "OSHA requiere conocimiento, capacitación y experiencia." },
      { question: "¿Qué debe incluir la certificación del operador?", type: "mcq_single", options: ["Foto del operador", "Nombre, fecha de capacitación, fecha de evaluación, identidad del instructor", "SSN del operador", "Solo la firma del empleador"], correctAnswers: "Nombre, fecha de capacitación, fecha de evaluación, identidad del instructor", explanation: "Debe incluir nombre, fechas e identidad del instructor." },
      { question: "¿Con qué frecuencia deben ser re-evaluados los operadores?", type: "mcq_single", options: ["Cada año", "Cada 2 años", "Cada 3 años", "Cada 5 años"], correctAnswers: "Cada 3 años", explanation: "OSHA requiere re-evaluación cada tres años." },
      { question: "¿Cuántos temas relacionados con el camión deben cubrirse?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "13", explanation: "Se requieren 13 temas relacionados con el camión (A-M)." },
      { question: "¿Cuántos temas del lugar de trabajo deben cubrirse?", type: "mcq_single", options: ["5", "9", "13", "22"], correctAnswers: "9", explanation: "Se requieren 9 temas del lugar de trabajo (A-I)." },
      { question: "Los adultos aprenden mejor cuando la capacitación es:", type: "mcq_single", options: ["Puramente teórica", "Directamente relevante para su trabajo", "Basada en memorización", "En conferencias largas"], correctAnswers: "Directamente relevante para su trabajo", explanation: "Los adultos son orientados a relevancia." },
      { question: "Los tres estilos de aprendizaje son:", type: "mcq_single", options: ["Visual, auditivo, kinestésico", "Lectura, escritura, aritmética", "Rápido, medio, lento", "Individual, grupal, en línea"], correctAnswers: "Visual, auditivo, kinestésico", explanation: "Los tres estilos son visual, auditivo y kinestésico." },
      { question: "Los objetivos de aprendizaje deben usar:", type: "mcq_single", options: ["Términos vagos como 'entender'", "Verbos de acción medibles como 'demostrar'", "Párrafos largos", "Solo el nombre del instructor"], correctAnswers: "Verbos de acción medibles como 'demostrar'", explanation: "Use verbos de acción medibles." },
      { question: "El ciclo recomendado de capacitación práctica es:", type: "mcq_single", options: ["Probar, enseñar, probar", "Demostrar, práctica guiada, práctica independiente, evaluar", "Solo conferencia", "Solo evaluar"], correctAnswers: "Demostrar, práctica guiada, práctica independiente, evaluar", explanation: "El ciclo efectivo." },
      { question: "Durante una evaluación, el instructor debe:", type: "mcq_single", options: ["Coaching en cada paso", "Observar sin coaching", "Tomar control si lucha", "Omitir items conocidos"], correctAnswers: "Observar sin coaching", explanation: "Observe sin coaching." },
      { question: "La recapacitación es requerida cuando:", type: "mcq_single", options: ["Solo cada 3 años", "Se observa operación insegura", "Solo cuando OSHA visita", "Solo para nuevos empleados"], correctAnswers: "Se observa operación insegura", explanation: "Requerida por operación insegura, accidentes, etc." },
      { question: "Si un operador reprueba la evaluación práctica:", type: "mcq_single", options: ["Certificarlo de todos modos", "Proporcionar capacitación adicional y re-evaluar", "Despedir al operador", "Ignorar la reprobación"], correctAnswers: "Proporcionar capacitación adicional y re-evaluar", explanation: "Proporcione remediación y re-evaluación." },
      { question: "Este curso Capacitar al Capacitador lo certifica para:", type: "mcq_single", options: ["Operar cualquier montacargas", "Capacitar y evaluar operadores de montacargas", "Inspeccionar montacargas para OSHA", "Vender materiales de capacitación"], correctAnswers: "Capacitar y evaluar operadores de montacargas", explanation: "Lo califica para capacitar y evaluar operadores." },
      { question: "Los temas del lugar de trabajo deben ser:", type: "mcq_single", options: ["Genéricos", "Personalizados a su instalación específica", "Omitidos para experimentados", "Memorizados de OSHA"], correctAnswers: "Personalizados a su instalación específica", explanation: "Son específicos del sitio." },
      { question: "Como instructor, es un:", type: "mcq_single", options: ["Solo un maestro", "Líder de seguridad que lidera con el ejemplo", "Aplicador de reglas", "Solo guardián de registros"], correctAnswers: "Líder de seguridad que lidera con el ejemplo", explanation: "El instructor es un líder de seguridad." },
      { question: "OSHA puede multar hasta cuánto por violación seria?", type: "mcq_single", options: ["$1,000", "$5,000", "$15,625", "$100,000"], correctAnswers: "$15,625", explanation: "Las multas por violaciones serias pueden alcanzar $15,625 (2023)." },
      { question: "¿Qué es una falla crítica que resulta en reprobación automática?", type: "mcq_single", options: ["Conducción lenta", "Riesgo de volcadura o casi-accidente con peatón", "Olvidar tocar la bocina una vez", "Estacionarse ligeramente descentrado"], correctAnswers: "Riesgo de volcadura o casi-accidente con peatón", explanation: "Las fallas críticas de seguridad resultan en reprobación automática." },
      { question: "La retroalimentación efectiva debe ser:", type: "mcq_single", options: ["Retrasada y vaga", "Específica, oportuna, equilibrada y accionable", "Solo sobre debilidades", "Solo al final"], correctAnswers: "Específica, oportuna, equilibrada y accionable", explanation: "Específica, oportuna, equilibrada y accionable." },
      { question: "Los registros de capacitación deben conservarse por:", type: "mcq_single", options: ["30 días", "1 año", "Duración del empleo más 3 años", "Para siempre"], correctAnswers: "Duración del empleo más 3 años", explanation: "Mejor práctica: empleo más 3 años." },
    ],
  },
  {
    module: "Examen Final y Finalización",
    title: "Felicitaciones: Es un Instructor Certificado",
    type: "lesson",
    estimatedMinutes: 3,
    config: {
      html_content: lessonHtml({
        title: "¡Es un Instructor Certificado! ¿Qué Sigue?",
        image: img("train-the-trainer-hero.svg"),
        sections: [
          { heading: "Su Certificación", content: "<p>¡Felicitaciones por completar la Certificación Capacitar al Capacitador! Está calificado para <strong>capacitar y evaluar operadores de montacargas</strong> en sus instalaciones bajo OSHA 29 CFR 1910.178(l)(2)(iii).</p>" },
          { heading: "Próximos Pasos", content: "<ul><li>Descargue su certificado de instructor</li><li>Desarrolle su currículo específico al sitio</li><li>Cree listas de evaluación práctica</li><li>Programe su primera sesión de capacitación</li><li>Mantenga su propia competencia como operador</li></ul>" },
          { heading: "Manténgase Actualizado", content: "<p>Continúe desarrollando sus habilidades. Manténgase al día con regulaciones de OSHA, asista a recapacitación y mejore continuamente.</p>" },
        ],
        takeaways: [
          "Está calificado para capacitar y evaluar operadores",
          "Desarrolle su currículo y formularios de evaluación",
          "Mantenga su competencia como operador",
          "Manténgase al día con OSHA",
        ],
        tip: "Comience con una sesión piloto para refinar su currículo.",
      }),
    },
  },
];
