import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';

const suites = [
 { lang:'en',steps:COURSE_STEPS,markers:['Truck controls and startup','Stacking and unstacking','Hazardous atmospheres and ventilation','Employer certification record','Tires, fuel and attachments','Mounting and tip-over response'],banned:[/\$7,000/,/\$2 million/,/25\+ feet away AND/,/OSHA-approved/,/Maximum safe speed is typically 5 mph/] },
 { lang:'es',steps:COURSE_STEPS_ES,markers:['Controles y arranque','Apilar y desapilar','Atmósferas peligrosas y ventilación','Registro de certificación del empleador','Llantas, combustible y accesorios','Subir al equipo y responder a un vuelco'],banned:[/\$7,000/,/\$2 millones/,/25 pies.* Y /,/aprobada por OSHA|aprobadas por OSHA/i] },
];
for(const {lang,steps,markers,banned} of suites){
 test(`${lang}: explicit instruction fills OSHA coverage gaps`,()=>{
  const text=JSON.stringify(steps);
  for(const marker of markers) assert.ok(text.includes(marker),marker);
  for(const bad of banned) assert.doesNotMatch(text,bad);
 });
 test(`${lang}: every graded answer exists in options and checkpoints stay short`,()=>{
  const check=(q:any)=>{for(const a of Array.isArray(q.correctAnswers)?q.correctAnswers:[q.correctAnswers]) assert.ok(q.options.includes(a),q.question);};
  for(const step of steps){
   step.questions?.forEach(check);
   for(const b of step.config.blocks||[]) if(b.type==='embedded_quiz') b.questions.forEach(check);
   if(step.type==='checkpoint') assert.equal(step.questions?.length,3);
  }
 });
}
test('EN/ES maintain matching lesson types, question counts and question option counts',()=>{
 assert.equal(COURSE_STEPS.length,COURSE_STEPS_ES.length);
 COURSE_STEPS.forEach((s,i)=>{
  const es=COURSE_STEPS_ES[i];assert.equal(s.type,es.type);
  assert.equal(s.questions?.length,es.questions?.length);
  s.questions?.forEach((q,j)=>{
   const translated=es.questions![j];
   assert.equal(q.options.length,translated.options.length,`${i}/${j}`);
   assert.equal(q.options.indexOf(q.correctAnswers),translated.options.indexOf(translated.correctAnswers),`Answer meaning mismatch ${i}/${j}`);
  });
 });
});
