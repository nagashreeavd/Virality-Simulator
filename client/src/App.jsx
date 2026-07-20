import { useEffect, useRef, useState } from "react";
import { getOptions, getStatus, simulate } from "./api.js";
import InputPanel from "./components/InputPanel.jsx";
import NetworkGraph from "./components/NetworkGraph.jsx";
import Dashboard from "./components/Dashboard.jsx";
import VerdictCard from "./components/VerdictCard.jsx";
import ReplayControls from "./components/ReplayControls.jsx";
import AiCoach from "./components/AiCoach.jsx";

const DEFAULT_CONFIG = {
  title: "POV: interviewing at a startup",
  primaryTopic: "comedy",
  secondaryTopic: "tech",
  hook: 0.82,
  quality: 0.78,
  emotion: 0.85,
  novelty: 0.7,
  targetPersonaId: "genz_creators",
  populationSize: 160,
  audienceFocus: 0.6,
  seedStrategy: "influencers",
  seedCount: 4,
};

const PRESETS = [
  { name: "Gen-Z comedy", cfg: { title: "POV: interviewing at a startup", primaryTopic: "comedy", secondaryTopic: "tech", hook: 0.85, quality: 0.8, emotion: 0.88, novelty: 0.7, targetPersonaId: "genz_creators", audienceFocus: 0.55, seedStrategy: "influencers", seedCount: 4 } },
  { name: "Finance explainer", cfg: { title: "Bond convexity, explained", primaryTopic: "finance", secondaryTopic: null, hook: 0.5, quality: 0.88, emotion: 0.3, novelty: 0.5, targetPersonaId: "finance_professionals", audienceFocus: 0.78, seedStrategy: "organic", seedCount: 3 } },
  { name: "Off-target flop", cfg: { title: "Unedited 12-min ramble", primaryTopic: "education", secondaryTopic: null, hook: 0.2, quality: 0.3, emotion: 0.2, novelty: 0.2, targetPersonaId: "sports_fans", audienceFocus: 0.6, seedStrategy: "organic", seedCount: 2 } },
  { name: "Evergreen tech", cfg: { title: "The one API trick", primaryTopic: "tech", secondaryTopic: "education", hook: 0.62, quality: 0.82, emotion: 0.45, novelty: 0.72, targetPersonaId: "tech_early_adopters", audienceFocus: 0.65, seedStrategy: "organic", seedCount: 3 } },
];

export default function App() {
  const [options, setOptions] = useState(null);
  const [status, setStatus] = useState({ aiEnabled: false, model: null });
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [round, setRound] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);

  const maxRound = result ? result.rounds.length - 1 : 0;

  useEffect(() => {
    getOptions().then(setOptions).catch(() => setError("Could not reach the API. Is the server running on :3001?"));
    getStatus().then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (options && !result) runSim(DEFAULT_CONFIG);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setRound((r) => {
        if (r >= maxRound) { setPlaying(false); return r; }
        return r + 1;
      });
    }, 650);
    return () => clearInterval(timer.current);
  }, [playing, maxRound]);

  async function runSim(cfg) {
    setLoading(true);
    setError(null);
    setPlaying(false);
    try {
      const r = await simulate(cfg);
      setResult(r);
      setRound(0);
      setPlaying(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const update = (patch) => setConfig((c) => ({ ...c, ...patch }));
  const applyPreset = (cfg) => {
    const merged = { ...DEFAULT_CONFIG, ...cfg };
    setConfig(merged);
    runSim(merged);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-6 border-b-2 border-ink pb-5">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-micro text-subink">
          <span>The Virality Report</span>
          <span className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${status.aiEnabled ? "bg-vermillion blink" : "bg-faint"}`} />
            {status.aiEnabled ? `AI · ${status.model}` : "Deterministic mode"}
          </span>
        </div>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-5xl leading-none text-ink md:text-6xl">
              Virality <span className="italic text-vermillion">Simulator</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-subink">
              An agent-based model of how content spreads through a social network — predict the verdict before you ever hit post.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p.name} onClick={() => applyPreset(p.cfg)}
                className="border border-ink/25 px-3 py-1.5 font-mono text-[11px] uppercase tracking-micro text-subink transition hover:border-vermillion hover:text-vermillion">
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 border border-vermillion bg-vermillionSoft/40 px-4 py-3 text-sm text-ink">{error}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <InputPanel options={options} config={config} update={update} onRun={() => runSim(config)} loading={loading} aiEnabled={status.aiEnabled} />

        <div className="space-y-5">
          {result ? (
            <>
              <VerdictCard result={result} />
              <div className="card p-5">
                <div className="mb-3 flex items-center justify-between border-b border-rule pb-3">
                  <div>
                    <div className="font-display text-xl text-ink">Spread network</div>
                    <div className="eyebrow mt-0.5">
                      {result.nodes.length} agents · {result.edges.length} connections · seed: {config.seedStrategy}
                    </div>
                  </div>
                  <span className="tnum border border-ink/20 px-3 py-1 font-mono text-xs text-subink">
                    ROUND {round} / {maxRound}
                  </span>
                </div>
                <NetworkGraph result={result} round={round} />
                <div className="mt-4">
                  <ReplayControls round={round} maxRound={maxRound} playing={playing}
                    onScrub={(r) => { setPlaying(false); setRound(r); }}
                    onToggle={() => { if (round >= maxRound) setRound(0); setPlaying((p) => !p); }}
                    onReset={() => { setPlaying(false); setRound(0); }} />
                </div>
              </div>
              <Dashboard result={result} round={round} />
              <AiCoach result={result} config={config} aiEnabled={status.aiEnabled} />
              <footer className="border-t border-rule pb-8 pt-3 text-center font-mono text-[10px] uppercase tracking-micro text-faint">
                Independent Cascade model · synthetic scale-free network · seed {result.meta.seed} · {result.meta.computeMs ?? "—"}ms
              </footer>
            </>
          ) : (
            <div className="card grid h-96 place-items-center font-mono text-xs uppercase tracking-micro text-faint">
              {loading ? "Running the first simulation…" : "Configure content and run a simulation."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
