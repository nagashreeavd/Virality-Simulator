// Analytics dashboard — every chart hand-drawn in SVG (no chart library).

export default function Dashboard({ result, round }) {
  const { metrics, nodes } = result;
  const cumulative = [];
  let running = 0;
  metrics.perRound.forEach((v, i) => {
    running += i === 0 ? countSeeds(result) : v;
    cumulative.push({ round: i, pct: (running / metrics.population) * 100 });
  });
  const reachedNow = nodes.filter((n) => n.reachedRound >= 0 && n.reachedRound <= round);
  const onNow = reachedNow.filter((n) => n.onTarget).length;
  const offNow = reachedNow.length - onNow;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ReachCurve data={cumulative} round={round} />
      <NewReachBars data={metrics.perRound} round={round} peak={metrics.peakRound} />
      <TargetSplit on={onNow} off={offNow} />
      <FunnelStats metrics={metrics} />
    </div>
  );
}

function countSeeds(result) {
  const seedRound = result.rounds.find((r) => r.seeded);
  return seedRound ? seedRound.newlyReached.length : 0;
}

const INK = "#17150F", VERM = "#E5341A", GRAY = "#CFCABB", RULE = "rgba(23,21,15,0.14)";

function ReachCurve({ data, round }) {
  const W = 340, H = 160, pad = 28;
  const maxPct = Math.max(10, ...data.map((d) => d.pct));
  const x = (i) => pad + (i / Math.max(1, data.length - 1)) * (W - pad * 2);
  const y = (p) => H - pad - (p / maxPct) * (H - pad * 2);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.pct).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - pad} L${x(0)},${H - pad} Z`;
  return (
    <ChartCard title="Cumulative reach" subtitle="% of population reached, by round">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <defs>
          <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(23,21,15,0.14)" />
            <stop offset="100%" stopColor="rgba(23,21,15,0.01)" />
          </linearGradient>
        </defs>
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={RULE} />
        <path d={area} fill="url(#reachFill)" />
        <path d={line} fill="none" stroke={INK} strokeWidth="1.6" />
        {data.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.pct)} r={i === round ? 4 : 2}
            fill={i === round ? VERM : i <= round ? INK : GRAY} />
        ))}
        <line x1={x(round)} y1={pad - 10} x2={x(round)} y2={H - pad} stroke={VERM} strokeWidth="0.75" strokeDasharray="2 3" />
        <text x={pad} y={H - 8} fill="#9A958A" fontSize="9" fontFamily="monospace">r0</text>
        <text x={W - pad} y={H - 8} fill="#9A958A" fontSize="9" fontFamily="monospace" textAnchor="end">r{data.length - 1}</text>
        <text x={pad} y={pad - 14} fill="#9A958A" fontSize="9" fontFamily="monospace">{maxPct.toFixed(0)}%</text>
      </svg>
    </ChartCard>
  );
}

function NewReachBars({ data, round, peak }) {
  const W = 340, H = 160, pad = 28;
  const bars = data.slice(1);
  const max = Math.max(1, ...bars);
  const bw = (W - pad * 2) / Math.max(1, bars.length);
  return (
    <ChartCard title="New reach per round" subtitle="Where momentum peaked (accent = peak)">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        {bars.map((v, i) => {
          const h = (v / max) * (H - pad * 2);
          const active = i + 1 <= round;
          const isPeak = i + 1 === peak;
          return (
            <rect key={i} x={pad + i * bw + 2} y={H - pad - h}
              width={Math.max(2, bw - 4)} height={h} fill={isPeak ? VERM : active ? INK : GRAY} />
          );
        })}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke={RULE} />
      </svg>
    </ChartCard>
  );
}

function TargetSplit({ on, off }) {
  const total = on + off || 1;
  const onPct = (on / total) * 100;
  const R = 46, C = 2 * Math.PI * R;
  const dash = (onPct / 100) * C;
  return (
    <ChartCard title="On-target vs off-target" subtitle="Precision of the reach so far">
      <div className="flex items-center gap-6">
        <svg viewBox="0 0 120 120" className="h-28 w-28">
          <circle cx="60" cy="60" r={R} fill="none" stroke={VERM} strokeWidth="12" opacity="0.35" />
          <circle cx="60" cy="60" r={R} fill="none" stroke={INK} strokeWidth="12"
            strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={C / 4} transform="rotate(-90 60 60)" />
          <text x="60" y="57" textAnchor="middle" fill={INK} fontSize="22" fontFamily="Georgia, serif" fontWeight="700">{onPct.toFixed(0)}%</text>
          <text x="60" y="73" textAnchor="middle" fill="#9A958A" fontSize="8" fontFamily="monospace" letterSpacing="1">IN-DEMO</text>
        </svg>
        <div className="space-y-2 text-sm">
          <Row color={INK} label="In-demo reached" value={on} />
          <Row color={VERM} label="Off-target reached" value={off} />
        </div>
      </div>
    </ChartCard>
  );
}

function FunnelStats({ metrics }) {
  return (
    <ChartCard title="Spread summary" subtitle="Final simulation outcome">
      <div className="grid grid-cols-2 border-t border-rule">
        <Stat label="Total reach" value={`${metrics.totalReachPct}%`} accent />
        <Stat label="On-target rate" value={`${metrics.onTargetRate}%`} />
        <Stat label="In-demo penetration" value={`${metrics.inDemoPenetration}%`} />
        <Stat label="Active rounds" value={metrics.activeRounds} />
        <Stat label="Peak" value={`r${metrics.peakRound} · +${metrics.peakReach}`} />
        <Stat label="R factor" value={metrics.rFactor} />
      </div>
    </ChartCard>
  );
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <div className="mb-3">
        <div className="font-display text-lg text-ink">{title}</div>
        <div className="eyebrow mt-0.5">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function Row({ color, label, value }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="text-subink">{label}</span>
      <span className="tnum ml-auto font-mono font-semibold text-ink">{value}</span>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div className="border-b border-r border-rule px-3 py-3">
      <div className="eyebrow">{label}</div>
      <div className={`tnum mt-1 font-display text-2xl ${accent ? "text-vermillion" : "text-ink"}`}>{value}</div>
    </div>
  );
}
