export function practiceAnswers(q:{type:string;correctAnswers:string}):string[]{
 return q.type==='mcq_multi'?q.correctAnswers.split(',').map(s=>s.trim()).filter(Boolean):[q.correctAnswers];
}
export function practiceCorrect(q:{type:string;correctAnswers:string},selected:string[]):boolean{
 const expected=practiceAnswers(q);
 return expected.length===selected.length&&expected.every(a=>selected.includes(a));
}
