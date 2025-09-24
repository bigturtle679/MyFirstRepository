import { db, upsert } from "./db.js";
import { checkVitalsAlerts } from "../utils/alerts.js";

async function getSeries(animalId){
  const id = `vitals_${animalId}`;
  try { const d = await db.get(id); return d.series; } catch { return []; }
}

export async function simulateFever(animalId){
  const series = await getSeries(animalId);
  if (!series.length) throw new Error("No vitals series to modify");
  const last = series[series.length-1];
  const spiked = { ...last, ts: Date.now(), temp: last.temp + 1.4, hr: last.hr + 25 };
  const newSeries = [...series, spiked];
  const alerts = checkVitalsAlerts(newSeries);
  await upsert({ _id: `vitals_${animalId}`, type: "vitals", animalId, series: newSeries, synced: false, updatedAt: Date.now(), lastAlerts: alerts });
  return alerts;
}

export async function simulateSlowGrowth(animalId){
  const series = await getSeries(animalId);
  if (!series.length) throw new Error("No vitals series to modify");
  const last = series[series.length-1];
  const newPoint = { ...last, ts: Date.now(), weight: Math.max(last.weight - 0.1, 0) };
  const newSeries = [...series, newPoint];
  const alerts = checkVitalsAlerts(newSeries);
  await upsert({ _id: `vitals_${animalId}`, type: "vitals", animalId, series: newSeries, synced: false, updatedAt: Date.now(), lastAlerts: alerts });
  return alerts;
}

if (import.meta.url === `file://${process.argv[1]}`){
  const id = process.argv[2] || "animal_001";
  simulateFever(id).then(a=>{ console.log("Fever alerts", a); process.exit(0);} ).catch(e=>{console.error(e); process.exit(1);});
}
