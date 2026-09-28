import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { HotspotDiagramBlock } from '@shared/lesson-blocks';

export default function HotspotDiagram({block}:{block:HotspotDiagramBlock}) {
 const {t}=useTranslation();const id=useId();
 const [active,setActive]=useState<number|null>(null);
 const [visited,setVisited]=useState<Set<number>>(new Set());
 function open(i:number){setActive(i);setVisited(v=>new Set(v).add(i));}
 const spot=active===null?null:block.hotspots[active];
 return <section className="hotspot-study not-prose" data-testid="hotspot-diagram">
  <p className="text-sm text-muted-foreground mb-3">{t('lms.hotspotHint')}</p>
  <div className="relative rounded-xl border overflow-hidden bg-slate-50">
   <img src={block.src} alt={block.alt} className="w-full h-auto block" />
   {block.hotspots.map((s,i)=><button key={i} type="button" className={`hotspot-marker ${active===i?'hotspot-marker-active':''} ${visited.has(i)?'hotspot-marker-visited':''}`} style={{left:`${s.x}%`,top:`${s.y}%`}} onClick={()=>open(i)} aria-expanded={active===i} aria-controls={`${id}-detail`} aria-label={`${i+1}. ${s.label}`} data-testid={`hotspot-pin-${i}`}>{i+1}</button>)}
  </div>
  <div className="hotspot-labels" role="group" aria-label={t('lms.hotspotHint')}>
   {block.hotspots.map((s,i)=><button type="button" key={i} onClick={()=>open(i)} aria-pressed={active===i} aria-controls={`${id}-detail`}><span>{i+1}</span>{s.label}</button>)}
  </div>
  <div id={`${id}-detail`} className="hotspot-explanation" aria-live="polite" data-testid="hotspot-detail">
   {spot?<><strong>{spot.label}</strong><p>{spot.description}</p></>:<p>{t('lms.hotspotHint')}</p>}
  </div>
  {block.caption&&<p className="text-sm text-muted-foreground mt-3">{block.caption}</p>}
  <p className="text-xs text-muted-foreground mt-3" data-testid="hotspot-progress">{t('lms.hotspotProgress',{visited:visited.size,total:block.hotspots.length})}</p>
 </section>;
}
