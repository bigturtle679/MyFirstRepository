import { checkVitalsAlerts } from "./alerts.js";

const sample = Array.from({length: 10}).map((_,i)=>({ ts: Date.now()+i*1000, temp: i<8?38.6:40.2, hr: i<8?65:95, weight: 500 + i*0.7 }));
console.log("Alerts:", checkVitalsAlerts(sample));
