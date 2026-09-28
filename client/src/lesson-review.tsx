// Local-only review entry: Vite's production entry does not include this page.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import i18n from './i18n';
import './index.css';
import InteractiveLesson from './components/lms/InteractiveLesson';
import ExamStep from './components/lms/ExamStep';
import CheckpointStep from './components/lms/CheckpointStep';
import { COURSE_STEPS } from '../../scripts/course-content';
import { COURSE_STEPS_ES } from '../../scripts/course-content-es';
const params = new URLSearchParams(location.search);
const lang=params.get('lang')==='es'?'es':'en';
const steps=lang==='es'?COURSE_STEPS_ES:COURSE_STEPS;
const index=Math.max(0,Math.min(steps.length-1,Number(params.get('step')||0)));
const step=steps[index];
const ready = i18n.changeLanguage(lang);
document.documentElement.lang=lang;
(window as any).__review={index,lang,total:steps.length,title:step.title,questions:step.questions,blocks:step.config.blocks};
// Preview submissions are graded locally; no enrollment, network write or issuance.
const originalFetch=window.fetch.bind(window);
window.fetch=async(input,init)=>{
 if(String(input).includes('/api/course-player/-1/exam-submit')){
  const answers=JSON.parse(String(init?.body||'{}')).answers||{};
  const graded=(step.questions||[]).map((q,i)=>({questionId:i+1,userAnswer:answers[i+1],correct:answers[i+1]===q.correctAnswers,correctAnswer:q.correctAnswers,explanation:q.explanation}));
  const score=Math.round(graded.filter(g=>g.correct).length/Math.max(1,graded.length)*100);
  return new Response(JSON.stringify({score,passed:score>=80,graded,attemptsRemaining:2}),{headers:{'Content-Type':'application/json'}});
 }
 return originalFetch(input,init);
};
const questionRows=(step.questions||[]).map((q,i)=>({id:i+1,question:q.question,type:q.type,options:q.options,order:i+1}));
void ready.then(()=>{createRoot(document.getElementById('root')!).render(<QueryClientProvider client={new QueryClient()}><header style={{background:'#1c262b',color:'white',padding:'18px 28px'}}><strong>MIRAMAR / {lang==='es'?'Capacitación de operadores':'Operator training'}</strong><span style={{float:'right'}}>LOCAL REVIEW · {index+1}/{steps.length} · <a href={`?step=${index}&lang=${lang==='es'?'en':'es'}`}>{lang==='es'?'English':'Español'}</a></span></header><main style={{maxWidth:940,margin:'auto',padding:'32px 24px'}}><p style={{color:'#59666c',marginBottom:20}}>{step.module} / {step.estimatedMinutes} min</p>{step.config.blocks?<InteractiveLesson key={`${index}-${lang}`} blocks={step.config.blocks}/>:step.type==='exam'?<ExamStep step={{...step,id:index+1,progress:{status:'not_started'}}} questions={questionRows} enrollmentId={-1} onComplete={()=>{}}/>:step.type==='checkpoint'?<CheckpointStep step={{...step,id:index+1,progress:{status:'not_started'}}} questions={questionRows} enrollmentId={-1} onComplete={()=>{}}/>:<><h1>{step.title}</h1><p>{step.config.description}</p>{step.config.downloads?.map((d:any)=><p key={d.url}>{d.label}</p>)}</>}<nav style={{display:'flex',justifyContent:'space-between',padding:'28px 0',borderTop:'1px solid #ddd',marginTop:28}}><a href={`?step=${Math.max(0,index-1)}&lang=${lang}`}>{lang==='es'?'Anterior':'Previous'}</a><a href={`?step=${Math.min(steps.length-1,index+1)}&lang=${lang}`}>{lang==='es'?'Siguiente':'Next'}</a></nav></main></QueryClientProvider>);});
