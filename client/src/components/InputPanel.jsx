// Left-hand control panel: describe content + audience, then run the sim.
// Includes an "Analyze with AI" box that infers the topic + levers from text.

import { useState } from "react";
import { analyze } from "../api.js";

export default function InputPanel({ options, config, update, onRun, loading, aiEnabled }) {
  const persona = options?.personas?.find((p) => p.id === config.targetPersonaId);
  const [ai, setAi] = useState({ loading: false, note: null });

  async function analyzeText() {
    setAi({ loading: true, note: null });
    try {
      const r = await analyze(config.title);
      update({
        primaryTopic: r.primaryTopic,
        secondaryTopic: r.secondaryTopic,
        hook: r.hook,
        quality: r.quality,
        emotion: r.emotion,
        novelty: r.novelty,
      });
      setAi({ loading: false, note: { source: r.source, text: r.rationale } });
    } catch (e) {
      setAi({ loading: false, note: { source: "error", text: e.message } });
    }
  }

  return (
    <div className="card p-5">
      <Section n="01" title="Content">
        <label className="eyebrow">Title / idea</label>
        <textarea value={config.title} onChange={(e) => update({ title: e.target.value })} rows={2}
          placeholder="e.g. POV: interviewing at a startup and the founder walks in late"
          className="mt-1 w-full resize-none border border-ink/20 bg-bone px-3 py-2 text-sm text-ink outline-none focus:border-vermillion" />
        <button onClick={analyzeText} disabled={ai.loading}
          className="mt-2 flex w-full items-center justify-center gap-2 border border-ink px-3 py-2 font-mono text-[11px] uppercase tracking-micro text-ink transition hover:bg-ink hover:text-bone disabled:opacity-50">
          {ai.loading ? "Analyzing" : "Analyze with AI"}
        </button>
        {ai.note && (
          <p className={`mt-1.5 text-[11px] leading-snug ${ai.note.source === "error" ? "text-vermillion" : "text-faint"}`}>
            {ai.note.source === "ai" ? "AI: " : ai.note.source === "fallback" ? "Heuristic: " : ""}
            {ai.note.text}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-3">
          <Select label="Primary topic" value={config.primaryTopic} onChange={(v) => update({ primaryTopic: v })}
            options={options?.topics?.map((t) => ({ value: t.id, label: t.label })) || []} />
          <Select label="Secondary" value={config.secondaryTopic || ""} onChange={(v) => update({ secondaryTopic: v || null })}
            options={[{ value: "", label: "None" }, ...(options?.topics?.map((t) => ({ value: t.id, label: t.label })) || [])]} />
        </div>

        <div className="mt-4 space-y-3">
          <Slider label="Hook strength" hint="stops the scroll" value={config.hook} onChange={(v) => update({ hook: v })} />
          <Slider label="Quality / payoff" hint="keeps them watching" value={config.quality} onChange={(v) => update({ quality: v })} />
          <Slider label="Emotional charge" hint="makes them share" value={config.emotion} onChange={(v) => update({ emotion: v })} />
          <Slider label="Novelty" hint="feels fresh" value={config.novelty} onChange={(v) => update({ novelty: v })} />
        </div>
      </Section>

      <Section n="02" title="Audience">
        <Select label="Target persona" value={config.targetPersonaId} onChange={(v) => update({ targetPersonaId: v })}
          options={options?.personas?.map((p) => ({ value: p.id, label: p.name })) || []} />
        {persona && <p className="mt-1.5 text-[11px] leading-relaxed text-faint">{persona.blurb}</p>}
        <div className="mt-3 space-y-3">
          <Slider label="Audience focus" hint="% who are your target" value={config.audienceFocus} onChange={(v) => update({ audienceFocus: v })} min={0.1} max={0.95} />
          <NumberRow label="Population size" value={config.populationSize} min={40} max={300} step={20} onChange={(v) => update({ populationSize: v })} />
        </div>
      </Section>

      <Section n="03" title="Launch" last>
        <div className="grid grid-cols-2 gap-3">
          <Select label="Seeding" value={config.seedStrategy} onChange={(v) => update({ seedStrategy: v })}
            options={options?.seedStrategies?.map((s) => ({ value: s.id, label: s.label })) || []} />
          <NumberRow label="Seed accounts" value={config.seedCount} min={1} max={8} step={1} onChange={(v) => update({ seedCount: v })} />
        </div>
      </Section>

      <button onClick={onRun} disabled={loading}
        className="mt-5 w-full bg-vermillion py-3 font-mono text-xs uppercase tracking-micro text-bone transition hover:bg-ink disabled:opacity-60">
        {loading ? "Simulating spread" : "Run virality simulation"}
      </button>
    </div>
  );
}

function Section({ n, title, last, children }) {
  return (
    <div className={last ? "" : "border-b border-rule pb-5 mb-5"}>
      <div className="mb-3 flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-vermillion">{n}</span>
        <span className="font-display text-xl text-ink">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border border-ink/20 bg-bone px-2.5 py-2 text-sm text-ink outline-none focus:border-vermillion">
        {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </label>
  );
}

function Slider({ label, hint, value, onChange, min = 0, max = 1 }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-ink">{label} <span className="text-[11px] text-faint">- {hint}</span></span>
        <span className="tnum font-mono text-xs font-semibold text-vermillion">{Math.round(value * 100)}</span>
      </div>
      <input type="range" min={min} max={max} step="0.01" value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full" />
    </div>
  );
}

function NumberRow({ label, value, min, max, step, onChange }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">{label}</span>
        <span className="tnum font-mono text-xs font-semibold text-vermillion">{value}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="mt-1.5 w-full" />
    </div>
  );
}
