import { test } from 'node:test';
import assert from 'node:assert/strict';
import { COURSE_STEPS } from './course-content';
import { COURSE_STEPS_ES } from './course-content-es';

test('forklift EN and ES checkpoints contain exactly three questions', () => {
 for (const steps of [COURSE_STEPS, COURSE_STEPS_ES]) {
  for (const step of steps.filter(s => s.type === 'checkpoint')) assert.equal(step.questions?.length, 3, step.title);
 }
});
test('grade travel answer follows the conditional OSHA rule in both languages', () => {
 const en = COURSE_STEPS.find(s => s.type === 'exam')!.questions!;
 const es = COURSE_STEPS_ES.find(s => s.type === 'exam')!.questions!;
 assert.equal(en.find(q => q.question.includes('On a grade'))?.correctAnswers, 'Tilted back, raised only enough to clear the surface');
 assert.equal(es.find(q => q.question.includes('En una pendiente'))?.correctAnswers, 'Inclinadas hacia atrás, elevadas solo para librar la superficie');
});
test('final exams keep both challenge questions and EN/ES parity', () => {
 assert.equal(COURSE_STEPS.find(s => s.type === 'exam')!.questions!.length, 29);
 assert.equal(COURSE_STEPS_ES.find(s => s.type === 'exam')!.questions!.length, 29);
});
