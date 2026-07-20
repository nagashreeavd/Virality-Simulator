// AI Growth Coach — asks the backend to diagnose the simulated performance and
// propose specific tactics + a rewritten hook. Works with or without an API key
// (falls back to the engine's deterministic recommendations).

import { useState } from "react";
import { coach } from "../api.js";

export default function AiCoach({ result, config, aiEnabled }) {
  const [state, setState] = useState({ loading: false, data: null, error: null });

  async function run() {
    setState({ loading: true, data: null, error: null });
    try {
      const data = await coach({
        content: {
          title: config.title,
          primaryTopic: config.primaryTopic,
          hook: config.hook,
          quality: config.quality,
          emotion: config.emotion,
          novelty: config.novelty,
        },
        metrics: result.metrics,
        verdict: result.verdict,
      });
      setState({ loading: false, data, error: null });
    } catch (e) {
      setState({ loading: false, data: null, error: e.message });
    }
  }

  const d = state.data;

  return (
    <div className="card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="eyebrow">Intelligence</div>
          <h3 className="mt-1 font-display text-2xl text-ink">AI Growth Coach</h3>
          <p className="mt-1 max-w-md text-sm text-subink">
            {aiEnabled
              ? "Diagnoses why this content performed the way it did, and rewrites the hook."
              : "Running in deterministic mode. Add an OpenRouter key to unlock full AI diagnosis + hook rewrites."}
          </p>
        </div>
        <button
          onClick={run}
          disabled={state.loading}
          className="shrink-0 bg-ink px-4 py-2 font-mono text-xs uppercase tracking-micro text-bone transition hover:bg-vermillion disabled:opacity-50"
        >
          {state.loading ? "Thinking…" : d ? "Regenerate" : "Generate plan"}
        </button>
      </div>

      {state.error && <p className="mt-4 text-sm text-vermillion">{state.error}</p>}

      {d && (
        <div className="mt-5 space-y-5 fadein">
          <div className="flex items-center gap-2">
            <SourceTag source={d.source} />
          </div>

          {d.diagnosis && (
            <div>
              <div className="eyebrow mb-1">Diagnosis</div>
              <p className="font-display text-lg italic leading-relaxed text-ink">{d.diagnosis}</p>
            </div>
          )}

          {d.actions?.length > 0 && (
            <div>
              <div className="eyebrow mb-2">Recommended actions</div>
              <ol className="space-y-2">
                {d.actions.map((a, i) => (
                  <li key={i} className="flex gap-3 border-t border-rule pt-2 text-sm text-ink">
                    <span className="tnum font-mono text-vermillion">{String(i + 1).padStart(2, "0")}</span>
                    <span>{a}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {d.rewrittenHook && (
            <div className="border-l-2 border-vermillion bg-vermillionSoft/40 px-4 py-3">
              <div className="eyebrow mb-1">Rewritten hook</div>
              <p className="font-display text-lg text-ink">“{d.rewrittenHook}”</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SourceTag({ source }) {
  const ai = source === "ai";
  return (
    <span
      className={`border px-2 py-0.5 font-mono text-[10px] uppercase tracking-micro ${
        ai ? "border-ink text-ink" : "border-faint text-faint"
      }`}
    >
      {ai ? "◆ AI-generated" : "○ deterministic fallback"}
    </span>
  );
}
