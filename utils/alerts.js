export function zScore(values){
  if (!values.length) return [];
  const mean = values.reduce((a,b)=>a+b,0)/values.length;
  const variance = values.reduce((a,b)=>a+(b-mean)*(b-mean),0)/values.length || 0.0001;
  const sd = Math.sqrt(variance);
  return values.map(v => (v-mean)/sd);
}

export function checkVitalsAlerts(series){
  if (!series || series.length < 3) return [];
  const temps = series.map(p=>p.temp);
  const hrs = series.map(p=>p.hr);
  const weights = series.map(p=>p.weight);
  const tZ = zScore(temps);
  const hZ = zScore(hrs);
  const alerts = [];
  const lastIdx = series.length - 1;
  const feverScore = Math.max(tZ[lastIdx], 0) + Math.max(hZ[lastIdx], 0);
  if (feverScore > 2.5) alerts.push({ type: "fever", severity: feverScore > 4 ? "high" : "medium", score: Number(feverScore.toFixed(2)) });
  // weight trend: slope via simple linear regression (x=0..n-1)
  const n = weights.length; const xMean = (n-1)/2; const yMean = weights.reduce((a,b)=>a+b,0)/n;
  let num=0, den=0; for(let i=0;i<n;i++){ num += (i-xMean)*(weights[i]-yMean); den += (i-xMean)*(i-xMean);} const slope = num/(den||1);
  if (slope < 0.05) alerts.push({ type: "slow_growth", severity: slope < 0 ? "high" : "medium", score: Number(slope.toFixed(3)) });
  return alerts;
}
