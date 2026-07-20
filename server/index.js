// Express API for the Virality Simulator.
//   GET  /api/health   -> liveness check
//   GET  /api/status   -> whether AI features are enabled (key present)
//   GET  /api/options  -> personas + topics for populating the UI
//   POST /api/simulate -> run one simulation, return graph + rounds + verdict
//   POST /api/analyze  -> [AI] infer content fields from a free-text idea
//   POST /api/coach    -> [AI] tailored growth advice + rewritten hook
//
// The engine (./engine) has no dependencies; the AI layer (./llm) is optional
// and degrades gracefully to deterministic logic when no key is set.

import "dotenv/config";
import express from "express";
import cors from "cors";
import { runSimulation, PERSONA_LIST, TOPICS, TOPIC_LABELS } from "./engine/index.js";
import { isAiEnabled, MODEL } from "./llm/openrouter.js";
import { analyzeContent } from "./llm/analyze.js";
import { coachContent } from "./llm/coach.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "virality-simulator", time: new Date().toISOString() });
});

app.get("/api/status", (_req, res) => {
  res.json({ aiEnabled: isAiEnabled(), model: isAiEnabled() ? MODEL : null });
});

app.get("/api/options", (_req, res) => {
  res.json({
    personas: PERSONA_LIST,
    topics: TOPICS.map((t) => ({ id: t, label: TOPIC_LABELS[t] })),
    seedStrategies: [
      { id: "organic", label: "Organic (you just posted it)" },
      { id: "influencers", label: "Influencer push (seed the hubs)" },
    ],
  });
});

app.post("/api/simulate", (req, res) => {
  try {
    const cfg = sanitize(req.body || {});
    const started = Date.now();
    const result = runSimulation(cfg);
    result.meta.computeMs = Date.now() - started;
    res.json(result);
  } catch (err) {
    console.error("simulate error:", err);
    res.status(400).json({ error: "Simulation failed", detail: String(err?.message || err) });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const out = await analyzeContent(req.body?.text ?? "");
    res.json(out);
  } catch (err) {
    console.error("analyze error:", err);
    res.status(400).json({ error: "Analyze failed", detail: String(err?.message || err) });
  }
});

app.post("/api/coach", async (req, res) => {
  try {
    const { content, metrics, verdict } = req.body || {};
    if (!content || !metrics || !verdict) {
      return res.status(400).json({ error: "content, metrics and verdict are required" });
    }
    const out = await coachContent({ content, metrics, verdict });
    res.json(out);
  } catch (err) {
    console.error("coach error:", err);
    res.status(400).json({ error: "Coach failed", detail: String(err?.message || err) });
  }
});

// Coerce and bound every incoming field so bad input can never crash the engine.
function sanitize(b) {
  const num = (v, def, lo, hi) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return def;
    return Math.max(lo, Math.min(hi, n));
  };
  return {
    title: String(b.title ?? "Untitled").slice(0, 120),
    primaryTopic: String(b.primaryTopic ?? "comedy"),
    secondaryTopic: b.secondaryTopic ? String(b.secondaryTopic) : null,
    hook: num(b.hook, 0.6, 0, 1),
    quality: num(b.quality, 0.6, 0, 1),
    emotion: num(b.emotion, 0.5, 0, 1),
    novelty: num(b.novelty, 0.5, 0, 1),
    targetPersonaId: String(b.targetPersonaId ?? "genz_creators"),
    populationSize: num(b.populationSize, 120, 30, 400),
    audienceFocus: num(b.audienceFocus, 0.6, 0.1, 0.95),
    seedStrategy: b.seedStrategy === "influencers" ? "influencers" : "organic",
    seedCount: num(b.seedCount, 3, 1, 8),
    seed: b.seed === undefined || b.seed === null || b.seed === "" ? undefined : num(b.seed, undefined, 0, 2 ** 32 - 1),
  };
}

app.listen(PORT, () => {
  console.log(`Virality Simulator API listening on http://localhost:${PORT}`);
  console.log(`AI features: ${isAiEnabled() ? "ENABLED (" + MODEL + ")" : "disabled (no OPENROUTER_API_KEY - deterministic fallback)"}`);
});
