// Orchestrator: takes a single config object and runs the full pipeline —
// audience -> graph -> seeds -> cascade -> metrics -> verdict — returning one
// JSON payload the frontend can both animate and summarize.

import { makeRng, hashSeed } from "./rng.js";
import { buildContent } from "./content.js";
import { buildAudience, PERSONAS } from "./personas.js";
import { buildGraph, pickSeeds } from "./graph.js";
import { runCascade } from "./simulate.js";
import { computeMetrics, classify } from "./verdict.js";
import { TOPIC_LABELS } from "./topics.js";

export function runSimulation(config = {}) {
  const {
    title = "Untitled",
    primaryTopic = "comedy",
    secondaryTopic = null,
    hook = 0.6,
    quality = 0.6,
    emotion = 0.5,
    novelty = 0.5,
    targetPersonaId = "genz_creators",
    populationSize = 120,
    audienceFocus = 0.6,
    seedStrategy = "organic",
    seedCount = 3,
    attachment = 4,
    baseRate = 0.26,
    seed, // optional explicit numeric seed for reproducibility
  } = config;

  const size = Math.max(30, Math.min(400, populationSize | 0));
  const finalSeed = Number.isFinite(seed) ? seed >>> 0 : hashSeed(`${title}|${primaryTopic}|${targetPersonaId}|${size}`);
  const rng = makeRng(finalSeed);

  const content = buildContent({ title, primaryTopic, secondaryTopic, hook, quality, emotion, novelty });
  const { agents } = buildAudience(rng, { populationSize: size, targetPersonaId, audienceFocus });
  const { adjacency, edges } = buildGraph(rng, agents, { attachment });
  const seeds = pickSeeds(rng, agents, { seedStrategy, seedCount: Math.max(1, Math.min(seedCount, 8)) });
  const rounds = runCascade(rng, { agents, adjacency, content, seeds, baseRate });
  const metrics = computeMetrics(agents, rounds);
  const verdict = classify(metrics);

  return {
    meta: {
      title,
      seed: finalSeed,
      persona: PERSONAS[targetPersonaId]?.name || "General Public",
      primaryTopic: TOPIC_LABELS[primaryTopic] || primaryTopic,
      shareability: +content.shareability.toFixed(3),
      generatedAt: new Date().toISOString(),
    },
    // Lightweight node list for the client-side force layout + coloring.
    nodes: agents.map((a) => ({
      id: a.id,
      onTarget: a.onTarget,
      influence: +a.influence.toFixed(3),
      degree: a.degree,
      reachedRound: a.reachedRound,
      // "sharer" if they re-shared, else "reached" or "unaware"
      finalState: a.state,
    })),
    edges,
    rounds,
    metrics,
    verdict,
  };
}

export { PERSONAS } from "./personas.js";
export { PERSONA_LIST } from "./personas.js";
export { TOPICS, TOPIC_LABELS } from "./topics.js";
