import { industry } from "@shared/config/industry";

interface ProductTranslation {
  title: string;
  shortDescription: string;
  longDescription: string;
  duration: string;
  includes: string[];
  priceLabel?: string;
  languages?: string[];
  equipmentCovered?: string[];
}

export const catalogEs: Record<string, ProductTranslation> = {
  "pit-online": {
    title: "Vehículos Industriales Motorizados – Certificación de Operador de Montacargas",
    shortDescription: `Domine las habilidades esenciales de montacargas con nuestro curso en línea, a su propio ritmo, conforme a ${industry.regulatory.body}. Reciba su certificado reconocido por la industria inmediatamente al completar.`,
    longDescription: `Nuestro programa integral de capacitación en línea de Vehículos Industriales Motorizados está diseñado para enseñar habilidades esenciales de montacargas para el cumplimiento de ${industry.regulatory.body} y el avance profesional. Impartido a través de lecciones interactivas y escenarios del mundo real, este curso a su propio ritmo cubre la operación segura de camiones industriales y el cumplimiento de las normas de ${industry.regulatory.body}. Ya sea un nuevo operador o esté renovando su certificación, estudie en cualquier dispositivo y reciba su certificado imprimible instantáneamente al aprobar la evaluación final. ¿Capacitando a su equipo? Agregue múltiples asientos y ahorre con precios por volumen — obtendrá un panel de gestión de equipo para invitar miembros, rastrear progreso y descargar certificados.`,
    duration: "1-2 horas",
    includes: [
      "Módulos interactivos y ayudas visuales",
      "Estudios de caso y cuestionarios del mundo real",
      "Simulaciones virtuales",
      "Instrucción integral de seguridad",
      "Evaluación final",
      "Certificado reconocido por la industria al completar",
      "Acceso en cualquier dispositivo",
      "Reintentos ilimitados",
      "Panel de gestión de equipo (2+ asientos)",
      "Seguimiento de progreso en tiempo real (2+ asientos)"
    ],
    priceLabel: "por asiento",
    languages: ["Inglés", "Español"],
  },
  "std-forklift-sd": {
    title: "Certificación Estándar de Montacargas (LPG de Asiento o EPJ)",
    shortDescription: "Certificación práctica de montacargas para operadores de contrapeso de asiento (LPG) y transpaleta eléctrica en San Diego.",
    longDescription: `Certifíquese en montacargas estándar de contrapeso de asiento (LPG) o transpaletas eléctricas (EPJ) con nuestro programa de capacitación práctica en San Diego. Este curso cubre las regulaciones de ${industry.regulatory.body}, operación segura y efectiva de montacargas a través de experiencias de aprendizaje interactivas, presentaciones, estudios de caso, discusiones grupales y entrenamiento de simulación en almacén. Reciba su licencia reconocida por ${industry.regulatory.body} y su tarjeta de identificación de operador tamaño billetera el mismo día.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula con presentaciones",
      "Entrenamiento práctico de simulación en almacén",
      "Estudios de caso y discusiones grupales",
      "Evaluación escrita y práctica",
      `Licencia de montacargas reconocida por ${industry.regulatory.body}`,
      "Tarjeta de identificación de operador tamaño billetera",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "scissor-aerial-sd": {
    title: "Certificación Estándar de Elevador de Tijera y Pluma/Aéreo",
    shortDescription: `Certifíquese en elevadores de tijera y elevadores de pluma/aéreos en San Diego. Instrucción práctica para operación segura y conforme a ${industry.regulatory.body}.`,
    longDescription: `Eleve su carrera con nuestra Capacitación Estándar de Elevador de Tijera y Pluma/Aéreo en San Diego, ofreciendo instrucción práctica para operación segura y conforme a ${industry.regulatory.body}. Este curso proporciona conocimiento esencial y experiencia práctica para operar elevadores aéreos de manera segura y eficiente, cubriendo tanto elevadores de tijera como elevadores de pluma/aéreos. Ideal para operadores primerizos que buscan certificación y operadores experimentados que buscan recertificación o capacitación avanzada.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico de elevador de tijera",
      "Entrenamiento de operación de elevador de pluma/aéreo",
      "Procedimientos de protección contra caídas",
      "Entrenamiento de evaluación de peligros",
      "Entrenamiento de inspección pre-operación",
      "Evaluación escrita y práctica",
      "Certificado de finalización"
    ],
    languages: ["Inglés", "Español"],
  },
  "reach-sd": {
    title: "Capacitación y Certificación de Reach",
    shortDescription: `Certificación práctica de operador de reach truck en San Diego. Habilidades esenciales y capacitación de seguridad conforme a ${industry.regulatory.body} para operación eficiente.`,
    longDescription: `Nuestra Capacitación y Certificación de Reach en San Diego es un curso práctico que lo equipa con habilidades esenciales y conocimiento de seguridad para operar reach trucks de manera eficiente y conforme a los estándares de ${industry.regulatory.body}. La combinación de instrucción en aula y entrenamiento práctico asegura que esté completamente preparado para operaciones seguras en almacén. Ideal para operadores primerizos y experimentados.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico de reach truck",
      "Técnicas de operación en pasillos estrechos",
      "Entrenamiento de manejo de altura",
      "Procedimientos de inspección pre-operación",
      "Evaluación escrita y práctica",
      "Certificado de finalización"
    ],
    languages: ["Inglés", "Español"],
  },
  "order-picker-sd": {
    title: "Capacitación y Certificación de Order Picker",
    shortDescription: `Capacitación y certificación de operador de order picker en San Diego. Programa práctico para operaciones seguras y conformes a ${industry.regulatory.body}.`,
    longDescription: `Impulse su carrera con nuestra Capacitación y Certificación de Order Picker en San Diego, un programa práctico que lo equipa con las habilidades esenciales para operaciones seguras y conformes a ${industry.regulatory.body}. Este curso incluye presentaciones dinámicas, ayudas visuales, estudios de caso del mundo real, discusiones grupales, entrenamiento práctico e instrucción integral de seguridad. Al completar exitosamente, obtenga acceso exclusivo a una red de colocación laboral.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Presentaciones dinámicas y ayudas visuales",
      "Estudios de caso del mundo real",
      "Discusiones grupales",
      "Entrenamiento práctico",
      "Instrucción integral de seguridad",
      "Evaluación escrita y práctica",
      "Certificado de finalización",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "reach-forklift-sd": {
    title: "Capacitación Práctica de Reach y Montacargas (LPG de Asiento + Reach)",
    shortDescription: "Combo de doble capacitación: certificación de montacargas LPG de asiento y reach truck en San Diego. Dos certificaciones en una sesión.",
    longDescription: "Impulse su carrera con nuestra Capacitación Práctica de Reach y Montacargas, un programa integral de doble capacitación diseñado para equiparlo con habilidades prácticas esenciales para operar tanto montacargas LPG de asiento como reach trucks de manera segura y eficiente. Certifíquese en dos tipos de equipo rápidamente y desbloquee oportunidades emocionantes en almacenamiento y logística.",
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Entrenamiento de montacargas LPG de asiento",
      "Entrenamiento de operación de reach truck",
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico",
      "Evaluaciones escritas y discusiones grupales",
      "Evaluaciones escritas y prácticas",
      "Certificados para ambos tipos de equipo"
    ],
    languages: ["Inglés", "Español"],
  },
  "orderpicker-forklift-sd": {
    title: "Capacitación Práctica de Order Picker y Montacargas (LPG de Asiento + Order Picker)",
    shortDescription: "Combo de doble capacitación: certificación de montacargas LPG de asiento y order picker en San Diego. Dos certificaciones en una sesión.",
    longDescription: `Nuestro programa especializado de doble capacitación en San Diego equipa a los operadores con habilidades y conocimientos esenciales para gestionar operaciones de recolección de pedidos y manejo de montacargas, asegurando el cumplimiento de las regulaciones de ${industry.regulatory.body}. La capacitación incluye presentaciones dinámicas, ayudas visuales, estudios de caso del mundo real, discusiones grupales, entrenamiento práctico, instrucción integral de seguridad y evaluaciones.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Entrenamiento de montacargas LPG de asiento",
      "Entrenamiento de operación de order picker",
      "Presentaciones dinámicas y ayudas visuales",
      "Estudios de caso del mundo real",
      "Entrenamiento práctico",
      "Instrucción integral de seguridad",
      "Certificados para ambos tipos de equipo",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "forklift-scissor-epj-sd": {
    title: "Certificación de Montacargas, Elevador de Tijera y EPJ",
    shortDescription: "Triple certificación: montacargas LPG de asiento, elevador de tijera y transpaleta eléctrica (EPJ) en San Diego.",
    longDescription: `Certifíquese en tres tipos de equipo en una sesión integral. Esta capacitación conforme a ${industry.regulatory.body} cubre operación segura, manejo de carga y seguridad en el lugar de trabajo para montacargas LPG de asiento, elevadores de tijera y transpaletas eléctricas (EPJ). El programa proporciona conocimiento esencial y experiencia práctica a través de instrucción en aula y entrenamiento práctico.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Certificación de montacargas LPG de asiento",
      "Certificación de elevador de tijera",
      "Certificación de transpaleta eléctrica (EPJ)",
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico para todo el equipo",
      "Evaluaciones escritas y prácticas",
      "Certificados para los tres tipos de equipo"
    ],
    equipmentCovered: ["Montacargas LPG de Asiento", "Elevador de Tijera", "Transpaleta Eléctrica (EPJ)"],
    languages: ["Inglés", "Español"],
  },
  "all-in-one-sd": {
    title: "Certificación de Montacargas, Elevador de Tijera, Order Picker/Reach y EPJ",
    shortDescription: "Certificación todo en uno: Montacargas + Elevador de Tijera + Order Picker/Reach + EPJ. Máximo valor, calificaciones completas de operador en San Diego.",
    longDescription: `Nuestro paquete de capacitación más integral en San Diego. Certifíquese para operar montacargas LPG de asiento, elevadores de tijera (JLG 1930), order pickers/reach trucks y transpaletas eléctricas (EPJ) de manera segura y eficiente, asegurando el cumplimiento de ${industry.regulatory.body}. Este programa todo en uno otorga a los operadores la gama más amplia de calificaciones de equipo.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Certificación de montacargas de asiento (LPG)",
      "Certificación de elevador de tijera (JLG 1930)",
      "Certificación de order picker o reach truck",
      "Certificación de transpaleta eléctrica (EPJ)",
      "Instrucción en aula para todo el equipo",
      "Entrenamiento práctico para todo el equipo",
      "Evaluaciones escritas y prácticas",
      "Certificados para todos los tipos de equipo"
    ],
    equipmentCovered: ["Montacargas LPG de Asiento", "Elevador de Tijera (JLG 1930)", "Order Picker / Reach Truck", "Transpaleta Eléctrica (EPJ)"],
    languages: ["Inglés", "Español"],
  },
  "std-forklift-lv": {
    title: "Certificación Estándar de Montacargas (LPG de Asiento o EPJ)",
    shortDescription: "Certificación práctica de montacargas para operadores de contrapeso de asiento (LPG) y transpaleta eléctrica en Las Vegas.",
    longDescription: `Certifíquese en montacargas estándar de contrapeso de asiento (LPG) o transpaletas eléctricas (EPJ) con nuestro programa de capacitación práctica en Las Vegas. Este curso cubre las regulaciones de ${industry.regulatory.body}, operación segura y efectiva de montacargas. Reciba su licencia reconocida por ${industry.regulatory.body} y su tarjeta de identificación de operador tamaño billetera el mismo día.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula con presentaciones",
      "Entrenamiento práctico de simulación en almacén",
      "Estudios de caso y discusiones grupales",
      "Evaluación escrita y práctica",
      `Licencia de montacargas reconocida por ${industry.regulatory.body}`,
      "Tarjeta de identificación de operador tamaño billetera",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "scissor-aerial-lv": {
    title: "Certificación Estándar de Elevador de Tijera y Pluma/Aéreo",
    shortDescription: `Certifíquese en elevadores de tijera y elevadores de pluma/aéreos en Las Vegas. Instrucción práctica para operación segura y conforme a ${industry.regulatory.body}.`,
    longDescription: `Eleve su carrera con nuestra Capacitación Estándar de Elevador de Tijera y Pluma/Aéreo en Las Vegas, ofreciendo instrucción práctica para operación segura y conforme a ${industry.regulatory.body}. Certifíquese rápidamente y desbloquee oportunidades laborales mejoradas en industrias como construcción y mantenimiento.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico de elevador de tijera",
      "Entrenamiento de operación de elevador de pluma/aéreo",
      "Procedimientos de protección contra caídas",
      "Entrenamiento de evaluación de peligros",
      "Entrenamiento de inspección pre-operación",
      "Evaluación escrita y práctica",
      "Certificado de finalización"
    ],
    languages: ["Inglés", "Español"],
  },
  "reach-lv": {
    title: "Capacitación y Certificación de Reach",
    shortDescription: `Certificación práctica de operador de reach truck en Las Vegas. Habilidades esenciales y capacitación de seguridad conforme a ${industry.regulatory.body}.`,
    longDescription: `Nuestra Capacitación y Certificación de Reach en Las Vegas es un curso práctico que lo equipa con habilidades esenciales y conocimiento de seguridad para operar reach trucks de manera eficiente y conforme a los estándares de ${industry.regulatory.body}.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico de reach truck",
      "Técnicas de operación en pasillos estrechos",
      "Entrenamiento de manejo de altura",
      "Procedimientos de inspección pre-operación",
      "Evaluación escrita y práctica",
      "Certificado de finalización"
    ],
    languages: ["Inglés", "Español"],
  },
  "order-picker-lv": {
    title: "Capacitación y Certificación de Order Picker",
    shortDescription: `Capacitación y certificación de operador de order picker en Las Vegas. Programa práctico para operaciones seguras y conformes a ${industry.regulatory.body}.`,
    longDescription: `Impulse su carrera con nuestra Capacitación y Certificación de Order Picker en Las Vegas, un programa práctico que lo equipa con las habilidades esenciales para operaciones seguras y conformes a ${industry.regulatory.body}. Certifíquese rápidamente y abra puertas a oportunidades emocionantes en almacenamiento y logística.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Presentaciones dinámicas y ayudas visuales",
      "Estudios de caso del mundo real",
      "Discusiones grupales",
      "Entrenamiento práctico",
      "Instrucción integral de seguridad",
      "Evaluación escrita y práctica",
      "Certificado de finalización",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "reach-forklift-lv": {
    title: "Capacitación Práctica de Reach y Montacargas (LPG de Asiento + Reach)",
    shortDescription: "Combo de doble capacitación: certificación de montacargas LPG de asiento y reach truck en Las Vegas. Dos certificaciones en una sesión.",
    longDescription: "Impulse su carrera con nuestra Capacitación Práctica de Reach y Montacargas en Las Vegas, un programa integral de doble capacitación diseñado para equiparlo con habilidades prácticas esenciales para operar tanto montacargas LPG de asiento como reach trucks de manera segura y eficiente.",
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Entrenamiento de montacargas LPG de asiento",
      "Entrenamiento de operación de reach truck",
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico",
      "Evaluaciones escritas y discusiones grupales",
      "Evaluaciones escritas y prácticas",
      "Certificados para ambos tipos de equipo"
    ],
    languages: ["Inglés", "Español"],
  },
  "orderpicker-forklift-lv": {
    title: "Capacitación Práctica de Order Picker y Montacargas (LPG de Asiento + Order Picker)",
    shortDescription: "Combo de doble capacitación: certificación de montacargas LPG de asiento y order picker en Las Vegas. Dos certificaciones en una sesión.",
    longDescription: `Nuestro programa especializado de doble capacitación en Las Vegas equipa a los operadores con habilidades y conocimientos esenciales para gestionar operaciones de recolección de pedidos y manejo de montacargas, asegurando el cumplimiento de las regulaciones de ${industry.regulatory.body}.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Entrenamiento de montacargas LPG de asiento",
      "Entrenamiento de operación de order picker",
      "Presentaciones dinámicas y ayudas visuales",
      "Estudios de caso del mundo real",
      "Entrenamiento práctico",
      "Instrucción integral de seguridad",
      "Certificados para ambos tipos de equipo",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "forklift-scissor-epj-lv": {
    title: "Certificación de Montacargas, Elevador de Tijera y EPJ",
    shortDescription: "Triple certificación: montacargas LPG de asiento, elevador de tijera y transpaleta eléctrica (EPJ) en Las Vegas.",
    longDescription: `Certifíquese en tres tipos de equipo en una sesión integral en Las Vegas. Esta capacitación conforme a ${industry.regulatory.body} cubre operación segura, manejo de carga y seguridad en el lugar de trabajo para montacargas LPG de asiento, elevadores de tijera y transpaletas eléctricas (EPJ).`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Certificación de montacargas LPG de asiento",
      "Certificación de elevador de tijera",
      "Certificación de transpaleta eléctrica (EPJ)",
      "Instrucción en aula y presentaciones",
      "Entrenamiento práctico para todo el equipo",
      "Evaluaciones escritas y prácticas",
      "Certificados para los tres tipos de equipo"
    ],
    equipmentCovered: ["Montacargas LPG de Asiento", "Elevador de Tijera", "Transpaleta Eléctrica (EPJ)"],
    languages: ["Inglés", "Español"],
  },
  "all-in-one-lv": {
    title: "Certificación de Montacargas, Elevador de Tijera, Order Picker/Reach y EPJ",
    shortDescription: "Certificación todo en uno: Montacargas + Elevador de Tijera + Order Picker/Reach + EPJ. Máximo valor, calificaciones completas de operador en Las Vegas.",
    longDescription: `Nuestro paquete de capacitación más integral en Las Vegas. Certifíquese para operar montacargas LPG de asiento, elevadores de tijera, order pickers/reach trucks y transpaletas eléctricas (EPJ) de manera segura y eficiente, asegurando el cumplimiento de ${industry.regulatory.body}.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Certificación de montacargas de asiento (LPG)",
      "Certificación de elevador de tijera",
      "Certificación de order picker o reach truck",
      "Certificación de transpaleta eléctrica (EPJ)",
      "Instrucción en aula para todo el equipo",
      "Entrenamiento práctico para todo el equipo",
      "Evaluaciones escritas y prácticas",
      "Certificados para todos los tipos de equipo"
    ],
    equipmentCovered: ["Montacargas LPG de Asiento", "Elevador de Tijera", "Order Picker / Reach Truck", "Transpaleta Eléctrica (EPJ)"],
    languages: ["Inglés", "Español"],
  },
  "std-forklift-fresno": {
    title: "Certificación Estándar de Montacargas (LPG de Asiento o EPJ)",
    shortDescription: "Certificación práctica de montacargas para operadores de contrapeso de asiento (LPG) y transpaleta eléctrica en Fresno.",
    longDescription: `Certifíquese en montacargas estándar de contrapeso de asiento (LPG) o transpaletas eléctricas (EPJ) con nuestro programa de capacitación práctica en Fresno. Este curso cubre las regulaciones de ${industry.regulatory.body}, operación segura y efectiva de montacargas.`,
    duration: "3-4 hrs (principiantes) / 1.5-2 hrs (experimentados)",
    includes: [
      "Instrucción en aula con presentaciones",
      "Entrenamiento práctico de simulación en almacén",
      "Estudios de caso y discusiones grupales",
      "Evaluación escrita y práctica",
      `Licencia de montacargas reconocida por ${industry.regulatory.body}`,
      "Tarjeta de identificación de operador tamaño billetera",
      "Acceso a red de colocación laboral"
    ],
    languages: ["Inglés", "Español"],
  },
  "ttt-forklift-sd": {
    title: "Certificación Capacitar al Capacitador de Montacargas",
    shortDescription: "Conviértase en un instructor certificado de montacargas en San Diego. Califíquese para capacitar y certificar operadores de montacargas en sus propias instalaciones.",
    longDescription: `Nuestro programa de Certificación Capacitar al Capacitador en San Diego lo prepara para convertirse en un instructor calificado de capacitación de montacargas. Este curso integral presencial cubre los requisitos de capacitación de ${industry.regulatory.body}, técnicas de evaluación adecuadas y métodos de instrucción práctica. Al completar, estará autorizado para capacitar y certificar operadores de montacargas en su lugar de trabajo. Incluye un folder con todos los materiales.`,
    duration: "2-4 horas",
    includes: [
      "Capacitación completa dirigida por instructor",
      `Currículo de cumplimiento de ${industry.regulatory.body}`,
      "Certificación de instructor al completar",
      "Folder con todos los materiales de capacitación",
      "Capacitación en metodología de evaluación",
      "Práctica de enseñanza práctica",
      "Instrucción en aula y ejercicios prácticos"
    ],
    languages: ["Inglés", "Español"],
  },
  "ttt-forklift-lv": {
    title: "Certificación Capacitar al Capacitador de Montacargas",
    shortDescription: "Conviértase en un instructor certificado de montacargas en Las Vegas. Califíquese para capacitar y certificar operadores de montacargas en sus propias instalaciones.",
    longDescription: `Nuestro programa de Certificación Capacitar al Capacitador en Las Vegas lo prepara para convertirse en un instructor calificado de capacitación de montacargas. Este curso integral presencial cubre los requisitos de capacitación de ${industry.regulatory.body}, técnicas de evaluación adecuadas y métodos de instrucción práctica. Al completar, estará autorizado para capacitar y certificar operadores de montacargas en su lugar de trabajo. Incluye un folder con todos los materiales.`,
    duration: "2-4 horas",
    includes: [
      "Capacitación completa dirigida por instructor",
      `Currículo de cumplimiento de ${industry.regulatory.body}`,
      "Certificación de instructor al completar",
      "Folder con todos los materiales de capacitación",
      "Capacitación en metodología de evaluación",
      "Práctica de enseñanza práctica",
      "Instrucción en aula y ejercicios prácticos"
    ],
    languages: ["Inglés", "Español"],
  },
  "ttt-scissor-sd": {
    title: "Certificación Capacitar al Capacitador de Elevador de Tijera y Pluma",
    shortDescription: "Conviértase en un instructor certificado de elevador de tijera y pluma en San Diego. Capacite y certifique operadores de elevadores aéreos en sus instalaciones.",
    longDescription: `Este programa prepara a individuos para capacitar y certificar operadores de elevadores aéreos en cumplimiento con las regulaciones de ${industry.regulatory.body}. Enfocado en protocolos de seguridad, técnicas de instrucción y evaluación de riesgos para mejorar la seguridad y eficiencia en el lugar de trabajo. Al completar, estará autorizado para capacitar y certificar operadores de elevadores de tijera y pluma en su lugar de trabajo. Incluye un folder con todos los materiales.`,
    duration: "2-4 horas",
    includes: [
      "Capacitación completa dirigida por instructor",
      `Currículo de cumplimiento de ${industry.regulatory.body} para elevadores aéreos`,
      "Certificación de instructor al completar",
      "Folder con todos los materiales de capacitación",
      "Protocolos de seguridad y evaluación de riesgos",
      "Capacitación en técnicas de instrucción",
      "Instrucción en aula y ejercicios prácticos"
    ],
    languages: ["Inglés", "Español"],
  },
  "ttt-scissor-lv": {
    title: "Certificación Capacitar al Capacitador de Elevador de Tijera y Pluma",
    shortDescription: "Conviértase en un instructor certificado de elevador de tijera y pluma en Las Vegas. Capacite y certifique operadores de elevadores aéreos en sus instalaciones.",
    longDescription: `Este programa prepara a individuos para capacitar y certificar operadores de elevadores aéreos en cumplimiento con las regulaciones de ${industry.regulatory.body}. Enfocado en protocolos de seguridad, técnicas de instrucción y evaluación de riesgos para mejorar la seguridad y eficiencia en el lugar de trabajo. Al completar, estará autorizado para capacitar y certificar operadores de elevadores de tijera y pluma en su lugar de trabajo. Incluye un folder con todos los materiales.`,
    duration: "2-4 horas",
    includes: [
      "Capacitación completa dirigida por instructor",
      `Currículo de cumplimiento de ${industry.regulatory.body} para elevadores aéreos`,
      "Certificación de instructor al completar",
      "Folder con todos los materiales de capacitación",
      "Protocolos de seguridad y evaluación de riesgos",
      "Capacitación en técnicas de instrucción",
      "Instrucción en aula y ejercicios prácticos"
    ],
    languages: ["Inglés", "Español"],
  },
  "ttt-forklift-kit": {
    title: "Kit Capacitar al Capacitador de Montacargas",
    shortDescription: `Kit completo de instructor de montacargas conforme a ${industry.regulatory.body} con presentaciones digitales, video de capacitación, manuales, listas de verificación, exámenes y materiales de certificación.`,
    longDescription: `Nuestro Kit integral Capacitar al Capacitador de Montacargas proporciona todos los materiales conformes a ${industry.regulatory.body} que necesita para una capacitación efectiva de operadores de montacargas. Este paquete todo en uno incluye presentaciones digitales, un video de capacitación, manuales, listas de verificación, exámenes, certificados y tarjetas tipo billetera — perfecto para capacitación en sitio que mantiene sus operaciones seguras y eficientes. Cubre montacargas de contrapeso, reach trucks, transpaletas y otros vehículos industriales motorizados. Disponible en inglés y español.`,
    duration: "Se envía a usted",
    includes: [
      `Documentación de capacitación aprobada por ${industry.regulatory.body}`,
      "Presentación digital de capacitación de montacargas",
      "Video GRATIS de Capacitación de Operador de Montacargas (valor de $100)",
      "Manuales integrales de operador y seguridad",
      "Lista de inspección diaria y formularios de evaluación",
      "Exámenes escritos y prácticos con claves de respuesta",
      "20 Certificados de Logro",
      "20 tarjetas tipo billetera"
    ],
    equipmentCovered: ["Montacargas de Contrapeso", "Reach Trucks", "Transpaletas", "Otros Vehículos Industriales Motorizados"],
    languages: ["Inglés", "Español"],
  },
  "ttt-scissor-kit": {
    title: "Kit Capacitar al Capacitador de Elevador de Tijera",
    shortDescription: `Kit completo de instructor de elevador de tijera conforme a ${industry.regulatory.body} con presentaciones digitales, video de capacitación, manuales, listas de verificación, exámenes y materiales de certificación.`,
    longDescription: `Nuestro Kit integral Capacitar al Capacitador de Elevador de Tijera proporciona todos los materiales conformes a ${industry.regulatory.body} que necesita para una capacitación efectiva de operadores de elevador de tijera. Este paquete todo en uno incluye presentaciones digitales, un video de capacitación, manuales, listas de verificación, exámenes, certificados y tarjetas tipo billetera — perfecto para capacitación en sitio que mantiene sus operaciones seguras y eficientes. Cubre elevadores de tijera y plataformas de trabajo aéreo relacionadas. Disponible en inglés y español.`,
    duration: "Se envía a usted",
    includes: [
      `Documentación de capacitación aprobada por ${industry.regulatory.body}`,
      "Presentación digital de capacitación de elevador de tijera",
      "Video GRATIS de Capacitación de Elevador de Tijera (valor de $100)",
      "Manuales integrales de operador y seguridad",
      "Lista de inspección diaria y formularios de evaluación",
      "Exámenes escritos y prácticos con claves de respuesta",
      "20 Certificados de Logro",
      "20 tarjetas tipo billetera"
    ],
    equipmentCovered: ["Elevadores de Tijera", "Plataformas de Trabajo Aéreo"],
    languages: ["Inglés", "Español"],
  },
  "cert-cards": {
    title: "Tarjetas de Certificación",
    shortDescription: `Tarjetas de certificación de operador de montacargas tamaño billetera conformes a ${industry.regulatory.body} para documentar la capacitación de operadores. Prueba portátil de certificación.`,
    longDescription: `Nuestras Tarjetas de Certificación están diseñadas para documentar la capacitación de operadores de montacargas. Estas tarjetas conformes a ${industry.regulatory.body} proporcionan registro fácil, prueba portátil de certificación y documentación rentable para sus operadores capacitados. Cada set incluye 20 tarjetas brillantes optimizadas para bolígrafos o marcadores. Disponible en inglés y español.`,
    duration: "Se envía a usted",
    includes: [
      "20 tarjetas de certificación brillantes por set",
      `Formato conforme a ${industry.regulatory.body}`,
      "Optimizadas para bolígrafos o marcadores",
      "Tamaño billetera para portabilidad",
      "Campos de nombre del operador y fecha de certificación",
      "Disponible en inglés y español"
    ],
    languages: ["Inglés", "Español"],
  },
  "cert-kit": {
    title: "Kit de Certificación de Capacitación",
    shortDescription: `Kit completo de capacitación en sitio de montacargas aprobado por ${industry.regulatory.body} con presentaciones, video, manuales, exámenes, certificados y tarjetas tipo billetera.`,
    longDescription: `Nuestro Kit integral de Certificación de Capacitación proporciona todo lo que su organización necesita para realizar capacitación de operadores de montacargas conforme a ${industry.regulatory.body} en sus instalaciones. Este paquete todo en uno incluye documentación de capacitación aprobada por ${industry.regulatory.body}, presentaciones digitales e impresas, USB con todos los materiales, video GRATIS de capacitación, manuales de operador y seguridad, listas de inspección, formularios de evaluación, exámenes con claves de respuesta, certificados y tarjetas tipo billetera. Disponible en inglés y español.`,
    duration: "Se envía a usted",
    includes: [
      `Documentación de capacitación aprobada por ${industry.regulatory.body}`,
      "Presentaciones digitales e impresas de capacitación de montacargas",
      "Unidad USB con todos los materiales",
      "Video GRATIS de Capacitación de Operador de Montacargas",
      "Manuales integrales de operador y seguridad",
      "Listas de inspección diaria y formularios de evaluación",
      "Exámenes escritos y prácticos con claves de respuesta",
      "20 Certificados de Logro",
      "20 tarjetas tipo billetera"
    ],
    equipmentCovered: ["Montacargas de Contrapeso", "Reach Trucks", "Transpaletas", "Otros Vehículos Industriales Motorizados"],
    languages: ["Inglés", "Español"],
  },
};
