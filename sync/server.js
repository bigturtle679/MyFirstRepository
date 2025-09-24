import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json({limit:"1mb"}));

// In-memory store just to acknowledge sync
const received = new Map();

app.post("/ingest", (req,res)=>{
  const docs = Array.isArray(req.body) ? req.body : [req.body];
  let count=0; for (const d of docs){ received.set(d._id || d.id || (Date.now()+""), d); count++; }
  res.json({ ok:true, received: count });
});

app.get("/received", (_req,res)=>{
  res.json({ size: received.size });
});

const port = process.env.PORT || 5050;
app.listen(port, ()=> console.log(`Mock sync server on :${port}`));
