// The headline verdict — set like a magazine cover line.

const TONE = {
  positive: { rule: "bg-ink", tag: "text-ink border-ink" },
  warm: { rule: "bg-vermillion", tag: "text-vermillion border-vermillion" },
  neutral: { rule: "bg-ochre", tag: "text-ochre border-ochre" },
  cool: { rule: "bg-faint", tag: "text-subink border-faint" },
};

export default function VerdictCard({ result }) {
  const { verdict, metrics, meta } = result;
  const tone = TONE[verdict.tone] || TONE.neutral;

  return (
    <div className="card fadein">
      <div className={`h-1 w-full ${tone.rule}`} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">The Verdict</div>
            <h2 className="mt-1 font-display text-5xl leading-[0.95] tracking-tight text-ink">
              {verdict.label}.
            </h2>
          </div>
          <span className={`tnum shrink-0 border px-3 py-1 font-mono text-xs font-semibold ${tone.tag}`}>
            {metrics.totalReachPct}% REACH
          </span>
        </div>

        <p className="mt-4 max-w-2xl border-l-2 border-rule pl-4 font-display text-lg italic leading-relaxed text-subink">
          {verdict.summary}
        </p>

        <div className="mt-6 grid grid-cols-2 divide-x divide-rule border-y border-rule sm:grid-cols-4">
          <Big label="Total reach" value={`${metrics.totalReachPct}%`} />
          <Big label="On-target" value={`${metrics.onTargetRate}%`} />
          <Big label="Rounds" value={metrics.activeRounds} />
          <Big label="Shareability" value={meta.shareability} />
        </div>
      </div>
    </div>
  );
}

function Big({ label, value }) {
  return (
    <div className="px-4 py-4 first:pl-0">
      <div className="eyebrow">{label}</div>
      <div className="tnum mt-1 font-display text-3xl text-ink">{value}</div>
    </div>
  );
}
