// AI content analysis: read a free-text post idea (or caption/script) and infer
// the structured inputs the simulator needs — topic mix + the four levers.
// Falls back to a keyword heuristic when no API key is configured.

import { chatJSON } from "./openrouter.js";
import { TOPICS } from "../engine/topics.js";

const clamp01 = (x) => Math.max(0, Math.min(1, Number(x)));
const validTopic = (t) => (TOPICS.includes(t) ? t : null);

export async function analyzeContent(text) {
  const clean = String(text || "").slice(0, 1500).trim();
  if (!clean) return { ...heuristic(""), source: "empty" };

  const ai = await chatJSON([
    {
      role: "system",
      content:
        "You analyze short-form social content and score its viral characteristics. " +
        "Reply ONLY with JSON. Topics must be from this list: " +
        TOPICS.join(", ") +
        ". Fields: primaryTopic (string), secondaryTopic (string or null), " +
        "hook (0-1, how strongly the opening stops the scroll), " +
        "quality (0-1, production and payoff), " +
        "emotion (0-1, emotional charge that drives sharing), " +
        "novelty (0-1, freshness/surprise), " +
        "rationale (one short sentence).",
    },
    { role: "user", content: `Content idea: "${clean}"` },
  ]);

  if (ai && validTopic(ai.primaryTopic)) {
    return {
      primaryTopic: validTopic(ai.primaryTopic),
      secondaryTopic: validTopic(ai.secondaryTopic),
      hook: clamp01(ai.hook ?? 0.6),
      quality: clamp01(ai.quality ?? 0.6),
      emotion: clamp01(ai.emotion ?? 0.5),
      novelty: clamp01(ai.novelty ?? 0.5),
      rationale: String(ai.rationale || "").slice(0, 200),
      source: "ai",
    };
  }
  return { ...heuristic(clean), source: "fallback" };
}

// Deterministic fallback: keyword buckets + light lexical signals for the levers.
const KEYWORDS = {
  tech: ["ai", "code", "app", "startup", "software", "api", "dev", "gadget", "iphone", "tech"],
  comedy: ["funny", "meme", "skit", "joke", "prank", "pov", "relatable", "lol"],
  fashion: ["outfit", "ootd", "style", "fashion", "haul", "makeup", "grwm"],
  sports: ["game", "match", "goal", "workout", "gym", "football", "cricket", "nba"],
  food: ["recipe", "food", "cooking", "restaurant", "eat", "snack", "mukbang"],
  finance: ["money", "invest", "stock", "crypto", "budget", "finance", "salary", "trading"],
  gaming: ["game", "gaming", "valorant", "minecraft", "stream", "esports", "gamer"],
  education: ["learn", "study", "tutorial", "explained", "how to", "guide", "tips", "course"],
};

function heuristic(text) {
  const t = text.toLowerCase();
  const scores = Object.fromEntries(TOPICS.map((k) => [k, 0]));
  for (const [topic, words] of Object.entries(KEYWORDS)) {
    for (const w of words) if (t.includes(w)) scores[topic] += 1;
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryTopic = ranked[0][1] > 0 ? ranked[0][0] : "comedy";
  const secondaryTopic = ranked[1][1] > 0 ? ranked[1][0] : null;

  const excited = (t.match(/[!?]/g) || []).length;
  const emotion = clamp01(0.4 + Math.min(0.4, excited * 0.1));
  const hook = clamp01(0.5 + (t.startsWith("pov") || t.includes("wait for it") ? 0.3 : 0) + Math.min(0.2, excited * 0.05));
  const novelty = clamp01(0.45 + (t.includes("first") || t.includes("new") || t.includes("nobody") ? 0.25 : 0));
  const quality = 0.6;

  return {
    primaryTopic,
    secondaryTopic,
    hook,
    quality,
    emotion,
    novelty,
    rationale: "Estimated from keywords (add an OpenRouter key for full AI analysis).",
  };
}
