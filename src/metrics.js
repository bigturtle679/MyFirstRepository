import { db } from "./db.js";

export async function getDashboardMetrics(){
  const animals = (await db.allDocs({include_docs:true, startkey:"animal_", endkey:"animal_\ufff0"})).rows.map(r=>r.doc);
  const vitalsDocs = (await db.allDocs({include_docs:true, startkey:"vitals_", endkey:"vitals_\ufff0"})).rows.map(r=>r.doc);
  const vitalsByAnimal = new Map();
  for (const v of vitalsDocs){ vitalsByAnimal.set(v.animalId, v.series); }

  let totalGain = 0, countGain=0;
  for (const a of animals){
    const s = vitalsByAnimal.get(a._id);
    if (s && s.length>1){
      const gain = s[s.length-1].weight - s[0].weight;
      totalGain += gain; countGain++;
    }
  }
  const avgWeightGain = countGain ? Number((totalGain/countGain).toFixed(2)) : 0;

  // Simplified feed conversion ratio: assume feed/day constant per species
  // FCR = feed consumed (kg) / weight gain (kg)
  let totalFeed = 0, totalWeightGain = 0;
  for (const a of animals){
    const s = vitalsByAnimal.get(a._id);
    if (s && s.length>1){
      const days = s.length;
      const feedPerDay = a.species === "cow" ? 10 : a.species === "goat" ? 2 : 3; // rough
      totalFeed += feedPerDay * days;
      totalWeightGain += s[s.length-1].weight - s[0].weight;
    }
  }
  const fcr = totalWeightGain>0 ? Number((totalFeed/totalWeightGain).toFixed(2)) : 0;

  return { animalsMonitored: animals.length, avgWeightGain, fcr };
}
