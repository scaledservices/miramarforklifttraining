import type { LessonBlock } from "@shared/lesson-blocks";
import { StepDef } from "./course-content";

export const CANONICAL_COURSE_ES = {
  title: "Certificación en Línea para Operador de Montacargas",
  slug: "certificacion-operador-montacargas-en-linea",
  // 2026-09-03 bug: the seeder never set courses.language, so every ES course
  // row defaulted to 'en' - Spanish certs/emails rendered in English.
  language: "es",
  description: "Instrucción teórica para operadores de montacargas sobre el equipo, riesgos del lugar, operación segura y responsabilidades del empleador. Incluye práctica de conocimientos y un examen. El empleador también debe proporcionar capacitación práctica, evaluación en el trabajo y autorización documentada.",
  category: "forklift",
  price: "45.00",
};

const img = (name: string) => `/images/training/${name}`;
const photo = (name: string) => `/images/training/photos/${name}`;

const blocks = (b: LessonBlock[]) => ({ blocks: b });

export const COURSE_STEPS_ES: StepDef[] = [
  // ═══ MÓDULO 0: Bienvenida + Cumplimiento OSHA ═══
  {
    module: "Bienvenida y Cumplimiento OSHA",
    title: "Bienvenido a la Certificación de Operador de Montacargas",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {
        "type": "heading",
        "level": 2,
        "text": "Bienvenido a la Certificación de Operador de Montacargas"
      },
      {"type": "hero_image", "src": "/images/training/editorial/warehouse-real.webp", "alt": "Operación real de almacén con equipo de manejo de materiales", "caption": "Foto documental: USDA / Lance Cheung, CC BY 2.0 (creativecommons.org/licenses/by/2.0/). Redimensionada; no implica respaldo ni demuestra un procedimiento seguro completo."},
      {
        "type": "heading",
        "level": 3,
        "text": "Qué ofrece este curso"
      },
      {
        "type": "paragraph",
        "html": "Aprenda los temas de instrucción teórica para montacargas según <strong>29 CFR 1910.178(l)</strong>. Avance a su ritmo por lecciones breves, preguntas de práctica y el examen final."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Antes de operar en el trabajo"
      },
      {
        "type": "list",
        "items": [
          "Complete la teoría, las demostraciones del instructor y los ejercicios prácticos supervisados.",
          "Una persona calificada debe evaluar su desempeño en el lugar de trabajo y con el equipo que usará.",
          "El empleador debe documentar la capacitación y la evaluación, comprobar su competencia y autorizar el trabajo."
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Esta constancia del curso no es una licencia emitida por OSHA ni autoriza a operar todas las clases de montacargas. La teoría en línea no es suficiente por sí sola."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Cómo aprender"
      },
      {
        "type": "paragraph",
        "html": "Lea cada lección, realice las actividades y consulte al instructor si algo no queda claro. Use su idioma preferido. Su progreso se guarda automáticamente. El examen requiere 80%; aprobarlo no sustituye la evaluación práctica."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Aprenda las reglas, practíquelas y demuestre que puede aplicarlas.",
          "Opere únicamente el equipo autorizado por su empleador."
        ]
      }
    ]),
  },
  {
    module: "Bienvenida y Cumplimiento OSHA",
    title: "Cumplimiento OSHA: Lo Que Cubre Este Curso",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/ppe-workers-scene.png","alt":"Trabajadores con EPP completo frente a un montacargas"},
      {
        "type": "heading",
        "level": 2,
        "text": "Cumplimiento OSHA: Lo Que Cubre Este Curso"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Tres partes para un operador competente"
      },
      {
        "type": "list",
        "items": [
          "<strong>Teoría:</strong> conozca los riesgos del equipo y del lugar mediante lecciones, conversación y demostraciones.",
          "<strong>Práctica:</strong> observe a un instructor calificado y practique bajo supervisión directa sin poner a nadie en peligro.",
          "<strong>Evaluación en el trabajo:</strong> demuestre una operación segura en las condiciones donde trabajará."
        ]
      },
      {
        "type": "paragraph",
        "html": "El instructor y el evaluador necesitan conocimientos, capacitación y experiencia para enseñar y evaluar el equipo. El cargo laboral por sí solo no demuestra esa capacidad. El empleador puede contratar instructores externos calificados."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Registro de certificación del empleador"
      },
      {
        "type": "paragraph",
        "html": "Registre el nombre del operador, la fecha de capacitación, la fecha de evaluación y la identidad de las personas que capacitaron o evaluaron. La nota de un examen o una tarjeta no constituye por sí sola el registro completo."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Cuándo se necesita más capacitación"
      },
      {
        "type": "list",
        "items": [
          "Operación insegura, un accidente o un incidente que casi cause un accidente.",
          "Una evaluación que detecte un desempeño inseguro.",
          "Asignación a un tipo de montacargas diferente.",
          "Un cambio en el lugar de trabajo que afecte la seguridad."
        ]
      },
      {
        "type": "paragraph",
        "html": "Capacite de nuevo en los temas necesarios y evalúe la eficacia de esa capacitación. Evalúe el desempeño de cada operador al menos una vez cada tres años; no espere tres años después de un incidente. La capacitación previa cuenta solo si corresponde al equipo y a las condiciones y se comprueba la competencia del operador."
      },
      {
        "type": "key_takeaways",
        "items": [
          "El empleador es responsable de capacitar, evaluar y certificar.",
          "La necesidad de capacitación depende del riesgo, no solo de una fecha."
        ]
      }
    ]),
  },
  // NOTA (2026-07-16): las verificaciones intermedias se redujeron de 7 a 3
  // para simplificar la experiencia del estudiante (comentarios de la demo
  // de Alberto). Los elementos interactivos de las lecciones y el examen
  // final no cambian. Las preguntas clave de las verificaciones eliminadas
  // se combinaron en las tres restantes. (Mirrors course-content.ts.)

  // ═══ MÓDULO 1: Fundamentos del Montacargas + Responsabilidades ═══
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "¿Qué es un Camión Industrial Motorizado (PIT)?",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/forklift-lifting-scene.png","alt":"Montacargas elevando una carga en tarima hacia una estantería mientras un ayudante observa"},
      {
        "type": "heading",
        "level": 2,
        "text": "¿Qué es un Camión Industrial Motorizado (PIT)?"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Definición"
      },
      {
        "type": "paragraph",
        "html": "Un <strong>Camión Industrial Motorizado (PIT)</strong> es cualquier vehículo móvil autopropulsado utilizado para transportar, empujar, jalar, levantar, apilar o escalonar materiales. Los nombres comunes incluyen montacargas, patín hidráulico, montacargas de conductor y camión elevador."
      },
      {
        "type": "paragraph",
        "html": "Los PITs pueden ser impulsados por motores eléctricos o motores de combustión interna (propano, gasolina, diésel)."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Conozca Su Máquina"
      },
      {
        "type": "paragraph",
        "html": "Antes de operar, necesita conocer los componentes clave de la máquina. Toque cada marcador para aprender qué hace."
      },
      {
        "type": "hotspot_diagram",
        "src": "/images/training/forklift-anatomy.svg",
        "alt": "Vista lateral de un montacargas de contrapeso",
        "hotspots": [
          {
            "x": 36,
            "y": 31,
            "label": "Protección Superior",
            "description": "Protege al operador de objetos que caen. No está diseñada para resistir una carga completa cayendo sobre ella — nunca levante más de la capacidad nominal."
          },
          {
            "x": 56,
            "y": 35,
            "label": "Mástil",
            "description": "El conjunto vertical que sube y baja la carga. Las cadenas de elevación y los cilindros hidráulicos dentro del mástil hacen el trabajo de elevación."
          },
          {
            "x": 61,
            "y": 67,
            "label": "Respaldo de Carga",
            "description": "Evita que la carga se deslice hacia atrás hacia el operador cuando el mástil está inclinado hacia atrás."
          },
          {
            "x": 73,
            "y": 86,
            "label": "Horquillas",
            "description": "Llevan la carga. Inspecciónelas diariamente por grietas, dobleces y desgaste del talón. Siempre sepárelas para ajustarse a la tarima e insértelas completamente."
          },
          {
            "x": 24,
            "y": 69,
            "label": "Contrapeso",
            "description": "La sección trasera pesada que equilibra la carga en las horquillas. Por esto un montacargas gira desde la parte trasera y por esto la sobrecarga es tan peligrosa."
          },
          {
            "x": 46,
            "y": 79,
            "label": "Ruedas Motrices (delanteras)",
            "description": "Las ruedas delanteras cargan la mayor parte del peso e impulsan la máquina. Forman las dos esquinas delanteras del triángulo de estabilidad."
          },
          {
            "x": 27,
            "y": 81,
            "label": "Ruedas de Dirección (traseras)",
            "description": "Los montacargas giran con las ruedas TRASERAS — la parte trasera oscila ampliamente en los giros. Siempre verifique el espacio libre de la oscilación trasera."
          },
          {
            "x": 46,
            "y": 69,
            "label": "Placa de Datos",
            "description": "Indica la capacidad nominal del camión, el centro de carga, el peso y el tipo de combustible. Léala antes de cada trabajo — es su límite legal de elevación."
          },
          {
            "x": 34,
            "y": 53,
            "label": "Asiento del Operador y Cinturón de Seguridad",
            "description": "Su cinturón de seguridad es su protección principal en una volcadura. Abróchelo antes de arrancar el motor, todas las veces."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Clasificaciones de Equipo OSHA"
      },
      {
        "type": "paragraph",
        "html": "OSHA agrupa los camiones industriales motorizados en 7 clases. Voltee cada tarjeta para ver qué cubre cada clase."
      },
      {
        "type": "flip_cards",
        "title": "Las 7 Clases de OSHA",
        "cards": [
          {
            "front": "Clase I",
            "back": "Montacargas Eléctricos de Conductor — camiones de contrapeso de conductor sentado impulsados por batería."
          },
          {
            "front": "Clase II",
            "back": "Montacargas Eléctricos de Pasillo Angosto — camiones de alcance y recolectores de pedidos diseñados para pasillos estrechos."
          },
          {
            "front": "Clase III",
            "back": "Patines y Apiladores Eléctricos — transportadores de tarimas de acompañamiento a pie o de conductor montado."
          },
          {
            "front": "Clase IV",
            "back": "Montacargas de Combustión Interna con Llantas de Cojín — para pisos interiores lisos."
          },
          {
            "front": "Clase V",
            "back": "Montacargas de Combustión Interna con Llantas Neumáticas — uso interior/exterior en superficies más irregulares."
          },
          {
            "front": "Clase VI",
            "back": "Tractores Eléctricos y de Combustión Interna — remolcadores que jalan cargas en lugar de levantarlas."
          },
          {
            "front": "Clase VII",
            "back": "Montacargas para Terreno Difícil — camiones de llantas grandes para sitios de construcción y patios."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Quién Puede Operar"
      },
      {
        "type": "paragraph",
        "html": "Su empleador debe autorizarle para el equipo y lugar específicos. Debe evaluar su desempeño al menos cada tres años y proporcionar capacitación de actualización antes si ocurre una situación que la requiera."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Responsabilidades del Empleador vs. Operador"
      },
      {
        "type": "list",
        "items": [
          "<strong>Empleador:</strong> Debe proporcionar capacitación, asegurar que el equipo esté mantenido, hacer cumplir las reglas de seguridad",
          "<strong>Operador:</strong> Debe seguir todas las reglas de seguridad, realizar inspecciones pre-turno, reportar peligros e incidentes inmediatamente"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Controles y arranque"
      },
      {
        "type": "paragraph",
        "html": "Un montacargas no es un automóvil: la dirección trasera hace que la parte posterior se desplace al girar, la carga limita la visión y su peso y base de estabilidad cambian el frenado. Los controles varían entre equipos de asiento, retráctiles, recogepedidos y patines eléctricos."
      },
      {
        "type": "list",
        "items": [
          "Lea el manual y las advertencias del equipo específico. Pida al instructor que le muestre el selector de dirección, acelerador, frenos, bocina, elevación, inclinación y controles de accesorios.",
          "Antes de moverse, inspeccione el equipo, use el sistema de retención, seleccione neutral y aplique el freno de estacionamiento. Arranque o active el equipo según el manual. Revise indicadores, combustible o batería y luces de advertencia.",
          "Pruebe dirección, frenos e hidráulicos en un área despejada según las instrucciones. Deténgase y reporte fallas. No anule dispositivos de seguridad ni pruebe controles desconocidos con una carga elevada."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Llantas, combustible y accesorios"
      },
      {
        "type": "paragraph",
        "html": "Las llantas sólidas tipo cushion son para superficies lisas. Las neumáticas pueden servir en terreno irregular solo dentro de los límites del equipo. Las neumáticas sólidas resisten pinchazos, pero no permiten usar el equipo en cualquier terreno. Los equipos eléctricos no producen gases de motor; los de gas LP, gasolina y diésel requieren ventilación adecuada."
      },
      {
        "type": "paragraph",
        "html": "Los posicionadores ajustan las horquillas; los rotadores giran cargas; las pinzas sujetan tambores, llantas o rollos; los ganchos permiten cargas suspendidas. Cada accesorio requiere capacitación específica, aprobación del fabricante cuando corresponda y una placa de capacidad correcta. No improvise accesorios ni agregue contrapeso."
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Conocer las siete clases no autoriza a operar todas. Aprenda los controles, límites y condiciones de trabajo de cada tipo nuevo."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Un PIT es cualquier vehículo motorizado usado para mover, levantar o apilar materiales",
          "Hay 7 clasificaciones de OSHA para camiones industriales motorizados",
          "Los operadores deben tener 18+ años, estar capacitados y autorizados",
          "Evaluación al menos cada tres años; actualización antes cuando sea necesaria"
        ]
      }
    ]),
  },
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "Autorización y Cultura de Trabajo Seguro",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/operator-at-controls-scene.png","alt":"Operador sentado en los controles del montacargas con chaleco de alta visibilidad y cinturón de seguridad"},
      {
        "type": "heading",
        "level": 2,
        "text": "Autorización y Cultura de Trabajo Seguro"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Autorización y responsabilidad"
      },
      {
        "type": "paragraph",
        "html": "Opere solo después de recibir capacitación, evaluación y autorización para la tarea. Las reglas federales de empleo juvenil generalmente prohíben que menores de 18 años operen montacargas. Avise si no está preparado para un equipo o trabajo desconocido."
      },
      {
        "type": "list",
        "items": [
          "Reporte de inmediato defectos, derrames, rutas bloqueadas, mala iluminación, accidentes e incidentes que casi causen un accidente.",
          "No haga bromas peligrosas ni conduzca distraído o bajo efectos de sustancias. Mantenga manos y pies dentro del área del operador y lejos del mástil.",
          "No lleve pasajeros no autorizados. Una plataforma para personas no permite transportar pasajeros."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Subir al equipo y responder a un vuelco"
      },
      {
        "type": "paragraph",
        "html": "Mire hacia el equipo y use escalones y agarraderas con tres puntos de contacto. No use los controles como apoyo. Use el sistema de retención. Si vuelca un montacargas contrapesado de asiento, permanezca con el cinturón puesto, sujete el volante, afirme los pies e inclínese en sentido contrario al impacto; no salte. Otros diseños, incluidos los de operador de pie, pueden requerir otra respuesta: aprenda el procedimiento del fabricante antes de operar."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Seguridad sin afirmaciones alarmistas"
      },
      {
        "type": "paragraph",
        "html": "OSHA puede inspeccionar y sancionar infracciones. Las multas dependen de la infracción y de las reglas vigentes; no existe una multa automática universal por trabajador sin certificación y por día. La prioridad es proteger a las personas."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Deténgase y pregunte si la tarea supera su capacitación.",
          "Reporte riesgos y conozca el procedimiento de emergencia del equipo."
        ]
      }
    ]),
  },
  {
    module: "Fundamentos y Responsabilidades del Montacargas",
    title: "Verificación de Conocimiento: OSHA y Fundamentos",
    type: "checkpoint",
    estimatedMinutes: 2,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "La capacitación de OSHA para operadores de montacargas requiere instrucción formal, capacitación práctica Y una evaluación.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "OSHA requiere los tres componentes: instrucción formal, capacitación práctica y una evaluación del desempeño del operador." },
      {"question": "¿Quién puede viajar en un montacargas mientras circula?", "type": "mcq_single", "options": ["Cualquier persona con arnés", "Solo personas autorizadas en un lugar seguro previsto para ellas", "Cualquier persona sobre una tarima", "Cualquier persona si el equipo va despacio"], "correctAnswers": "Solo personas autorizadas en un lugar seguro previsto para ellas", "explanation": "No lleve pasajeros no autorizados. Una plataforma para personas no autoriza a transportar a un trabajador elevado."},
      { question: "Si nota una fuga menor de aceite en el montacargas durante la inspección pre-turno, debe:", type: "mcq_single", options: ["Continuar trabajando y reportar al final del turno", "Reportarlo inmediatamente y no operar hasta que se autorice", "Limpiarlo y seguir trabajando", "Solo reportar si empeora"], correctAnswers: "Reportarlo inmediatamente y no operar hasta que se autorice", explanation: "Cualquier preocupación de seguridad debe reportarse inmediatamente. Los vehículos no deben operarse hasta que se consideren seguros." },
    ],
  },

  // ═══ MÓDULO 2: Estabilidad + Manejo de Cargas ═══
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Triángulo de Estabilidad y Centro de Gravedad",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/stability-triangle.png","alt":"Vista superior de un montacargas mostrando el triángulo de estabilidad"},
      { type: "heading", level: 2, text: "Triángulo de Estabilidad y Centro de Gravedad" },
      {"type": "technical_diagram", "kind": "stability"},
      { type: "heading", level: 3, text: "¿Qué es el Triángulo de Estabilidad?" },
      { type: "paragraph", html: "El <strong>triángulo de estabilidad</strong> es la base de tres puntos formada por los dos extremos del eje delantero y el punto de pivote del eje trasero. Mientras el centro de gravedad combinado del camión y su carga se mantenga dentro de este triángulo, el montacargas permanece estable." },
      { type: "heading", level: 3, text: "Riesgo de Volcadura" },
      { type: "paragraph", html: "Cuando el centro de gravedad se desplaza fuera del triángulo de estabilidad — debido a sobrecarga, giros bruscos u operación en pendientes — el montacargas puede <strong>volcarse</strong>. Las volcaduras son una de las principales causas de fatalidades con montacargas." },
      { type: "list", items: [
        "Nunca haga giros bruscos a velocidad",
        "Reduzca la velocidad antes de girar",
        "Sea extra precavido en rampas, pendientes y superficies irregulares",
      ] },
      { type: "heading", level: 3, text: "Estabilidad Lateral" },
      { type: "paragraph", html: "Girar demasiado rápido desplaza el centro de gravedad lateralmente. Cuanto más alta sea la carga, más inestable se vuelve el camión durante los giros. Siempre <strong>reduzca la velocidad antes de girar</strong>, no durante el giro." },
      { type: "callout", variant: "warning", text: "Las volcaduras están entre las principales causas de fatalidades de operadores de montacargas. Siempre respete el triángulo de estabilidad." },
      { type: "key_takeaways", items: [
        "El triángulo de estabilidad está formado por los extremos del eje delantero y el pivote del eje trasero",
        "Mantenga el centro de gravedad dentro del triángulo para prevenir volcaduras",
        "Reduzca la velocidad antes de girar — los giros bruscos causan inestabilidad lateral",
        "Cargas más altas significan mayor riesgo de volcadura durante los giros",
      ] },
    ]),
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Capacidad Nominal y Placa de Datos",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/load-center.png","alt":"Diagrama de la distancia del centro de carga y la capacidad"},
      {
        "type": "heading",
        "level": 2,
        "text": "Capacidad Nominal y Placa de Datos"
      },
      {"type": "technical_diagram", "kind": "load-center"},
      {
        "type": "heading",
        "level": 3,
        "text": "La Placa de Datos"
      },
      {
        "type": "paragraph",
        "html": "Cada montacargas tiene una <strong>placa de datos</strong> del fabricante que indica la capacidad máxima de elevación a varios centros de carga. Antes de levantar cualquier carga, verifique que su montacargas esté clasificado para manejar su peso."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Centro de Carga"
      },
      {
        "type": "paragraph",
        "html": "El <strong>centro de carga</strong> es la distancia desde la cara vertical de la horquilla hasta el centro de la carga. La capacidad de un montacargas disminuye a medida que aumenta el centro de carga. Siempre verifique que está usando el equipo correcto para el peso y tamaño de la carga."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Los Accesorios Reducen la Capacidad"
      },
      {
        "type": "paragraph",
        "html": "Usar accesorios (pinzas, rotadores, extensiones de horquilla) cambia el centro de gravedad del camión y <strong>reduce la capacidad nominal</strong>. Siempre verifique la capacidad ajustada cuando use cualquier accesorio."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Nunca Sobrecargue"
      },
      {
        "type": "paragraph",
        "html": "Exceder la capacidad nominal aumenta enormemente el riesgo de inestabilidad y volcadura. Muestre los límites de peso claramente en el vehículo. Si una carga parece demasiado pesada o desequilibrada, no intente levantarla — consiga un camión de mayor capacidad."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Use la placa, no una fórmula aproximada"
      },
      {
        "type": "paragraph",
        "html": "La ilustración de capacidad es un ejemplo didáctico, no una tabla para levantar cargas. Use la placa real para el centro de carga, altura y accesorio. Si desconoce el peso o la capacidad, deténgase. Los cambios que afecten capacidad o seguridad requieren aprobación previa por escrito del fabricante y actualizar las placas. Considere parcialmente cargado un equipo con accesorio aunque no lleve carga."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Siempre verifique la placa de datos para la capacidad nominal antes de levantar",
          "La capacidad disminuye a medida que aumenta la distancia del centro de carga",
          "Los accesorios reducen la capacidad nominal del montacargas",
          "Nunca exceda la capacidad nominal — use un camión más grande si es necesario"
        ]
      }
    ]),
  },
  {
    module: "Estabilidad y Manejo de Cargas",
    title: "Recoger y Transportar Cargas de Forma Segura",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/forklift-lifting-scene.png","alt":"Montacargas colocando una tarima en un nivel de estantería"},
      {
        "type": "heading",
        "level": 2,
        "text": "Recoger y Transportar Cargas de Forma Segura"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Posición de las Horquillas"
      },
      {
        "type": "paragraph",
        "html": "Lleve las horquillas lo más bajo posible — típicamente <strong>4 a 6 pulgadas</strong> del suelo. Esto baja el centro de gravedad y reduce el riesgo de volcadura."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Inclinación del Mástil"
      },
      {
        "type": "paragraph",
        "html": "Incline el mástil ligeramente hacia atrás cuando viaje con una carga para estabilizarla. Nunca incline las cargas hacia adelante excepto al depositarlas. La inclinación excesiva hacia adelante puede causar que el camión se vuelque."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Visibilidad"
      },
      {
        "type": "paragraph",
        "html": "Si una carga bloquea su vista hacia adelante, <strong>conduzca en reversa</strong> para mantener una línea de visión clara. Use ayudantes cuando navegue espacios reducidos o áreas con visibilidad limitada."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Asegurar las Cargas"
      },
      {
        "type": "paragraph",
        "html": "Antes de transportar cualquier carga, asegúrese de que esté <strong>correctamente asegurada y balanceada</strong>. Puede necesitar película plástica o correas para prevenir el desplazamiento durante el transporte. Nunca mueva una carga no asegurada."
      },
      {
        "type": "embedded_quiz",
        "questions": [
          {
            "question": "Recoge una tarima envuelta y se da cuenta de que bloquea completamente su vista hacia adelante. ¿Qué hace?",
            "type": "mcq_single",
            "options": [
              "Inclinarse hacia el lado para ver alrededor de ella",
              "Elevar la carga más alto para poder ver por debajo",
              "Viajar en reversa con una línea de visión clara",
              "Conducir hacia adelante lentamente y tocar la bocina"
            ],
            "correctAnswers": "Viajar en reversa con una línea de visión clara",
            "explanation": "Cuando la carga bloquea su vista hacia adelante, viaje en reversa para poder ver hacia dónde va. Nunca se incline fuera de la jaula ni eleve la carga para ver por debajo."
          },
          {
            "question": "Mientras transporta una carga, el mástil debe estar inclinado:",
            "type": "mcq_single",
            "options": [
              "Completamente hacia adelante",
              "Ligeramente hacia atrás",
              "No importa",
              "Completamente abajo"
            ],
            "correctAnswers": "Ligeramente hacia atrás",
            "explanation": "Una ligera inclinación hacia atrás acomoda la carga contra el respaldo y la mantiene estable durante el viaje."
          }
        ]
      },
      {
        "type": "callout",
        "variant": "tip",
        "text": "Cuando no pueda ver más allá de la carga, viaje en reversa y use un ayudante para áreas reducidas."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Apilar y desapilar"
      },
      {
        "type": "list",
        "items": [
          "Revise tarima, peso, capacidad del estante, piso y espacio superior. Mantenga a las personas fuera de la zona de caída; nadie debe pasar bajo horquillas elevadas.",
          "Acérquese de frente con las horquillas niveladas. Sepárelas para sostener la carga, introdúzcalas por completo y centre la carga. Eleve solo lo necesario e incline hacia atrás únicamente para estabilizar.",
          "Al colocar en un estante, deténgase antes de elevar. Sitúe la carga sobre el apoyo antes de bajarla o inclinarla hacia adelante. Use la mínima inclinación hacia atrás necesaria con una carga elevada.",
          "Deposite la carga por completo, mire atrás, retire las horquillas despacio y bájelas antes de desplazarse. No gire ni circule con una carga alta."
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "¿La carga bloquea la vista en una rampa? Mantenga la orientación segura de la carga y deténgase para acordar un recorrido o usar un señalero. No coloque la carga cuesta abajo solo para ver mejor."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Lleve las horquillas a 4-6 pulgadas del suelo",
          "Incline el mástil hacia atrás cuando viaje con una carga",
          "Conduzca en reversa si la carga bloquea su vista hacia adelante",
          "Siempre asegure las cargas antes de moverlas"
        ]
      }
    ]),
  },
  // ═══ MÓDULO 3: Inspección Pre-Operación + Combustible/Carga ═══
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Lista de Inspección Pre-Turno",
    type: "lesson",
    estimatedMinutes: 6,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/pre-inspection-scene.png","alt":"Operador inspeccionando las horquillas del montacargas con una lista de verificación antes de un turno"},
      {
        "type": "heading",
        "level": 2,
        "text": "Lista de Inspección Pre-Turno"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Su Responsabilidad"
      },
      {
        "type": "paragraph",
        "html": "Como operador, es <strong>su responsabilidad</strong> realizar una inspección de seguridad diaria antes de usar la máquina. Esto debe hacerse al <strong>inicio de cada turno</strong>."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Inspección de Recorrido"
      },
      {
        "type": "paragraph",
        "html": "Revise todo el equipo antes de subir. Use esta lista junto con el procedimiento de inspección del fabricante."
      },
      {"type": "list", "items": ["<strong>Llantas y Ruedas:</strong> Revise cortes, pedazos faltantes, inflado apropiado (neumáticas) y desechos enredados en los ejes.", "<strong>Horquillas:</strong> Busque grietas, dobleces y desgaste del talón. Revise los pasadores de bloqueo de las horquillas. Horquillas dobladas o agrietadas significan que el camión queda fuera de servicio.", "<strong>Mástil y Cadenas de Elevación:</strong> Inspeccione las cadenas por torceduras, óxido y eslabones rotos. Verifique que el mástil suba, baje e incline suavemente sin sacudidas.", "<strong>Hidráulicos y Fugas:</strong> Busque manchas de fluido fresco debajo del camión. Revise mangueras y cilindros por fugas. Una fuga hidráulica significa NO OPERAR.", "<strong>Protección Superior:</strong> Revise postes doblados, grietas o pernos faltantes. La protección superior es su defensa contra cargas que caen.", "<strong>Placa de Datos:</strong> Debe estar presente y legible. Si no puede leer la capacidad nominal, no opere el camión.", "<strong>Asiento y Cinturón de Seguridad:</strong> Pruebe que el cinturón de seguridad se abroche y se retraiga. Abróchese antes de arrancar el motor — todas y cada una de las veces.", "<strong>Bocina, Luces y Alarma:</strong> Pruebe la bocina, los faros, las luces de advertencia y la alarma de reversa. Si los peatones no pueden oírlo venir, el camión no es seguro."]},
      {
        "type": "heading",
        "level": 3,
        "text": "También Revise"
      },
      {
        "type": "list",
        "items": [
          "<strong>Frenos:</strong> Pruebe tanto los frenos de servicio como los de estacionamiento",
          "<strong>Dirección:</strong> Verifique la respuesta",
          "<strong>Niveles de fluidos:</strong> Combustible, aceite, refrigerante, fluido hidráulico"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Marcar Equipo Inseguro"
      },
      {
        "type": "paragraph",
        "html": "Si encuentra algún problema de seguridad, <strong>no opere el montacargas</strong>. Reporte el problema a su supervisor o equipo de mantenimiento inmediatamente. Marque el equipo para que nadie más lo use hasta que se completen las reparaciones."
      },
      {
        "type": "embedded_quiz",
        "questions": [
          {
            "question": "Durante su recorrido encuentra un goteo hidráulico lento debajo del mástil. El camión parece funcionar bien. ¿Ahora qué?",
            "type": "mcq_single",
            "options": [
              "Operar con cuidado y volver a revisar al almuerzo",
              "Limpiarlo y seguir trabajando",
              "Marcar el camión fuera de servicio y reportarlo — no operar",
              "Agregar fluido hidráulico para compensar"
            ],
            "correctAnswers": "Marcar el camión fuera de servicio y reportarlo — no operar",
            "explanation": "Cualquier fuga hidráulica puede provocar la pérdida repentina del control de la carga. Marque el equipo y repórtelo — nunca opere un camión con fugas."
          }
        ]
      },
      {
        "type": "callout",
        "variant": "tip",
        "text": "Siempre abróchese el cinturón de seguridad antes de arrancar el motor — es su protección principal en una volcadura."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Límites de la inspección"
      },
      {
        "type": "paragraph",
        "html": "Inspeccione antes del uso, al menos a diario y después de cada turno si el equipo funciona las 24 horas. Siga la lista específica. Realice solo el mantenimiento para el que esté capacitado y autorizado. Nunca busque fugas hidráulicas a presión con la mano; una lesión por inyección requiere atención médica de emergencia."
      },
      {
        "type": "key_takeaways",
        "items": [
          "La inspección pre-turno es requerida antes de cada turno",
          "Revise llantas, horquillas, cadenas, hidráulicos, luces, bocina, frenos, dirección",
          "Marque y reporte cualquier equipo inseguro inmediatamente",
          "Nunca opere un montacargas que no pase la inspección"
        ]
      }
    ]),
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Mantenimiento y Reparaciones",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/pre-shift-checklist.png","alt":"Diagrama de puntos de inspección del montacargas"},
      { type: "heading", level: 2, text: "Mantenimiento y Reparaciones" },
      { type: "heading", level: 3, text: "Reparar Antes de Usar" },
      { type: "paragraph", html: "Si se identifica un problema de seguridad durante la inspección, <strong>las reparaciones deben hacerse antes de que se use el equipo</strong>. Nunca opere un montacargas con defectos conocidos." },
      { type: "heading", level: 3, text: "Fugas de Fluidos" },
      { type: "paragraph", html: "No opere ningún vehículo con <strong>fugas de combustible, aceite o hidráulico</strong>. Las fugas hidráulicas pueden provocar la pérdida repentina del control de la carga, creando una situación extremadamente peligrosa." },
      { type: "heading", level: 3, text: "Documentar y Reportar" },
      { type: "paragraph", html: "Todos los problemas de mantenimiento deben documentarse y reportarse. Esto crea un registro para el cumplimiento y ayuda a prevenir problemas recurrentes." },
      { type: "key_takeaways", items: [
        "Las reparaciones deben completarse antes de usar el equipo",
        "Nunca opere un montacargas con fugas de fluidos",
        "Documente todos los problemas de mantenimiento para el cumplimiento",
      ] },
    ]),
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Seguridad en Combustible y Carga",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/ppe-gloves.png","alt":"EPP requerido para reabastecer: guantes, chaleco, casco, protección ocular"},
      {
        "type": "heading",
        "level": 2,
        "text": "Seguridad en Combustible y Carga (GLP / Eléctrico)"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Use el área designada"
      },
      {
        "type": "paragraph",
        "html": "Solo personal capacitado y autorizado debe abastecer combustible, cambiar baterías o cargarlas. Estacione, baje las horquillas y aplique el freno. Siga los manuales del equipo, batería y cargador. Prohíba fumar, llamas, chispas y arcos eléctricos; respete las reglas contra incendios del sitio."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Combustible y gas LP"
      },
      {
        "type": "list",
        "items": [
          "Apague el motor antes de llenar tanques. Limpie derrames y coloque las tapas antes de arrancar. No opere con una fuga.",
          "Al cambiar un cilindro de gas LP, siga el procedimiento del fabricante para apagar y liberar presión. Use guantes y protección ocular adecuados. Asegure y oriente correctamente el cilindro autorizado.",
          "Revise sellos y conexiones y busque fugas con el método autorizado, nunca con una llama. Ante olor a gas o fuga, deténgase, aleje fuentes de ignición y reporte."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Carga de baterías"
      },
      {
        "type": "list",
        "items": [
          "Las baterías de plomo-ácido pueden liberar hidrógeno explosivo al cargarse. Asegure ventilación; abra tapas y revise respiraderos según las instrucciones. No coloque herramientas metálicas sobre baterías expuestas.",
          "Use un cargador compatible y la secuencia de conexión correcta. Evite arcos eléctricos; no aplique instrucciones de una química de batería a otra.",
          "Use protección resistente al ácido y los medios designados para lavado y derrames al manejar electrolito. Solo personal capacitado debe agregarlo: ácido al agua, nunca agua al ácido.",
          "Use equipo adecuado para mover baterías pesadas y asegure la batería antes de conducir. Reporte baterías dañadas, con fugas, hinchadas o demasiado calientes; siga el plan de emergencia."
        ]
      },
      {
        "type": "key_takeaways",
        "items": [
          "Primero capacitación, compatibilidad y ventilación.",
          "Sin fuentes de ignición; nunca revise una fuga con una llama."
        ]
      }
    ]),
  },
  {
    module: "Inspección Pre-Operación y Combustible",
    title: "Verificación de Conocimiento: Estabilidad, Cargas e Inspección",
    type: "checkpoint",
    estimatedMinutes: 3,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      { question: "Al viajar con una carga, las horquillas deben estar:", type: "mcq_single", options: ["Elevadas lo más alto posible", "A nivel de los ojos", "4 a 6 pulgadas del suelo", "Tocando el suelo"], correctAnswers: "4 a 6 pulgadas del suelo", explanation: "Llevar las horquillas a 4 a 6 pulgadas del suelo mantiene el centro de gravedad bajo y reduce el riesgo de volcadura." },
      { question: "Si una carga es demasiado pesada para su montacargas, debe:", type: "mcq_single", options: ["Intentar levantarla con cuidado", "Usar un camión de mayor capacidad", "Agregar contrapeso en la parte trasera", "Conducir más rápido para impulso"], correctAnswers: "Usar un camión de mayor capacidad", explanation: "Nunca exceda la capacidad nominal. Consiga el equipo adecuado para el trabajo." },
      {"question": "Si la inspección detecta una falla de seguridad, ¿cuándo debe repararse?", "type": "mcq_single", "options": ["Al final del día", "Antes de volver a usar el equipo", "En una semana", "Solo si lo pide un supervisor"], "correctAnswers": "Antes de volver a usar el equipo", "explanation": "Retire el equipo inseguro de servicio. Solo personal autorizado puede repararlo."},
    ],
  },

  // ═══ MÓDULO 4: Conducción Segura + Peatones + Intersecciones ═══
  {
    module: "Conducción Segura y Peatones",
    title: "Velocidad, Espacio y Atención",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/safe-driving.png","alt":"Postura de conducción correcta con cinturón de seguridad, carga baja y ojos al frente"},
      {
        "type": "heading",
        "level": 2,
        "text": "Velocidad, Espacio y Atención"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Elija una velocidad que permita detenerse"
      },
      {
        "type": "paragraph",
        "html": "Respete el límite del sitio y reduzca más la velocidad cuando las condiciones lo exijan. OSHA no establece un límite universal de 5 mph. Reduzca antes de girar, en puntos ciegos y sobre pisos mojados o irregulares. No corra ni gire bruscamente."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Distancia y visibilidad"
      },
      {
        "type": "paragraph",
        "html": "Mantenga aproximadamente tres longitudes de montacargas detrás del equipo que va adelante, y más si necesita mayor distancia de frenado. Mire hacia donde avanza. Reduzca la velocidad y toque la bocina en cruces y puntos ciegos. No rebase allí. Ceda el paso a peatones y vehículos de emergencia."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Rutas restringidas"
      },
      {
        "type": "paragraph",
        "html": "Revise ancho de pasillos, giro trasero y espacio bajo tuberías, puertas y rociadores. Evite objetos sueltos y superficies inseguras. Cruce vías de ferrocarril en diagonal cuando sea posible; no estacione a menos de ocho pies del centro de la vía. Use un elevador solo si está autorizado, soporta el peso combinado y está nivelado; dentro, ponga controles en neutral, apague y aplique frenos."
      },
      {
        "type": "key_takeaways",
        "items": [
          "El límite señalado es un máximo, no una meta.",
          "Deje espacio para frenar y mantenga una vista despejada."
        ]
      }
    ]),
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Intersecciones, Puntos Ciegos y Uso de la Bocina",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/warehouse-aisle.png","alt":"Pasillo de almacén con zonas de espacio libre"},
      { type: "heading", level: 2, text: "Intersecciones, Puntos Ciegos y Uso de la Bocina" },
      { type: "heading", level: 3, text: "Aproxímese con Precaución" },
      { type: "paragraph", html: "En cada intersección, esquina ciega o área con visibilidad limitada: <strong>reduzca la velocidad, toque la bocina y mire en ambas direcciones</strong> antes de proceder." },
      { type: "heading", level: 3, text: "Espejos y Visibilidad" },
      { type: "paragraph", html: "Use los espejos disponibles y mire en la dirección de viaje. Si una carga bloquea su vista hacia adelante, viaje en reversa. Nunca rebase en intersecciones, puntos ciegos o áreas peligrosas." },
      { type: "heading", level: 3, text: "Protocolo de la Bocina" },
      { type: "paragraph", html: "La bocina es un <strong>dispositivo de advertencia</strong>, no una exigencia de derecho de paso. Tóquela en intersecciones, esquinas ciegas, puertas y cuando sea que los peatones puedan estar presentes. Úsela para alertar a otros de su presencia." },
      { type: "key_takeaways", items: [
        "Reduzca la velocidad, toque la bocina y mire en cada intersección",
        "Use espejos y conduzca en reversa cuando la vista esté bloqueada",
        "La bocina advierte a otros — no le da el derecho de paso",
        "Nunca rebase en intersecciones o puntos ciegos",
      ] },
    ]),
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Derecho de Paso de los Peatones",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/pedestrian-crossing-scene.png","alt":"Montacargas cediendo el paso a un peatón en un carril peatonal marcado"},
      { type: "heading", level: 2, text: "Derecho de Paso de los Peatones" },
      { type: "heading", level: 3, text: "Los Peatones Siempre Tienen Prioridad" },
      { type: "paragraph", html: "Los peatones <strong>siempre tienen el derecho de paso</strong>. Nunca conduzca hacia una persona que esté cerca de un objeto fijo. Siempre asegúrese de que las personas estén fuera del camino antes de moverse." },
      { type: "heading", level: 3, text: "Comunicación" },
      { type: "list", items: [
        "Haga <strong>contacto visual</strong> con los peatones antes de proceder",
        "Toque la bocina como una <strong>advertencia</strong>, no como una exigencia de que se muevan",
        "Espere a que los peatones lo reconozcan y se muevan a un lugar seguro",
      ] },
      { type: "scenario", title: "¿Qué Haría Usted?",
        prompt: "Está transportando una tarima por el pasillo principal a velocidad de caminata. Veinte pies adelante, un compañero de trabajo sale de entre dos estanterías leyendo una tabla portapapeles. No lo ha visto a usted.",
        choices: [
          { text: "Tocar la bocina repetidamente y seguir avanzando — se hará a un lado", correct: false, feedback: "La bocina es una advertencia, no una exigencia de derecho de paso. Un peatón sobresaltado puede moverse en la dirección equivocada. Debe detenerse hasta que esté fuera del camino." },
          { text: "Detenerse, tocar la bocina una vez y esperar contacto visual antes de proceder", correct: true, feedback: "Exactamente correcto. Los peatones siempre tienen el derecho de paso. Deténgase, advierta, haga contacto visual y solo proceda una vez que estén claramente fuera de su camino." },
          { text: "Esquivarlo manteniendo su velocidad", correct: false, feedback: "Nunca esquive a un peatón que no lo ha visto — puede moverse hacia su nueva trayectoria, y girar bruscamente con una carga arriesga una volcadura." },
        ] },
      { type: "heading", level: 3, text: "Zonas Peatonales" },
      { type: "paragraph", html: "Esté especialmente alerta en áreas donde los peatones caminan comúnmente: cerca de salas de descanso, baños, oficinas, áreas de envío/recepción y donde sea que los trabajadores crucen las rutas de los montacargas." },
      { type: "key_takeaways", items: [
        "Los peatones siempre tienen el derecho de paso",
        "Haga contacto visual antes de proceder cerca de personas",
        "Toque la bocina como advertencia, no como exigencia",
        "Esté extra alerta cerca de salas de descanso, oficinas y áreas de cruce",
      ] },
    ]),
  },
  {
    module: "Conducción Segura y Peatones",
    title: "Cambios de Dirección y Manejo Suave",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/safe-driving.png","alt":"Postura de conducción segura y manejo suave"},
      { type: "heading", level: 2, text: "Cambios de Dirección y Manejo Suave" },
      { type: "heading", level: 3, text: "Detención Completa Antes de Cambiar de Dirección" },
      { type: "paragraph", html: "Siempre llegue a una <strong>detención completa</strong> antes de cambiar de avance a reversa o viceversa. Los cambios de dirección abruptos pueden causar que las cargas se desplacen o caigan, y aumentan el riesgo de volcadura." },
      { type: "heading", level: 3, text: "Movimientos Suaves" },
      { type: "paragraph", html: "La aceleración, el frenado y la dirección suaves previenen desplazamientos de carga, derrames y volcaduras. Los movimientos bruscos son el enemigo de la estabilidad." },
      { type: "heading", level: 3, text: "No Acelere Mientras Gira" },
      { type: "paragraph", html: "Acelerar durante un giro aumenta significativamente el riesgo de volcadura. La distribución única de peso de un montacargas, combinada con una carga pesada, hace fácil perder el control si no se maneja con cuidado." },
      { type: "key_takeaways", items: [
        "Llegue a una detención completa antes de cambiar de dirección",
        "La aceleración y el frenado suaves previenen desplazamientos de carga",
        "Nunca acelere mientras gira",
        "Los movimientos bruscos aumentan el riesgo de volcadura",
      ] },
    ]),
  },
  // ═══ MÓDULO 5: Rampas, Muelles, Remolques y Trabajo Elevado ═══
  {
    module: "Rampas, Muelles y Elevación",
    title: "Operación en Rampas y Pendientes",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/ramps-slopes.png","alt":"Montacargas en una rampa con la carga apuntando cuesta arriba"},
      {
        "type": "heading",
        "level": 2,
        "text": "Operación en Rampas y Pendientes"
      },
      {"type": "technical_diagram", "kind": "ramps"},
      {
        "type": "heading",
        "level": 3,
        "text": "Viaje con Carga en Rampas"
      },
      {
        "type": "paragraph",
        "html": "Al viajar en una rampa <strong>con carga</strong>: mantenga la carga apuntando <strong>cuesta arriba</strong>. Esto significa conducir hacia adelante al subir una rampa y en reversa al bajar una rampa cuando está cargado."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Viaje sin Carga en Rampas"
      },
      {
        "type": "paragraph",
        "html": "Al viajar en una rampa <strong>sin carga</strong>: las horquillas deben apuntar <strong>cuesta abajo</strong>."
      },
      {
        "type": "scenario",
        "title": "Decisión en la Rampa",
        "prompt": "Recogió una tarima llena en el nivel superior y necesita llevarla hacia ABAJO por la rampa hasta el nivel del suelo. ¿Cuál es la forma correcta de descender?",
        "choices": [
          {
            "text": "Conducir hacia adelante bajando la rampa — se ve mejor",
            "correct": false,
            "feedback": "Con la carga apuntando cuesta abajo, la gravedad jala la tarima fuera de las horquillas y el centro de gravedad combinado se desplaza hacia el eje delantero — una receta para perder la carga o volcarse."
          },
          {
            "text": "Bajar la rampa en reversa para que la carga siga apuntando cuesta arriba",
            "correct": true,
            "feedback": "Correcto. Cargado en una rampa = la carga siempre apunta cuesta arriba. Al bajar, eso significa viajar en reversa, lentamente, mirando por encima del hombro o usando un ayudante."
          },
          {
            "text": "Dar la vuelta a mitad de la bajada para poner la carga cuesta arriba",
            "correct": false,
            "feedback": "Nunca gire en una rampa. Girar desplaza el centro de gravedad lateralmente en una pendiente — esta es una de las maniobras con mayor riesgo de volcadura que existen."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Reglas de Seguridad en Rampas"
      },
      {
        "type": "list",
        "items": [
          "Suba y baje lentamente",
          "En pendientes pronunciadas (>10%), viaje con la carga cuesta arriba",
          "Incline la carga ligeramente hacia atrás para estabilidad",
          "<strong>Nunca gire en una rampa</strong> — el riesgo de volcadura es extremadamente alto",
          "Nunca estacione en una rampa a menos que sea absolutamente necesario (calce las ruedas si debe hacerlo)"
        ]
      },
      {
        "type": "callout",
        "variant": "warning",
        "text": "Girar en una rampa aumenta dramáticamente el riesgo de volcadura. Siempre viaje directamente hacia arriba o hacia abajo."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Revise el límite de pendiente"
      },
      {
        "type": "paragraph",
        "html": "Estas indicaciones describen montacargas contrapesados convencionales. Algunos equipos solo pueden trabajar en pisos nivelados; un accesorio cambia la condición sin carga. Siga el manual y su capacitación específica. Avance recto, nunca gire atravesando la pendiente y eleve las horquillas solo para librar la superficie. Incline hacia atrás si corresponde. Si no puede ver, necesita un plan seguro, no elevar la carga."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Con carga: mantenga la carga apuntando cuesta arriba",
          "Sin carga: las horquillas apuntan cuesta abajo",
          "Nunca gire en una rampa — riesgo extremo de volcadura",
          "Viaje lentamente e incline la carga ligeramente hacia atrás"
        ]
      }
    ]),
  },
  {
    module: "Rampas, Muelles y Elevación",
    title: "Operaciones en Muelles de Carga",
    type: "lesson",
    estimatedMinutes: 5,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/dock-loading-scene.png","alt":"Montacargas entrando a un remolque sobre una placa de muelle en un muelle de carga"},
      {
        "type": "heading",
        "level": 2,
        "text": "Operaciones en Muelles de Carga"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Deténgase antes del muelle"
      },
      {
        "type": "list",
        "items": [
          "Verifique frenos y calzas del remolque o un procedimiento de retención autorizado que cumpla los requisitos aplicables. Impida que el remolque salga.",
          "Revise resistencia y estado del piso. Un remolque desacoplado puede necesitar soportes fijos para evitar que se incline.",
          "Use una placa de muelle asegurada y capaz de soportar equipo, carga y operador juntos. Compruebe apoyos y espacio superior.",
          "Entre recto y despacio. Mantenga distancia segura de los bordes, vigile movimiento o separación y deténgase si algo se desplaza."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Distribución de la carga"
      },
      {
        "type": "paragraph",
        "html": "Respete los límites del remolque, estante y plan de carga. Distribuya el peso según ese plan; no suponga que el objeto más pesado siempre va atrás. Mantenga alejadas a las personas. No use el montacargas para abrir o cerrar puertas de carga."
      },
      {
        "type": "key_takeaways",
        "items": [
          "Asegure el remolque y revise toda la ruta antes de entrar.",
          "La capacidad de la placa incluye el equipo, no solo la tarima."
        ]
      }
    ]),
  },
  {
    module: "Rampas, Muelles y Elevación",
    title: "Elevación de Personas y Trabajo Elevado",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/aerial-lift-scene.png","alt":"Trabajador con arnés en una plataforma elevada con un vigilante en el suelo"},
      {
        "type": "heading",
        "level": 2,
        "text": "Elevación de Personas y Trabajo Elevado"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Use equipo diseñado para elevar personas"
      },
      {
        "type": "paragraph",
        "html": "Nunca eleve a alguien sobre horquillas, una tarima o una plataforma improvisada. Una plataforma para personas no permite llevar pasajeros mientras circula."
      },
      {
        "type": "paragraph",
        "html": "Elevar personas requiere una combinación autorizada de equipo y plataforma, instrucciones del fabricante y protección contra caídas conforme a las reglas aplicables. Barandales o arnés por sí solos no hacen aceptable una plataforma improvisada. Pida al supervisor calificado que seleccione el equipo y el plan."
      },
      {
        "type": "list",
        "items": [
          "Mantenga a las personas lejos del mástil, puntos de aplastamiento y riesgos eléctricos superiores.",
          "Permanezca en los controles y mantenga comunicación según el procedimiento autorizado.",
          "No conduzca a otro lugar con una persona elevada. Baje la plataforma antes de reubicar el equipo."
        ]
      },
      {
        "type": "key_takeaways",
        "items": [
          "No use horquillas, tarimas ni plataformas improvisadas para personas.",
          "Este curso no autoriza a improvisar un sistema de elevación de personas."
        ]
      }
    ]),
  },
  // ═══ MÓDULO 6: Estacionamiento, Montacargas Desatendido y Apagado ═══
  {
    module: "Estacionamiento y Apagado",
    title: "Estacionamiento y Aseguramiento del Montacargas",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/parking-shutdown.png","alt":"Montacargas estacionado con horquillas bajadas, rueda calzada y pasos de apagado"},
      { type: "heading", level: 2, text: "Estacionamiento y Aseguramiento del Montacargas" },
      { type: "heading", level: 3, text: "Procedimiento de Estacionamiento" },
      { type: "paragraph", html: "Cada apagado sigue la misma secuencia. Ponga los pasos en orden — hará esto al final de cada turno por el resto de su carrera." },
      { type: "drag_drop", mode: "ordering",
        prompt: "Ordene los pasos del procedimiento de estacionamiento en la secuencia correcta.",
        items: [
          { id: "p1", label: "Baje las horquillas completamente planas al suelo" },
          { id: "p2", label: "Incline las horquillas ligeramente hacia adelante" },
          { id: "p3", label: "Ponga el freno de estacionamiento" },
          { id: "p4", label: "Neutralice todos los controles" },
          { id: "p5", label: "Apague el motor / la energía" },
          { id: "p6", label: "Retire la llave" },
        ] },
      { type: "heading", level: 3, text: "Ubicación de Estacionamiento" },
      { type: "paragraph", html: "Estacione solo en <strong>áreas designadas</strong>. Nunca bloquee salidas de incendio, equipo de emergencia o carriles de tráfico. Si estaciona en una pendiente, calce las ruedas." },
      { type: "key_takeaways", items: [
        "Baje horquillas, ponga freno, neutralice controles, apague motor, retire llave",
        "Estacione solo en áreas designadas",
        "Nunca bloquee salidas de incendio o equipo de emergencia",
        "Calce las ruedas si estaciona en una pendiente",
      ] },
    ]),
  },
  {
    module: "Estacionamiento y Apagado",
    title: "Definición de Montacargas Desatendido",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/parking-shutdown.png","alt":"Montacargas estacionado y asegurado"},
      {
        "type": "heading",
        "level": 2,
        "text": "Montacargas Desatendido: Cuándo y Qué Hacer"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Basta con una de las dos condiciones"
      },
      {
        "type": "paragraph",
        "html": "El equipo está <strong>desatendido cuando usted está a 25 pies o más aunque lo vea, O siempre que quede fuera de su vista</strong>. Basta con una condición."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Antes de dejarlo desatendido"
      },
      {
        "type": "list",
        "items": [
          "Baje por completo las horquillas o el dispositivo que sostiene la carga.",
          "Ponga los controles en neutral, apague y aplique los frenos.",
          "Bloquee las ruedas si está en una pendiente. Siga las reglas del sitio sobre retirar la llave y evitar uso no autorizado."
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Cerca y a la vista"
      },
      {
        "type": "paragraph",
        "html": "Si baja del equipo pero permanece a menos de 25 pies y lo ve, baje por completo las horquillas, ponga controles en neutral y aplique frenos. Respete cualquier regla del sitio más estricta."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Aplique la regla"
      },
      {
        "type": "paragraph",
        "html": "Usted camina detrás de un estante a diez pies y ya no ve el equipo. Está desatendido: la corta distancia no elimina la regla de fuera de vista. Reporte todos los accidentes y los incidentes que casi los causen, aunque nadie resulte herido."
      },
      {
        "type": "key_takeaways",
        "items": [
          "A 25 pies o más O fuera de vista: desatendido.",
          "Baje las horquillas y asegure el equipo incluso en una parada breve."
        ]
      }
    ]),
  },
  {
    module: "Estacionamiento y Apagado",
    title: "Verificación de Conocimiento: Operación Segura y Apagado",
    type: "checkpoint",
    estimatedMinutes: 3,
    config: { passing_score: 0, max_attempts: 999 },
    questions: [
      {"question": "Los peatones tienen prioridad de paso cerca de los montacargas.", "type": "mcq_single", "options": ["Verdadero", "Falso"], "correctAnswers": "Verdadero", "explanation": "Ceda el paso a peatones; confirme que estén fuera de la trayectoria antes de avanzar."},
      {"question": "Al acercarse a una intersección, debe:", "type": "mcq_single", "options": ["Acelerar para pasar rápidamente", "Detenerse, tocar la bocina y mirar a ambos lados", "Hacer señales con las luces", "Suponer que no viene nadie"], "correctAnswers": "Detenerse, tocar la bocina y mirar a ambos lados", "explanation": "Reduzca la velocidad, deténgase cuando sea necesario, toque la bocina y compruebe que el cruce esté libre."},
      { question: "Al viajar SUBIENDO una rampa con carga, la carga debe mirar:", type: "mcq_single", options: ["Cuesta abajo", "Cuesta arriba", "No importa", "De lado"], correctAnswers: "Cuesta arriba", explanation: "Al viajar en una rampa con carga, mantenga la carga apuntando cuesta arriba para evitar que se deslice de las horquillas." },
    ],
  },

  // ═══ MÓDULO 7: Reglas Específicas del Sitio + Paquete del Empleador ═══
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "La Importancia de la Capacitación Específica del Sitio",
    type: "lesson",
    estimatedMinutes: 4,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/banners/warehouse-aisle.png","alt":"Pasillo de almacén mostrando espacios libres específicos del sitio"},
      {
        "type": "heading",
        "level": 2,
        "text": "La Importancia de la Capacitación Específica del Sitio"
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Cada Lugar de Trabajo es Diferente"
      },
      {
        "type": "paragraph",
        "html": "Cada lugar de trabajo tiene peligros únicos: pasillos estrechos, patrones de tráfico peatonal específicos, muelles de carga, configuraciones de estantería, áreas de almacenamiento frío, áreas exteriores y más. Su supervisor debe revisar las <strong>políticas específicas del sitio</strong> con usted antes de operar en cualquier nueva ubicación."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Temas Específicos del Sitio"
      },
      {
        "type": "list",
        "items": [
          "Límites de velocidad de la instalación y patrones de tráfico",
          "Áreas designadas de estacionamiento y carga",
          "Zonas peatonales y cruces",
          "Procedimientos de emergencia y puntos de reunión",
          "Protocolos de comunicación (radio, señales)",
          "Tipos de equipo específicos y accesorios utilizados"
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Lo Que Su Empleador Le Debe"
      },
      {
        "type": "paragraph",
        "html": "OSHA impone deberes específicos a su empleador. Voltee cada tarjeta para ver de qué es responsable."
      },
      {
        "type": "flip_cards",
        "title": "Responsabilidades del Empleador",
        "cards": [
          {
            "front": "Capacitación Práctica",
            "back": "Capacitación práctica en el equipo específico que operará, en el lugar de trabajo real, antes de trabajar solo."
          },
          {
            "front": "Evaluación",
            "back": "Un supervisor o instructor calificado debe observarlo operar y aprobar formalmente su competencia."
          },
          {
            "front": "Documentación",
            "back": "Formularios de evaluación firmados, permisos y registros de asistencia archivados — OSHA puede solicitarlos durante las inspecciones."
          },
          {
            "front": "Capacitación de Actualización",
            "back": "Requerida después de un accidente o casi-accidente, cuando se observa operación insegura, o cuando cambia a un nuevo equipo o una nueva instalación."
          },
          {
            "front": "Re-Evaluación",
            "back": "Al menos cada 3 años, su empleador debe re-evaluar su desempeño para mantener su certificación vigente."
          }
        ]
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Atmósferas peligrosas y ventilación"
      },
      {
        "type": "paragraph",
        "html": "El gas LP no es automáticamente seguro en interiores. Pueden acumularse monóxido de carbono y gases diésel; el monóxido no tiene olor de advertencia. Use solo el tipo de equipo y ventilación autorizados. Ante una alarma, dolor de cabeza, mareo o náusea, deténgase con seguridad, salga al aire fresco y siga el plan de emergencia. Una puerta abierta no garantiza seguridad."
      },
      {
        "type": "paragraph",
        "html": "Vapores inflamables, polvo combustible y fibras pueden exigir equipos con designaciones especiales según 1910.178(c). Las designaciones E/EX/LP son distintas de las siete clases. No entre en un área clasificada hasta que el empleador confirme que el equipo es adecuado."
      },
      {
        "type": "heading",
        "level": 3,
        "text": "Recorra el trabajo con su evaluador"
      },
      {
        "type": "list",
        "items": [
          "Identifique pisos, pendientes, bordes, pasillos estrechos, obstáculos superiores, iluminación y riesgos del clima.",
          "Revise pesos reales, alturas de apilado, límites de estantes, rutas peatonales y áreas restringidas.",
          "Practique controles, accesorios y procedimiento de emergencia en el equipo real. Deténgase si las condiciones superan sus límites.",
          "Demuestre inspección, circulación, manejo de cargas y apagado. Pregunte en un idioma que entienda; un examen escrito no demuestra por sí solo una operación segura."
        ]
      },
      {"type": "scenario", "title": "¿Avanzar o detenerse?", "prompt": "Hay un montacargas de gas LP disponible, pero el recinto tiene mala ventilación y una alarma de gases. ¿Qué hace?", "choices": [{"text": "Detenerse, salir con seguridad y reportar; usar solo un plan seguro autorizado.", "correct": true, "feedback": "Correcto. El tipo de combustible no garantiza que un recinto sea seguro."}, {"text": "Abrir una puerta y continuar sin comprobar.", "correct": false, "feedback": "Una puerta abierta no garantiza aire seguro. Siga el procedimiento de emergencia y ventilación."}]},
      {
        "type": "key_takeaways",
        "items": [
          "Cada lugar de trabajo tiene peligros únicos que requieren capacitación específica del sitio",
          "Su supervisor debe revisar las políticas del sitio antes de que usted opere",
          "Se requiere capacitación adicional para equipo o instalaciones nuevas",
          "Después de accidentes o comportamiento inseguro observado, se requiere recapacitación"
        ]
      }
    ]),
  },
  // Consolidado de tres pasos de descarga separados en uno para reducir
  // clics antes del examen final (2026-07-16). Mismos archivos y URLs.
  {
    module: "Reglas del Sitio y Paquete del Empleador",
    title: "Paquete del Empleador y Documentos de Referencia",
    type: "download",
    estimatedMinutes: 2,
    config: {
      description: "Su empleador debe completar una evaluación práctica antes de que pueda operar un montacargas en su instalación. Proporcione los primeros tres formularios a su supervisor: la lista de evaluación de desempeño, el formulario de permiso/autorización del operador y la hoja de asistencia del sitio. Consulte la norma vigente de OSHA y el manual del equipo; las presentaciones antiguas pueden contener indicaciones incompatibles con la guía actual.",
      downloads: [
        { label: "Prueba de Desempeño (PDF)", url: "/api/documents/performance-evaluation/download?locale=es", filename: "PERFORMANCE-TEST.pdf" },
        { label: "Permiso de Operación PIT (PDF)", url: "/api/documents/operator-permit/download?locale=es", filename: "Powered-Industrial-Truck-PIT-PERMIT-TO-OPERATE.pdf" },
        { label: "Formulario de Asistencia y Programación (PDF)", url: "/api/documents/attendance-sheet/download?locale=es", filename: "ATTENDANCE-FORM-AND-SCHEDULING.pdf" },
      ],
      important: "Haga que su supervisor complete estos formularios y los mantenga archivados. OSHA puede solicitar estos registros durante las inspecciones.",
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
      // 2026-09-03 (Alberto): examen reemplazado con el conjunto de preguntas del
      // sitio anterior (las mismas 28 preguntas), en un nuevo orden. Espejo de
      // course-content.ts.
      { question: "Se permite pasar por encima de un objeto en el piso (como una tabla o roca), solo si el montacargas no transporta carga.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "Nunca pase por encima de objetos sueltos. Los desechos en el piso pueden desestabilizar la carga o el camión y causar una volcadura o pérdida de la carga." },
      {"question": "En un piso nivelado y despejado, ¿cómo debe llevar la carga al circular?", "type": "mcq_single", "options": ["Alta para ver debajo", "Baja, con solo el espacio necesario según el manual", "A la altura de los ojos"], "correctAnswers": "Baja, con solo el espacio necesario según el manual", "explanation": "Mantenga la carga baja; normalmente 4 a 6 pulgadas en superficies niveladas, según el equipo y el piso."},
      { question: "Solo operadores autorizados y entrenados pueden operar un montacargas.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "OSHA requiere que cada operador sea capacitado y autorizado por su empleador antes de operar un camión industrial motorizado." },
      { question: "Una vez reportado un daño en el montacargas, ¿qué tan pronto debe ser reparado?", type: "mcq_single", options: ["En el próximo programa de mantenimiento agendado", "Tan pronto como tenga disponibilidad para agendar la reparación", "Antes de que sea utilizado nuevamente el montacargas"], correctAnswers: "Antes de que sea utilizado nuevamente el montacargas", explanation: "Un montacargas con un defecto de seguridad debe quedar fuera de servicio y repararse antes de volver a usarse." },
      { question: "Es muy fácil voltearse con un montacargas cuando se mueve en una rampa o superficies inclinadas, aun cuando el equipo esté vacío o con carga.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Las rampas y pendientes desplazan el centro de gravedad. Siempre viaje directo hacia arriba o abajo, lentamente, y nunca gire en una rampa." },
      {"question": "Si el pasillo está vacío, puede exceder el límite de velocidad del sitio.", "type": "mcq_single", "options": ["Verdadero", "Falso"], "correctAnswers": "Falso", "explanation": "Respete el límite y reduzca más la velocidad si necesita mayor distancia para detenerse."},
      { question: "Si se adicionan aditamentos al montacargas, no existe ningún efecto o cambio en la capacidad de carga del equipo.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "Los aditamentos cambian el centro de gravedad y REDUCEN la capacidad nominal. Siempre verifique la capacidad ajustada en la placa de datos." },
      { question: "Al ir manejando el montacargas y quiere cambiar de dirección (por ejemplo: desde adelante hacia atrás), es más seguro:", type: "mcq_single", options: ["Reducir la velocidad alrededor de 1 mph", "Detenerse por completo", "No existe una velocidad máxima para hacerlo"], correctAnswers: "Detenerse por completo", explanation: "Siempre deténgase por completo antes de cambiar de dirección. Los cambios abruptos de dirección pueden desplazar o derramar la carga." },
      {"question": "Se permite transportar pasajeros no autorizados si usan un arnés.", "type": "mcq_single", "options": ["Verdadero", "Falso"], "correctAnswers": "Falso", "explanation": "Un arnés no autoriza a transportar pasajeros ni usar plataformas improvisadas."},
      {"question": "La capacitación de operadores requiere:", "type": "mcq_single", "options": ["Instrucción formal", "Capacitación práctica", "Evaluación del desempeño en el trabajo", "Todas las anteriores"], "correctAnswers": "Todas las anteriores", "explanation": "Se requieren las tres partes; el examen en línea no sustituye la práctica ni la evaluación."},
      { question: "La inclinación excesiva de la carga o los cambios repentinos de dirección pueden resultar en un montacargas volcado y/o una carga derramada.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Los movimientos repentinos desplazan la carga y el centro de gravedad. Opere suavemente: sin inclinaciones, giros o frenados abruptos." },
      { question: "La bocina debe usarse para:", type: "mcq_single", options: ["Avisar a todos que el montacargas tiene el derecho preferente de paso", "Alertar a los peatones y/o equipos cuando llega a las intersecciones o puntos ciegos", "Asustar a los trabajadores para que se alejen del camino cuando el montacargas está cerca"], correctAnswers: "Alertar a los peatones y/o equipos cuando llega a las intersecciones o puntos ciegos", explanation: "La bocina es un dispositivo de advertencia, no una exigencia de derecho de paso. Tóquela en intersecciones, esquinas ciegas y puertas." },
      { question: "Si desea levantar una carga más pesada que la capacidad del montacargas, hay que colocar una persona en el contrapeso del equipo.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Falso", explanation: "Nunca use personas como contrapeso. Si la carga excede la capacidad nominal, use un camión de mayor capacidad." },
      {"question": "Puede elevar a un trabajador sobre horquillas desnudas si se lo pide.", "type": "mcq_single", "options": ["Verdadero", "Falso"], "correctAnswers": "Falso", "explanation": "Nunca eleve personas sobre horquillas desnudas o tarimas. Use equipo autorizado y siga el procedimiento específico."},
      { question: "¿Qué debería hacer un operador de montacargas al acercarse a una intersección?", type: "mcq_single", options: ["Disminuir la velocidad y hacer sonar la bocina", "Revisar si existe algún peligro en el camino inclinándose afuera de la cabina del montacargas", "Pasar lo más rápido posible"], correctAnswers: "Disminuir la velocidad y hacer sonar la bocina", explanation: "En cada intersección: disminuya la velocidad, toque la bocina y mire en ambas direcciones. Nunca se incline fuera de la jaula protectora." },
      { question: "Un operador de montacargas debe mantener todas las partes de su cuerpo adentro de las líneas de la jaula de seguridad en todo momento.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Mantenga todo su cuerpo dentro de la jaula protectora. Extender un brazo o pierna fuera crea un peligro de aplastamiento con el mástil y los alrededores." },
      {"question": "Está a diez pies del equipo, pero un estante le impide verlo. ¿Qué corresponde?", "type": "mcq_single", "options": ["No está desatendido por estar cerca", "Está desatendido: baje horquillas, neutralice controles, apague y aplique frenos", "Basta con tocar la bocina"], "correctAnswers": "Está desatendido: baje horquillas, neutralice controles, apague y aplique frenos", "explanation": "Fuera de vista significa desatendido a cualquier distancia. Bloquee ruedas en pendiente y siga la regla del sitio para retirar la llave."},
      { question: "Todos los accidentes o lesiones, aunque sean pequeños, deben ser informados a su supervisor o jefe inmediatamente.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Reporte cada accidente, lesión y casi-accidente inmediatamente, sin importar qué tan pequeño sea. Lo protege y corrige peligros antes de que alguien se lastime seriamente." },
      { question: "¿Quién tiene el derecho de paso?", type: "mcq_single", options: ["El montacargas en el pasillo principal", "Los peatones", "Cualquier montacargas que se aproxime por el costado derecho"], correctAnswers: "Los peatones", explanation: "Los peatones siempre tienen el derecho de paso. Deténgase, haga contacto visual y proceda solo cuando estén fuera del camino." },
      {"question": "Se permite fumar en un área de carga de baterías si no huele a gas.", "type": "mcq_single", "options": ["Verdadero", "Falso"], "correctAnswers": "Falso", "explanation": "No fumar ni producir llamas o chispas. El hidrógeno puede acumularse sin un olor de advertencia."},
      { question: "Todo operador debe conocer la capacidad de carga del montacargas que le sea asignado por la compañía.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Conozca la capacidad nominal de su máquina antes de levantar cualquier carga. Está en la placa de datos y es su límite legal de elevación." },
      {"question": "En una pendiente, ¿cómo deben ir las horquillas y la carga, si el equipo permite inclinación?", "type": "mcq_single", "options": ["Lo más alto posible", "Inclinadas hacia atrás, elevadas solo para librar la superficie", "Inclinadas hacia adelante al bajar"], "correctAnswers": "Inclinadas hacia atrás, elevadas solo para librar la superficie", "explanation": "Siga los límites y el manual del equipo. No eleve más de lo necesario ni aplique una regla de inclinación a un diseño que no la permite."},
      { question: "Al cambiar un tanque de gas LPG, los operadores deben usar guantes.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "El propano líquido causa congelación al contacto. Siempre use guantes al manejar tanques de GLP." },
      { question: "Antes de efectuar un giro, un operador debiera disminuir la velocidad para evitar que el equipo se voltee y así evitar el derrame de la carga.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Disminuya la velocidad antes del giro, no durante. Girar a velocidad desplaza el centro de gravedad lateralmente y es una causa principal de volcaduras." },
      { question: "¿Debería ser excedida la capacidad de carga del montacargas?", type: "mcq_single", options: ["Siempre que exista el espacio suficiente", "Nunca", "Siempre y cuando mejore su visibilidad"], correctAnswers: "Nunca", explanation: "Nunca exceda la capacidad nominal, por ningún motivo. La sobrecarga es la causa principal de volcaduras." },
      { question: "Como operador, es su responsabilidad el cumplir todas las normas y procedimientos de seguridad de la compañía, incluso si está muy ocupado.", type: "mcq_single", options: ["Verdadero", "Falso"], correctAnswers: "Verdadero", explanation: "Las reglas de seguridad aplican en todo momento, especialmente bajo presión. Los atajos en los procedimientos de seguridad causan accidentes." },
      { question: "Como operador de montacargas:", type: "mcq_single", options: ["Es su responsabilidad alertar a los peatones de su presencia usando su bocina y asegurarse de que estén lejos de su camino", "Es responsabilidad de los peatones permanecer fuera del camino después de haber sonado la bocina para avisarles que se acerca", "Es responsabilidad de la administración mantener alejados a los peatones del área de trabajo"], correctAnswers: "Es su responsabilidad alertar a los peatones de su presencia usando su bocina y asegurarse de que estén lejos de su camino", explanation: "El operador es responsable de la seguridad de los peatones: advierta con la bocina, haga contacto visual y verifique que el camino esté libre antes de moverse." },
      // 2026-09-13 (Alberto): dos preguntas más difíciles para reducir los
      // puntajes fáciles de 100%. Espejo de course-content.ts.
      {"question": "La placa indica 5,000 lb a 24 pulgadas. Su carga pesa 4,800 lb pero tiene un centro de carga de 36 pulgadas. ¿Qué debe hacer?", "type": "mcq_single", "options": ["Levantar porque pesa menos de 5,000 lb", "Detenerse y comprobar en la placa o con el fabricante la capacidad para esa configuración", "Inclinar al máximo para aumentar capacidad", "Añadir contrapeso"], "correctAnswers": "Detenerse y comprobar en la placa o con el fabricante la capacidad para esa configuración", "explanation": "Un centro de carga mayor puede reducir la capacidad. La cifra a 24 pulgadas no autoriza levantar a 36; no calcule una capacidad segura por su cuenta."},
      { question: "Está conduciendo un montacargas SIN CARGA bajando una rampa. ¿Hacia dónde deben apuntar las horquillas y por qué?", type: "mcq_single", options: ["Cuesta arriba — la misma regla que un camión cargado", "Cuesta abajo — el peso de un camión sin carga está en la parte trasera, así que las horquillas apuntan cuesta abajo para mantener estable el centro de gravedad", "No importa cuando el camión está vacío", "Cuesta arriba — para poder ver por encima del mástil"], correctAnswers: "Cuesta abajo — el peso de un camión sin carga está en la parte trasera, así que las horquillas apuntan cuesta abajo para mantener estable el centro de gravedad", explanation: "Los camiones cargados viajan con la carga cuesta arriba, pero un camión SIN CARGA es lo contrario: sin carga, el contrapeso pesado está en la parte trasera, así que las horquillas apuntan cuesta abajo. Confundir estas dos es un error común y peligroso." },
    ],
  },
  {
    module: "Examen Final y Finalización",
    title: "Felicitaciones: ¿Qué Sigue?",
    type: "lesson",
    estimatedMinutes: 3,
    config: blocks([
      {"type":"hero_image","src":"/images/training/photos/ppe-workers-scene.png","alt":"Equipo de trabajadores certificados con EPP frente a un montacargas"},
      { type: "heading", level: 2, text: "Instrucción teórica completada: ¿Qué sigue?" },
      { type: "heading", level: 3, text: "Su Certificado" },
      { type: "paragraph", html: "¡Felicitaciones por completar la porción de instrucción formal de su certificación de operador de montacargas! Su constancia de instrucción teórica estará disponible al completar el curso. No sustituye la autorización del empleador para operar. Incluye un número de certificado único y código QR que los empleadores pueden usar para verificación instantánea." },
      { type: "heading", level: 3, text: "Siguiente Paso: Evaluación Práctica" },
      { type: "paragraph", html: "Recuerde, su empleador aún debe completar la <strong>evaluación práctica en persona</strong> en su lugar de trabajo. Comparta el paquete de documentación del empleador (disponible en el Módulo 7) con su supervisor. Incluye:" },
      { type: "list", items: [
        "Lista de Evaluación de Desempeño",
        "Formulario de Permiso / Autorización del Operador",
        "Hoja de Asistencia del Sitio",
      ] },
      { type: "heading", level: 3, text: "Su Tarjeta de Billetera" },
      // 2026-09-03 (Alberto): la tarjeta NO es opcional - cada graduado recibe
      // una, enviada dentro de 4-5 días hábiles a la dirección que el
      // administrador del equipo proporcionó al comprar. Mirrors course-content.ts.
      { type: "paragraph", html: "Su tarjeta de operador se enviará a la dirección proporcionada al comprar la capacitación. Consulte el estado de la opción con foto a continuación." },
      { type: "heading", level: 3, text: "Manténgase Seguro" },
      { type: "paragraph", html: "Su capacitación no termina aquí. Continúe siguiendo los procedimientos de operación segura todos los días. Si alguna vez tiene preguntas o necesita una actualización, puede volver a visitar este curso en cualquier momento. ¡Manténgase seguro!" },
      { type: "callout", variant: "tip", text: "Guarde el enlace de su página de verificación — los empleadores pueden usarlo para verificar instantáneamente su certificación." },
      { type: "key_takeaways", items: [
        "Descargue su certificado desde su página de certificación",
        "Comparta el paquete del empleador con su supervisor para la evaluación práctica",
        "Su tarjeta de billetera llegará dentro de 4 a 5 días hábiles",
        "La re-evaluación es requerida al menos cada 3 años",
      ] },
    ]),
  },
];
