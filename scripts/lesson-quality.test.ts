import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {COURSE_STEPS} from './course-content';
import {COURSE_STEPS_ES} from './course-content-es';
test('bilingual lessons keep technical diagrams; banners are decorative headers only (Peter 2026-09-28)',()=>{
 for(const steps of [COURSE_STEPS,COURSE_STEPS_ES]){
  const blocks=steps.flatMap(s=>s.config.blocks||[]);
  assert.equal(blocks.some((b:any)=>b.type!=='hero_image'&&b.src?.includes('/photos/banners/')),false);
  assert.ok(blocks.some((b:any)=>b.type==='technical_diagram'&&b.kind==='stability'));
  assert.ok(blocks.some((b:any)=>b.type==='technical_diagram'&&b.kind==='ramps'));
  assert.ok(blocks.some((b:any)=>b.type==='technical_diagram'&&b.kind==='load-center'));
 }
});
test('single answer with a comma is graded as one answer',async()=>{
 assert.ok(existsSync('shared/practice-answers.ts'));
 const {practiceCorrect}=await import('../shared/practice-answers');
 assert.equal(practiceCorrect({type:'mcq_single',correctAnswers:'Stop, look and listen'},['Stop, look and listen']),true);
 assert.equal(practiceCorrect({type:'mcq_single',correctAnswers:'Stop, look and listen'},['Stop']),false);
});
test('translated exam labels do not change submitted answer values',()=>{
 const source=readFileSync('client/src/components/lms/ExamStep.tsx','utf8');
 assert.ok(source.includes('value={option}'));
 assert.equal(source.includes('value={q.displayOptions?.[option] ?? option}'),false);
});
test('hotspot descriptions do not overlay and obscure the teaching image',()=>{
 const text=readFileSync('client/src/components/lms/HotspotDiagram.tsx','utf8');
 assert.ok(text.includes('aria-controls'));
 assert.equal(text.includes('absolute ${panelSide}'),false);
});
