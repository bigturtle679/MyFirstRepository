import fetch from "node-fetch";
import { db, upsert } from "./db.js";

const SYNC_URL = process.env.SYNC_URL || "http://localhost:5050/ingest";

export async function syncUnsynced() {
  const toSync = (await db.find({ selector: { synced: { $eq: false } }, limit: 1000 })).docs;
  if (!toSync.length) { console.log("Nothing to sync"); return {count:0}; }
  const res = await fetch(SYNC_URL, { method: "POST", headers: {"content-type":"application/json"}, body: JSON.stringify(toSync) });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  const out = await res.json();
  for (const d of toSync){ await upsert({ ...d, synced: true, syncedAt: Date.now() }); }
  return {count: out.received};
}

if (process.argv.includes("--once")){
  syncUnsynced().then(r=>{ console.log("Synced", r); process.exit(0);}).catch(e=>{ console.error(e); process.exit(1);});
}
