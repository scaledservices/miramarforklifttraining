import { COURSE_STEPS as forklift, type StepDef } from '../scripts/course-content';
import { COURSE_STEPS_ES as forkliftEs } from '../scripts/course-content-es';
import { COURSE_STEPS as aerial } from '../scripts/course-content-aerial';
import { COURSE_STEPS_ES as aerialEs } from '../scripts/course-content-aerial-es';
import { COURSE_STEPS as trainer } from '../scripts/course-content-forklift-ttt';
import { COURSE_STEPS_ES as trainerEs } from '../scripts/course-content-forklift-ttt-es';
import { COURSE_STEPS as aerialTrainer } from '../scripts/course-content-aerial-ttt';
import { COURSE_STEPS_ES as aerialTrainerEs } from '../scripts/course-content-aerial-ttt-es';
import { EN_TO_ES_SLUG_MAP } from '../shared/course-slug-map';

// Presentation only. Enrollment, progress IDs, submitted option values, grading,
// certification and completion rules are deliberately unchanged.
function pair(slug: string): [StepDef[], StepDef[], boolean] | null {
  const enSlug = Object.keys(EN_TO_ES_SLUG_MAP).find(k => EN_TO_ES_SLUG_MAP[k] === slug) || slug;
  const spanish = enSlug !== slug;
  if (enSlug.includes('aerial') && enSlug.includes('trainer')) return [aerialTrainer, aerialTrainerEs, spanish];
  if (enSlug.includes('forklift') && enSlug.includes('trainer')) return [trainer, trainerEs, spanish];
  if (enSlug.includes('aerial')) return [aerial, aerialEs, spanish];
  if (enSlug.includes('forklift')) return [forklift, forkliftEs, spanish];
  return null;
}
function match(slug: string, step: {title:string;type:string}, locale: string) {
  const p = pair(slug);
  if (!p) return null;
  const source = p[p[2] ? 1 : 0];
  const target = p[locale.startsWith('es') ? 1 : 0];
  const index = source.findIndex(s => s.title === step.title && s.type === step.type);
  if (index < 0 || target[index]?.type !== step.type) return null;
  return { source: source[index], target: target[index] };
}
export function presentStep<T extends {title:string;type:string;config:any}>(slug:string, step:T, locale:string): T {
  const m = match(slug,step,locale);
  if (!m) return step;
  // Never replace exam/checkpoint config with seed data or expose answer keys.
  // 'video' swaps too so the in-course EN/ES toggle switches to the matching
  // language video (video config carries no answer keys).
  const config = ['lesson','content','download','video'].includes(step.type) ? m.target.config : step.config;
  return {...step,title:m.target.title,config};
}
/** Graded-review explanation in the viewer's language (display only). */
export function presentExplanation(slug:string, step:{title:string;type:string}, q:{question:string;explanation:string|null}, locale:string): string|null {
  const m = match(slug,step,locale);
  const index = m?.source.questions?.findIndex(x => x.question === q.question) ?? -1;
  return (index >= 0 ? m?.target.questions?.[index]?.explanation : undefined) ?? q.explanation;
}
export function presentQuestion<T extends {question:string;options:any}>(slug:string, step:{title:string;type:string}, question:T, locale:string) {
  const m = match(slug,step,locale);
  const index = m?.source.questions?.findIndex(q => q.question === question.question) ?? -1;
  const source = m?.source.questions?.[index];
  const target = m?.target.questions?.[index];
  if (!source || !target || source.options.length !== target.options.length) return question;
  const displayOptions: Record<string,string> = {};
  for (const value of question.options as string[]) {
    const i = source.options.indexOf(value);
    if (i < 0) return question; // Unknown/custom data must not be mapped by guesswork.
    displayOptions[value] = target.options[i];
  }
  return {...question,displayQuestion:target.question,displayOptions};
}
