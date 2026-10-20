import { brand } from "@shared/config/brand";
import { industry } from "@shared/config/industry";

export interface BlogContentTranslation {
  content: string;
  metaTitle: string;
  metaDescription: string;
}

// Spanish article bodies and meta tags for the blog. Titles, excerpts,
// categories and read times live in ./blog-es.ts.
export const blogEsContent: Record<string, BlogContentTranslation> = {
  "osha-forklift-certification-requirements": {
    metaTitle: `Requisitos de certificación de montacargas de ${industry.regulatory.body} 2025 | Guía completa`,
    metaDescription: `Conozca los requisitos de certificación de montacargas de ${industry.regulatory.body}, incluidos los estándares de capacitación, los plazos de renovación y las obligaciones del empleador. Guía completa para 2025.`,
    content: `Cumplir con los requisitos de certificación de montacargas de ${industry.regulatory.body} no es opcional: es una obligación federal. Según el estándar ${industry.regulatory.standard} de ${industry.regulatory.body}, todo operador de un vehículo industrial motorizado debe recibir la capacitación adecuada antes de operar equipo en el lugar de trabajo.

## ¿Quién necesita la certificación de montacargas?

Todo trabajador que opere un vehículo industrial motorizado, incluidos montacargas de contrapeso con asiento, montacargas de alcance, recogepedidos, transpaletas eléctricas o montacargas todoterreno, debe estar capacitado y certificado. Esto aplica a empleados de tiempo completo, trabajadores de medio tiempo y personal temporal.

## ¿Qué incluye una capacitación que cumple con ${industry.regulatory.body}?

La capacitación de montacargas que cumple con ${industry.regulatory.body} debe cubrir tres áreas clave:

**1. Instrucción formal**: incluye clases, conversaciones, capacitación interactiva por computadora, videos y materiales escritos sobre temas como la inspección del vehículo, el manejo de cargas, los procedimientos de operación y los peligros en el lugar de trabajo.

**2. Capacitación práctica**: los operadores deben recibir instrucción práctica con el equipo real que usarán, bajo la supervisión de un instructor calificado.

**3. Evaluación**: cada operador debe ser evaluado en el lugar de trabajo para demostrar que puede operar el montacargas de forma segura en condiciones reales de trabajo.

## Renovación de la certificación

${industry.regulatory.body} exige que la certificación de operador de montacargas se renueve cada 3 años. Sin embargo, se debe impartir una capacitación de actualización antes de ese plazo si el operador sufre un accidente, si se le observa operando de forma insegura, si se le asigna un tipo distinto de montacargas o si cambian las condiciones del lugar de trabajo.

## Responsabilidades del empleador

Los empleadores son responsables de garantizar que todos los operadores de montacargas estén debidamente capacitados y certificados. Esto incluye mantener los registros de capacitación, impartir capacitación de actualización cuando sea necesario y asegurarse de que solo operadores certificados manejen vehículos industriales motorizados.

## Obtén tu certificación con ${brand.name}

${brand.name} ofrece programas de capacitación en línea y presencial que cumplen con los estándares de ${industry.regulatory.body}. Nuestro programa en línea te permite completar la parte de instrucción formal desde cualquier dispositivo, mientras que nuestras sedes de capacitación práctica en San Diego y Las Vegas te brindan la experiencia práctica y la evaluación que necesitas para obtener la certificación completa.`,
  },
  "how-long-does-forklift-certification-take": {
    metaTitle: "¿Cuánto tiempo toma la certificación de montacargas? | Guía de tiempos",
    metaDescription: "Descubre cuánto tiempo toma la certificación de montacargas. Capacitación en línea: 2 a 4 horas. Práctica: 1 día. Guía completa de los tiempos de certificación.",
    content: `Una de las preguntas más comunes que recibimos es: "¿Cuánto tiempo toma certificarse en montacargas?" La respuesta depende del tipo de capacitación que elijas y de tu ritmo de aprendizaje.

## Tiempo de la capacitación en línea

La capacitación en línea para operadores de montacargas suele tomar de 2 a 4 horas. Cubre la parte de instrucción formal de los requisitos de ${industry.regulatory.body}, que incluye:

- Tipos de equipo y principios de operación
- Manejo de cargas y estabilidad
- Identificación de peligros en el lugar de trabajo
- Procedimientos de inspección previa a la operación
- Seguridad al cargar combustible y baterías

La ventaja de la capacitación en línea es la flexibilidad: puedes empezar y pausar cuando te convenga y estudiar desde cualquier dispositivo con acceso a internet.

## Capacitación práctica presencial

La certificación práctica de montacargas en un centro de capacitación suele tomar un día completo (aproximadamente de 6 a 8 horas). Incluye tanto instrucción en el aula como ejercicios prácticos de manejo en equipo real.

Nuestros centros de capacitación en San Diego y Las Vegas ofrecen programas de certificación de un solo día para varios tipos de equipo, como montacargas con asiento, montacargas de alcance, recogepedidos, plataformas de tijera y transpaletas eléctricas.

## Programas de Capacitación de Instructores

Si quieres convertirte en instructor certificado de montacargas, nuestro programa de Capacitación de Instructores consiste en un día completo (8 horas) de instrucción intensiva. Te habilita para capacitar y certificar operadores en tus propias instalaciones.

## Programas de paquete completo

Nuestro Paquete Completo de Certificación de Equipos, que certifica a los operadores en varios tipos de equipo (montacargas, plataforma de tijera, recogepedidos/montacargas de alcance y transpaleta eléctrica), toma de 2 a 3 días.

## Factores que influyen en el tiempo de certificación

Varios factores pueden influir en cuánto tiempo toma tu certificación:

- **Experiencia previa**: los operadores con experiencia pueden completar la capacitación más rápido
- **Tipo de equipo**: algunos equipos requieren una capacitación más extensa
- **Número de certificaciones**: certificarse en varios equipos naturalmente toma más tiempo
- **Desempeño en la evaluación**: si se necesita práctica adicional antes de la evaluación

## Comienza tu certificación hoy

Ya sea que elijas la capacitación en línea o presencial, ${brand.name} ofrece programas eficientes diseñados para que te certifiques lo más rápido posible sin sacrificar la calidad de tu capacitación.`,
  },
  "forklift-training-for-businesses": {
    metaTitle: `Capacitación de montacargas para empresas: interna vs. externa | ${brand.name}`,
    metaDescription: "Compare la capacitación de montacargas interna y externa para su empresa. Costos, beneficios y consideraciones de cumplimiento explicados.",
    content: `Toda empresa que utiliza vehículos industriales motorizados debe asegurarse de que sus operadores estén debidamente capacitados y certificados. La pregunta es: ¿debe capacitar internamente o enviar a sus operadores con un proveedor de capacitación externo?

## Opción 1: Programas de capacitación externos

Enviar a los operadores a un centro de capacitación profesional es el enfoque más sencillo. Entre sus beneficios están:

- **Instrucción profesional**: instructores con experiencia se encargan de todo
- **Sin inversión en equipo**: el centro de capacitación proporciona el equipo
- **Cumplimiento inmediato**: los operadores salen con la certificación adecuada
- **Variedad de equipos**: acceso a varios tipos de montacargas para la capacitación

Esta opción funciona bien para empresas con pocos operadores o que necesitan certificar a sus empleados rápidamente.

## Opción 2: Programa de capacitación interno

Para empresas con una plantilla más grande, establecer un programa de capacitación interno puede ser más rentable con el tiempo. Esto requiere:

- **Un instructor certificado**: alguien de su empresa debe completar un programa de Capacitación de Instructores
- **Materiales de capacitación**: necesitará un kit de plan de estudios completo
- **Herramientas de evaluación**: formularios de evaluación y listas de verificación para la evaluación práctica
- **Documentación**: sistemas adecuados de registro para el cumplimiento

## Comparación de costos

**La capacitación externa** suele costar entre $150 y $500 por operador, según el tipo de equipo y la ubicación.

**La capacitación interna** tiene costos iniciales más altos (certificación del instructor más el kit de materiales), pero menores costos por operador con el tiempo, sobre todo para empresas que contratan nuevos operadores con frecuencia o que necesitan impartir capacitación de actualización.

## Soluciones empresariales de ${brand.name}

Apoyamos a las empresas con ambos enfoques:

- **Envíenos a sus operadores**: nuestros centros de capacitación en San Diego y Las Vegas ofrecen certificación en un solo día
- **Capacite a su instructor**: nuestro programa de Capacitación de Instructores habilita a sus empleados para certificar a otros
- **Kits de certificación**: nuestros kits completos incluyen todo lo necesario para programas internos
- **Tarjetas de certificación**: tarjetas profesionales de certificación de operador para su equipo

Contáctenos para analizar qué enfoque tiene más sentido para su organización.`,
  },
  "types-of-forklifts-and-certifications": {
    metaTitle: "Tipos de montacargas y certificaciones requeridas | Guía completa",
    metaDescription: `Conoce las 7 clases de montacargas de ${industry.regulatory.body} y qué certificaciones necesitas. Guía completa de los tipos de vehículos industriales motorizados y sus requisitos de capacitación.`,
    content: `${industry.regulatory.body} clasifica los vehículos industriales motorizados en siete categorías, y cada una requiere una capacitación específica. La certificación que necesitas depende del equipo que vas a operar.

## Clase I: Montacargas eléctricos con operador montado

Son montacargas de contrapeso con asiento, impulsados por motores eléctricos. Son comunes en almacenes e instalaciones interiores donde se requiere una operación sin emisiones.

## Clase II: Montacargas eléctricos para pasillos angostos

Esta clase incluye montacargas de alcance, recogepedidos y montacargas para pasillos angostos. Están especializados para operaciones de almacén donde el espacio es limitado y los operadores necesitan acceder al inventario en altura.

## Clase III: Vehículos eléctricos manuales o manuales con plataforma

Las transpaletas eléctricas y los apiladores de conductor a pie pertenecen a esta categoría. Aunque parezcan más sencillos de operar, también requieren la certificación adecuada según los estándares de ${industry.regulatory.body}.

## Clase IV: Montacargas de combustión interna (llantas sólidas)

Son montacargas de contrapeso con llantas sólidas, diseñados para superficies interiores lisas. Funcionan con gas LP, gasolina, diésel o gas natural comprimido.

## Clase V: Montacargas de combustión interna (llantas neumáticas)

Son similares a los de Clase IV, pero con llantas neumáticas para uso al aire libre en superficies irregulares. Son comunes en la construcción, los aserraderos y las zonas de carga al aire libre.

## Clase VI: Tractores eléctricos y de combustión interna

Son tractores de arrastre que se usan para jalar carritos, remolques y otras cargas con ruedas. Son comunes en aeropuertos, plantas de manufactura y grandes complejos de almacenes.

## Clase VII: Montacargas todoterreno

Diseñados para uso al aire libre en terreno irregular, estos montacargas son comunes en la construcción y en el sector agrícola.

## Plataformas de tijera y elevadores aéreos

Aunque técnicamente no son montacargas, las plataformas de tijera y los elevadores aéreos son plataformas de trabajo elevadas que también requieren certificación del operador según los estándares de ${industry.regulatory.body}.

## Cómo obtener la certificación correcta

En ${brand.name} ofrecemos programas de capacitación que cubren los tipos de equipo más comunes:

- **Montacargas de contrapeso con asiento (Clase I/IV/V)**
- **Montacargas de alcance (Clase II)**
- **Recogepedidos (Clase II)**
- **Transpaletas eléctricas (Clase III)**
- **Plataformas de tijera y elevadores aéreos**

Nuestro Paquete Completo de Certificación de Equipos te permite certificarte en varios tipos de equipo en un solo programa, lo que te da la gama más amplia de calificaciones.`,
  },
  "osha-forklift-recertification-guide": {
    metaTitle: `Guía de recertificación de montacargas ${industry.regulatory.body} 2025 | Cuándo y cómo renovar`,
    metaDescription: `Las certificaciones de montacargas vencen cada 3 años. Conoce cuándo se requiere la recertificación de ${industry.regulatory.body}, qué motiva una renovación anticipada y cómo recertificarte en línea o de forma presencial.`,
    content: `Tu certificación de montacargas no es válida para siempre. Según el estándar ${industry.regulatory.standard} de ${industry.regulatory.body}, los operadores deben ser reevaluados al menos cada 3 años. Aquí tienes todo lo que necesitas saber sobre la recertificación.

## La regla de los 3 años

${industry.regulatory.body} exige evaluar a los operadores de montacargas al menos cada 3 años. Esto no es opcional. Si tu certificación tiene más de 3 años, ya no cumples con la norma y necesitas recertificarte lo antes posible.

Los empleadores son responsables de llevar el control de las fechas de certificación y de asegurar su renovación a tiempo. Dejar que una certificación venza expone tanto al operador como al empleador a multas de ${industry.regulatory.body}.

## Cuándo se requiere la recertificación antes

La regla de los 3 años es un mínimo. La recertificación puede requerirse antes en estas situaciones:

**1. Accidente o casi accidente**: si un operador sufre un accidente con el montacargas o un incidente de casi accidente, se requiere capacitación de actualización antes de que pueda volver a usar el equipo.

**2. Se observa una operación insegura**: si un supervisor observa que un operador trabaja de forma insegura, el operador debe recibir capacitación de actualización y ser reevaluado antes de seguir operando.

**3. Nuevo tipo de equipo**: si a un operador se le asigna un tipo de montacargas distinto al de su capacitación original, debe recibir capacitación específica para ese equipo antes de operarlo.

**4. Cambios en el lugar de trabajo**: si las condiciones del lugar de trabajo cambian de manera importante (nuevas distribuciones, distintos tipos de carga, nuevos patrones de tránsito peatonal), puede necesitarse capacitación de actualización para atender los nuevos peligros.

## Recertificación en línea vs. presencial

La recertificación sigue la misma estructura que la certificación inicial: instrucción formal más evaluación práctica.

**La recertificación en línea** cubre la parte de instrucción formal. Es rápida ($45.00, 1 a 2 horas) y puede completarse desde cualquier dispositivo. Es ideal para operadores con experiencia que solo necesitan el repaso teórico.

**La recertificación presencial** incluye tanto la instrucción formal como la evaluación práctica. Toma unas 2 horas en una de nuestras instalaciones (San Diego, Las Vegas o Fresno) y cuesta $200 por persona. Es necesaria si tu empleador no cuenta con una persona calificada para realizar la evaluación práctica internamente.

## Cómo comenzar tu recertificación

1. Revisa la fecha de tu certificación actual. Si han pasado 3 años o más desde tu última evaluación, necesitas renovarla ahora.
2. Elige tu formato: en línea (solo instrucción formal) o presencial (recertificación completa con evaluación práctica).
3. Completa la capacitación y recibe tu certificado actualizado.

${brand.name} ofrece recertificación en línea y presencial. El curso en línea cuesta $45.00 y puede completarse en 1 a 2 horas. La opción presencial está disponible en nuestras instalaciones de San Diego, Las Vegas y Fresno.`,
  },
  "online-vs-in-person-forklift-training": {
    metaTitle: "Capacitación de montacargas en línea vs. presencial: ¿cuál te conviene?",
    metaDescription: "Compara la capacitación de montacargas en línea y presencial. Costo, tiempo, conveniencia y cumplimiento explicados. Descubre qué formato es el adecuado para tu situación.",
    content: `Elegir entre la capacitación de montacargas en línea o presencial depende de tu nivel de experiencia, los requisitos de tu empleador, tu presupuesto y tu horario. Ningún formato es mejor en todos los casos: cada uno tiene su lugar.

## Comparación rápida

**Capacitación en línea**
- Costo: $45.00
- Tiempo: 1 a 2 horas, a tu propio ritmo
- Lugar: cualquier sitio con internet
- Cubre: instrucción formal (la parte teórica que exige OSHA)
- No incluye: evaluación práctica

**Capacitación presencial**
- Costo: desde $200 por persona
- Tiempo: día completo (6 a 8 horas)
- Lugar: nuestras instalaciones (San Diego, Las Vegas, Fresno) o tu lugar de trabajo
- Cubre: instrucción formal más evaluación práctica
- Incluye: cumplimiento total de ${industry.regulatory.body}

## Cuándo conviene la capacitación en línea

La capacitación en línea es una excelente opción cuando:

- **Eres un operador con experiencia** que necesita repasar la instrucción formal
- **Tu empleador puede realizar la evaluación práctica** internamente con una persona calificada
- **Necesitas certificarte rápido** y no puedes esperar a una clase programada
- **El presupuesto es importante**: a $45.00, la opción en línea cuesta una fracción de la presencial
- **No vives cerca** de San Diego, Las Vegas o Fresno

## Cuándo conviene la capacitación presencial

La capacitación presencial es la opción correcta cuando:

- **Eres un operador nuevo** con poca o ninguna experiencia con montacargas
- **Tu empleador exige la certificación completa**, incluida la evaluación práctica por un instructor profesional
- **Quieres resolver todo en un día** sin un paso de evaluación aparte
- **Aprendes mejor con la práctica** y con un instructor presente

## El enfoque híbrido

Muchos empleadores usan un modelo híbrido: los operadores completan la instrucción formal en línea ($45.00) y luego el empleador realiza la evaluación práctica internamente con un supervisor calificado. Esto brinda cumplimiento total de ${industry.regulatory.body} a menor costo y es perfectamente aceptable según el estándar.

## Análisis de costos

Para un solo operador:
- Solo en línea: $45.00
- Presencial: $200
- En línea + evaluación del empleador: $45.00

Para un equipo de 10 operadores:
- Todos en línea: $599.90 (más el tiempo de evaluación del empleador)
- Todos presencial en nuestras instalaciones: desde $2,000
- Capacitación en sus instalaciones: contáctenos para precios por volumen

## Nota sobre el cumplimiento

Ambos formatos cumplen con los requisitos de ${industry.regulatory.body} cuando se completan correctamente. Lo clave es que ${industry.regulatory.body} exige tanto la instrucción formal COMO la evaluación práctica. La capacitación en línea cubre la instrucción formal. La evaluación práctica la puede realizar tu empleador o se puede hacer en nuestras instalaciones.

## ¿Cuál deberías elegir?

Si tienes experiencia, tu empleador puede evaluarte y quieres la opción más rápida y económica: elige en línea.

Si eres nuevo en el uso de montacargas o quieres la certificación profesional completa, incluida la evaluación práctica: elige presencial.

¿No estás seguro? Llámanos al ${brand.support.phone} y te ayudamos a decidir.`,
  },
  "forklift-certification-cost-2026": {
    metaTitle: "Costo de la certificación de montacargas en 2026: guía completa de precios",
    metaDescription: "¿Cuánto cuesta la certificación de montacargas en 2026? Guía completa de precios de los programas en línea, presenciales, en sus instalaciones y de Capacitación de Instructores. Conozca los cargos ocultos que debe evitar.",
    content: `El costo de la certificación de montacargas varía mucho según el formato, el proveedor y el tipo de equipo. Aquí tienes un desglose transparente de lo que puedes esperar pagar en 2026.

## Certificación de montacargas en línea

La certificación en línea cubre la parte de instrucción formal de los requisitos de ${industry.regulatory.body}.

- **Costo típico**: $45.00 (en ${brand.name})
- **Qué incluye**: curso completo en línea, certificado imprimible, tarjeta de bolsillo, verificación para el empleador, reintentos ilimitados
- **Tiempo para completarla**: 1 a 2 horas
- **Ideal para**: operadores con experiencia o cuyo empleador puede realizar la evaluación práctica

Ten cuidado con los proveedores que cobran aparte el certificado, la tarjeta de bolsillo o los reintentos. En ${brand.name}, todo está incluido en el precio de $45.00, sin cargos ocultos.

## Certificación de montacargas presencial

La capacitación presencial incluye tanto la instrucción formal como la evaluación práctica en un centro de capacitación.

- **Costo típico**: de $200 a $500 por persona (según el tipo de equipo y la ubicación)
- **Qué incluye**: instrucción en el aula, capacitación práctica en equipo real, evaluación práctica, tarjeta de certificación
- **Tiempo para completarla**: 1 día (6 a 8 horas para un solo equipo, 2 a 3 días para varios equipos)
- **Ideal para**: operadores nuevos o quienes quieren la certificación completa con evaluación práctica

## Capacitación en sus instalaciones

La capacitación en sus instalaciones lleva al instructor a su lugar de trabajo.

- **Costo típico**: precio según cotización personalizada, de acuerdo con el tamaño de su equipo y la ubicación
- **Qué incluye**: instrucción en el aula y evaluación práctica en su propio equipo
- **Tiempo para completarla**: 4 a 8 horas según el tamaño del grupo y la experiencia
- **Ideal para**: empresas con 2 o más operadores, sobre todo si quieren capacitación en su equipo específico

## Capacitación de Instructores

Si tiene 10 o más operadores y quiere certificarlos internamente, un programa de Capacitación de Instructores es la opción más rentable a largo plazo.

- **Costo típico**: $750
- **Qué incluye**: programa de un día completo que habilita a su empleado para capacitar y evaluar operadores
- **Tiempo para completarla**: 8 horas
- **Ideal para**: empresas con necesidades de contratación continuas y 10 o más operadores

## Cargos ocultos a tener en cuenta

Al comparar proveedores, pregunta por estos cargos ocultos comunes:

- **Cargo por certificado**: algunos proveedores cobran de $10 a $25 adicionales por el certificado
- **Cargo por tarjeta de bolsillo**: algunos cobran de $5 a $15 por la tarjeta de bolsillo
- **Cargo por reintento**: algunos cobran cada reintento de la evaluación
- **Procesamiento urgente**: algunos cobran por entregar el certificado más rápido
- **Cargo por verificación**: algunos cobran a los empleadores por verificar las certificaciones

En ${brand.name}, el precio que ves es el precio que pagas. Nuestra certificación en línea cuesta $45.00 con todo incluido: sin cargos ocultos ni ventas adicionales.

## Costo según cada caso

**Un operador con experiencia**: $45.00 (en línea) + evaluación del empleador
**Un operador nuevo**: $200 (presencial en nuestras instalaciones)
**Equipo de 5 en la misma ubicación**: capacitación en sus instalaciones con precio según cotización personalizada, con descuentos por volumen para grupos de 5 o más
**Equipo de 10 o más con contratación continua**: $750 (Capacitación de Instructores) + costos continuos de capacitación interna

## Cómo obtener el mejor valor

La opción más barata no siempre es la de mejor valor. Considera:

1. **Qué incluye**: ¿el precio cubre el certificado, la tarjeta y los reintentos?
2. **Cumplimiento**: ¿la capacitación cumple con el estándar ${industry.regulatory.standard} de ${industry.regulatory.body}?
3. **Aceptación del empleador**: ¿tu empleador aceptará la certificación?
4. **Soporte**: ¿puedes obtener ayuda si tienes preguntas durante el curso?

Nuestra certificación en línea de $45.00 incluye todo, sin cargos ocultos. Para la certificación presencial completa, nuestra capacitación comienza en $200. Llama al ${brand.support.phone} para hablar de tus necesidades específicas.`,
  },
};
