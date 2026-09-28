import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function TechnicalDiagram({kind}:{kind:'stability'|'ramps'|'load-center'}) {
 const {i18n}=useTranslation();const es=i18n.language.startsWith('es');const id=useId();
 const [mode,setMode]=useState(0);
 const copy={
 stability:{title:es?'Estabilidad: observe qué cambia':'Stability: see what changes',choices:es?['Sin carga','Carga baja','Giro brusco: peligro']:['Unloaded','Low load','Sharp turn: danger'],note:es?'Esquema conceptual de un montacargas contrapesado. No calcula la estabilidad real. El movimiento, la altura y el terreno también importan.':'Conceptual counterbalanced-truck diagram, not a real stability calculation. Motion, height and terrain also matter.'},
 ramps:{title:es?'Rampas: carga y sentido de marcha':'Ramps: load and travel direction',choices:es?['Con carga','Sin carga']:['Loaded','Unloaded'],note:es?'Equipo contrapesado convencional, sin accesorios. Respete el manual y el límite de pendiente. Circule recto y despacio; nunca gire en la rampa.':'Conventional counterbalanced truck without attachments. Follow the manual and grade limit. Travel straight and slowly; never turn on a ramp.'},
 'load-center':{title:es?'Centro de carga: más distancia, más palanca':'Load center: more distance, more leverage',choices:es?['Centro corto','Centro largo']:['Short center','Long center'],note:es?'Esquema, no tabla de capacidad. Verifique peso, centro de carga, altura y accesorio en la placa real. No use una fórmula aproximada para autorizar una carga.':'Schematic, not a capacity chart. Verify weight, load center, height and attachment on the actual plate. Do not use an estimate to authorize a lift.'}
 }[kind];
 const detail=kind==='stability'?(mode===0?(es?'Sin carga, el centro de gravedad está más cerca del eje trasero. Un equipo vacío también puede volcar.':'Unloaded, the center of gravity is closer to the rear axle. An empty truck can still tip.'):mode===1?(es?'Una carga baja desplaza el centro combinado hacia el eje delantero. No exceda la capacidad.':'A low load moves the combined center toward the front axle. Never exceed rated capacity.'):(es?'Un giro brusco puede desplazar la línea de acción fuera del triángulo. Reduzca la velocidad antes de girar.':'A sharp turn can move the line of action outside the triangle. Slow down before turning.')):kind==='ramps'?(mode===0?(es?'Con carga: carga cuesta arriba. Suba hacia adelante; baje en reversa.':'Loaded: load uphill. Drive forward uphill; reverse downhill.'):(es?'Sin carga: horquillas cuesta abajo. Suba en reversa; baje hacia adelante.':'Unloaded: forks downhill. Reverse uphill; drive forward downhill.')):(mode===0?(es?'La distancia se mide desde la cara vertical de la horquilla hasta el centro de gravedad de la carga.':'Measure from the vertical fork face to the load’s center of gravity.'):(es?'La misma carga más alejada produce mayor momento hacia adelante. Deténgase y compruebe la capacidad para esa configuración.':'The same load farther out creates more forward turning force. Stop and verify capacity for that configuration.'));
 return <section className="technical-diagram not-prose" aria-labelledby={`${id}-title`} data-testid={`technical-${kind}`}>
  <div className="technical-heading"><span>{es?'LABORATORIO VISUAL':'VISUAL LAB'}</span><h3 id={`${id}-title`}>{copy.title}</h3></div>
  <div className="diagram-controls" role="group" aria-label={copy.title}>{copy.choices.map((c,i)=><button type="button" key={c} aria-pressed={mode===i} onClick={()=>setMode(i)}>{c}</button>)}</div>
  <svg viewBox="0 0 720 330" role="img" aria-labelledby={`${id}-svg-title ${id}-svg-desc`}>
   <title id={`${id}-svg-title`}>{copy.title}</title><desc id={`${id}-svg-desc`}>{detail}</desc>
   <defs><pattern id={`${id}-grid`} width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="#dce5e8" strokeWidth=".6"/></pattern></defs>
   <rect width="720" height="330" fill="#f3f7f8"/><rect width="720" height="330" fill={`url(#${id}-grid)`}/>
   {kind==='stability'?<>
    <rect x="245" y="42" width="230" height="245" rx="28" fill="#e3ebed" stroke="#78909a" strokeWidth="2"/>
    <path d="M260 90L460 90L360 270Z" fill="#019e7c" fillOpacity=".13" stroke="#00785e" strokeWidth="3"/>
    <path d="M260 90H460" stroke="#293b45" strokeWidth="9"/>
    {[260,460].map(x=><rect key={x} x={x-15} y="67" width="30" height="48" rx="7" fill="#293b45"/>)}
    <circle cx="360" cy="270" r="9" fill="#293b45"/>
    <text x="360" y="28" textAnchor="middle">{es?'Eje delantero':'Front axle'}</text>
    <text x="360" y="313" textAnchor="middle">{es?'Pivote del eje trasero':'Rear axle pivot'}</text>
    <circle cx={mode===2?496:360} cy={mode===0?222:156} r="13" fill={mode===2?'#be382f':'#00785e'} stroke="white" strokeWidth="4"/>
    <path d={`M360 222L${mode===2?496:360} 156`} fill="none" stroke="#8a6100" strokeWidth="3" strokeDasharray="6 5"/>
    <text x="555" y="148" textAnchor="middle" fill={mode===2?'#be382f':'#243944'}>{es?'Centro / línea':'Center / line'}</text><text x="555" y="171" textAnchor="middle">{es?'de acción':'of action'}</text>
   </>:kind==='ramps'?<>
    <path d="M65 290L655 125L655 290Z" fill="#d9e3e6" stroke="#84969e" strokeWidth="2"/>
    <g transform={`translate(360 195) rotate(-15.6) ${mode===1?'scale(-1 1)':''}`}>
     <rect x="-95" y="-70" width="125" height="48" rx="8" fill="#e5ab21" stroke="#263d47" strokeWidth="3"/>
     <path d="M-68 -70V-135H6V-70M30 -130V-28H120" fill="none" stroke="#263d47" strokeWidth="8"/>
     <circle cx="-64" cy="-11" r="22" fill="#263d47"/><circle cx="15" cy="-11" r="25" fill="#263d47"/>
     {mode===0&&<rect x="45" y="-90" width="73" height="58" fill="#b87d4c" stroke="#633e24" strokeWidth="2"/>}
    </g>
    <text x="550" y="72" textAnchor="middle">{es?'CUESTA ARRIBA':'UPHILL'} ↗</text>
    <text x="159" y="162" textAnchor="middle">↙ {es?'CUESTA ABAJO':'DOWNHILL'}</text>
   </>:<>
    <path d="M165 65V244H600" fill="none" stroke="#263d47" strokeWidth="12"/>
    <rect x="180" y="105" width={mode===0?175:365} height="125" rx="4" fill="#e0b581" stroke="#88603b" strokeWidth="2"/>
    <path d={`M${mode===0?268:363} 90V275`} stroke="#00785e" strokeWidth="3" strokeDasharray="6 5"/>
    <circle cx={mode===0?268:363} cy="167" r="11" fill="#00785e"/>
    <path d={`M165 285H${mode===0?268:363}`} stroke="#8a6100" strokeWidth="4"/>
    <text x="100" y="40" textAnchor="middle">{es?'Cara de horquilla':'Fork face'}</text>
    <text x="400" y="312" textAnchor="middle">{es?'Distancia al centro de gravedad':'Distance to center of gravity'}</text>
   </>}
  </svg>
  <p className="diagram-result" aria-live="polite">{detail}</p><p className="diagram-note">{copy.note}</p>
 </section>;
}
