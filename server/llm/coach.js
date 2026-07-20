// AI Growth Coach: reads the finished simulation (content + metrics + verdict)
// and writes tailored advice plus a punchier rewrite of the hook/caption.
// Falls back to the engine's deterministic recommendations when AI is off.

import { chatJSON } from "./openrouter.js";

export async function coachContent({ content, metrics, verdict }) {
  const ai = await chatJSON(
    [
      {
        role: "system",
        content:
          "You are a sharp short-form growth strategist. Given a simulated content " +
          "performance, give specific, non-generic advice. Reply ONLY with JSON: " +
          "{ diagnosis: string (2 sentences on WHY it performed this way), " +
          "actions: string[] (3 concrete, specific tactics), " +
          "rewrittenHook: string (a stronger opening line/caption, punchy) }.",
      },
      {
        role: "user",
        content: JSON.stringify({
          title: content.title,
          primaryTopic: content.primaryTopic,
          levers: { hook: content.hook, quality: content.quality, emotion: content.emotion, novelty: content.novelty },
          verdict: verdict.label,
          metrics: {
            totalReachPct: metrics.totalReachPct,
            onTargetRate: metrics.onTargetRate,
            inDemoPenetration: metrics.inDemoPenetration,
            activeRounds: metrics.activeRounds,
            rFactor: metrics.rFactor,
          },
        }),
      },
    ],
    { temperature: 0.6, maxTokens: 500 }
  );

  if (ai && Array.isArray(ai.actions) && ai.actions.length) {
    return {
      diagnosis: String(ai.diagnosis || verdict.summary).slice(0, 400),
      actions: ai.actions.slice(0, 4).map((a) => String(a).slice(0, 220)),
      rewrittenHook: String(ai.rewrittenHook || "").slice(0, 200),
      source: "ai",
    };
  }

  // Fallback: reuse the deterministic recommendations already on the verdict.
  return {
    diagnosis: verdict.summary,
    actions: verdict.recommendations,
    rewrittenHook: "",
    source: "fallback",
  };
}
