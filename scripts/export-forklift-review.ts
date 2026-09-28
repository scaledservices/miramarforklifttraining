import { writeFile, mkdir } from 'node:fs/promises';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';
const output = process.argv[2] || '/tmp/miramar-curriculum-review';
await mkdir(output,{recursive:true});
function text(value:any):string {
 if(typeof value==='string') return value.replace(/<[^>]*>/g,'').replace(/&amp;/g,'&');
 if(Array.isArray(value)) return value.map(text).filter(Boolean).join('\n');
 if(!value || typeof value!=='object') return '';
 return Object.entries(value).filter(([k])=>!['type','src','url','filename','id','targetId','x','y','level','variant','mode','correct','correctAnswers','passing_score','max_attempts','randomize_questions'].includes(k)).map(([,v])=>text(v)).filter(Boolean).join('\n');
}
const counts:any={};
for(const [lang,steps] of [['en',COURSE_STEPS],['es',COURSE_STEPS_ES]] as const){
 const body=steps.map(s=>`## ${s.title}\n\n${text(s.config)}\n\n${(s.questions||[]).map((q,i)=>`${i+1}. ${q.question}\n${q.options.map(o=>`- ${o}`).join('\n')}\n\nInstructor key: ${q.correctAnswers}\n${q.explanation}`).join('\n\n')}`).join('\n\n---\n\n');
 const content=`# Forklift formal instruction - ${lang.toUpperCase()}\n\nINTERNAL REVIEW DRAFT. Includes instructor answer keys. Not a certificate or proof of OSHA approval.\n\n${body}\n`;
 await writeFile(`${output}/forklift-${lang}-review.md`,content);
 counts[lang]={steps:steps.length,checkpoints:steps.filter(s=>s.type==='checkpoint').map(s=>s.questions?.length),examQuestions:steps.find(s=>s.type==='exam')?.questions?.length,reviewWords:body.split(/\s+/).length};
}
await writeFile(`${output}/counts.json`,JSON.stringify(counts,null,2));
console.log(JSON.stringify({output,counts},null,2));
