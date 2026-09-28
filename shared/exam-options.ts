// Display-only ordering: submitted values remain the original answer text.
export function orderExamOptions(options: string[], random = Math.random): string[] {
  const tf = /^(true|false|verdadero|falso)$/i;
  if (options.length === 2 && options.every(o => tf.test(o.trim()))) {
    return [...options].sort((a,b) => Number(/^(true|verdadero)$/i.test(b.trim())) - Number(/^(true|verdadero)$/i.test(a.trim())));
  }
  const last = /^(all of the above|none of the above|todas las anteriores|todos los anteriores|ninguna de las anteriores)/i;
  if (options.some(o => last.test(o.trim()))) {
    return [...options.filter(o => !last.test(o.trim())), ...options.filter(o => last.test(o.trim()))];
  }
  const result = [...options];
  for (let i=result.length-1; i>0; i--) {
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
