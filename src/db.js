import PouchDB from "pouchdb";
import PouchFind from "pouchdb-find";
import fs from "fs";
import path from "path";
import url from "url";

PouchDB.plugin(PouchFind);

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const DB_NAME = process.env.DB_NAME || "livestock_local";

export const db = new PouchDB(DB_NAME, {revs_limit: 10, auto_compaction: true});

export async function seedIfEmpty() {
  const info = await db.info();
  if (info.doc_count > 0) return {seeded:false, count:info.doc_count};
  const seedPath = path.resolve(__dirname, "../data/animals.seed.json");
  const raw = fs.readFileSync(seedPath, "utf8");
  const animals = JSON.parse(raw);
  const docs = animals.map(a => ({...a, createdAt: Date.now()}));
  const res = await db.bulkDocs(docs);
  return {seeded:true, count:res.length};
}

export function listenChanges(callback) {
  const feed = db.changes({since: "now", live: true, include_docs: true, heartbeat: 10000});
  feed.on("change", change => {
    if (change.doc) callback(change.doc);
  });
  feed.on("error", err => {
    console.error("changes error", err);
  });
  return () => feed.cancel();
}

export async function upsert(doc) {
  try {
    const existing = await db.get(doc._id);
    doc._rev = existing._rev;
    return await db.put(doc);
  } catch (err) {
    if (err.status === 404) return await db.put(doc);
    throw err;
  }
}

if (process.argv.includes("--seed")) {
  seedIfEmpty().then(r => {
    console.log("Seed result", r);
    process.exit(0);
  }).catch(e => { console.error(e); process.exit(1); });
}
