import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
test('locale presentation translates without changing enrollment/answer identifiers', async () => {
 assert.ok(existsSync('server/course-presentation.ts'));
 const { presentStep, presentQuestion } = await import('../server/course-presentation');
 const step = {id:99, title:'Welcome to Forklift Operator Certification', type:'lesson', stepOrder:1, config:{}};
 const es = presentStep('online-forklift-operator-certification', step, 'es');
 assert.equal(es.id, 99);
 assert.match(es.title, /Bienvenido/);
 assert.ok(es.config.blocks.length > 0);
 const { COURSE_STEPS } = await import('./course-content');
 const q = COURSE_STEPS.find(s=>s.type==='exam')!.questions![0];
 const shown = presentQuestion('online-forklift-operator-certification', {title:'Final Exam: Forklift Operator Certification',type:'exam'}, {id:123, question:q.question, options:q.options}, 'es');
 assert.equal(shown.id,123);
 assert.deepEqual(shown.options,q.options);
 assert.notEqual(shown.displayQuestion,q.question);
 assert.equal('correctAnswers' in shown,false);
});
test('option ordering fixes True/False and keeps all-of-above last', async () => {
 assert.ok(existsSync('shared/exam-options.ts'));
 const { orderExamOptions } = await import('../shared/exam-options');
 assert.deepEqual(orderExamOptions(['False','True']), ['True','False']);
 assert.deepEqual(orderExamOptions(['Falso','Verdadero']), ['Verdadero','Falso']);
 assert.deepEqual(orderExamOptions(['All of the above','Formal instruction','Practical training']), ['Formal instruction','Practical training','All of the above']);
});
