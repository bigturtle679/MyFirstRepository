import { db, upsert } from "./db.js";

function randNormal(mean, sd) {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return mean + sd * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

export function generateVitalsSeries({startTs=Date.now()-7*24*3600*1000, days=7, species="cow"}={}){
  const points = [];
  let baseTemp = species === "cow" ? 38.6 : species === "goat" ? 39.2 : 39.0;
  let baseHr = species === "cow" ? 60 : species === "goat" ? 90 : 75;
  let weight = species === "cow" ? 500 : species === "goat" ? 45 : 70;
  for (let d=0; d<days; d++){
    const ts = startTs + d*24*3600*1000;
    const temp = clamp(randNormal(baseTemp, 0.3), baseTemp-0.6, baseTemp+0.8);
    const hr = clamp(Math.round(randNormal(baseHr, 6)), baseHr-15, baseHr+20);
    weight += randNormal(species === "cow" ? 0.8 : 0.1, species === "cow" ? 0.3 : 0.08);
    points.push({ ts, temp: Number(temp.toFixed(2)), hr, weight: Number(weight.toFixed(1)) });
  }
  return points;
}

export async function generateForAllAnimals() {
  const result = await db.allDocs({ include_docs: true, startkey: "animal_", endkey: "animal_\ufff0" });
  for (const row of result.rows){
    const animal = row.doc;
    const series = generateVitalsSeries({ species: animal.species });
    const docId = `vitals_${animal._id}`;
    const vitalsDoc = { _id: docId, type: "vitals", animalId: animal._id, series, synced: false, updatedAt: Date.now() };
    await upsert(vitalsDoc);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateForAllAnimals().then(()=>{ console.log("Vitals generated for all animals"); process.exit(0);}).catch(e=>{console.error(e); process.exit(1);});
}
