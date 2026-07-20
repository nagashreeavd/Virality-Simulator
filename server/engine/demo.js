// Standalone sanity runner: `npm run engine:demo`.
// Exercises a few archetypal scenarios so you can confirm the engine produces
// sensible, varied verdicts without spinning up the whole app.

import { runSimulation } from "./index.js";

const scenarios = [
  {
    name: "Great comedy aimed at Gen-Z (should trend toward Viral/Slow Burn)",
    cfg: { title: "POV skit", primaryTopic: "comedy", targetPersonaId: "genz_creators",
           hook: 0.9, quality: 0.85, emotion: 0.9, novelty: 0.8, populationSize: 160,
           audienceFocus: 0.55, seedStrategy: "influencers", seedCount: 4 },
  },
  {
    name: "Deep finance explainer to finance pros (should trend Niche Hit)",
    cfg: { title: "Bond convexity, explained", primaryTopic: "finance", targetPersonaId: "finance_professionals",
           hook: 0.55, quality: 0.85, emotion: 0.3, novelty: 0.5, populationSize: 160,
           audienceFocus: 0.75, seedStrategy: "organic", seedCount: 3 },
  },
  {
    name: "Weak, off-target post (should trend Flop)",
    cfg: { title: "Random unedited clip", primaryTopic: "education", targetPersonaId: "sports_fans",
           hook: 0.2, quality: 0.3, emotion: 0.2, novelty: 0.2, populationSize: 160,
           audienceFocus: 0.6, seedStrategy: "organic", seedCount: 2 },
  },
  {
    name: "Solid evergreen tech to early adopters (should trend Slow Burn/Niche)",
    cfg: { title: "The one API trick", primaryTopic: "tech", targetPersonaId: "tech_early_adopters",
           hook: 0.6, quality: 0.8, emotion: 0.45, novelty: 0.7, populationSize: 160,
           audienceFocus: 0.65, seedStrategy: "organic", seedCount: 3 },
  },
];

let ok = true;
for (const s of scenarios) {
  const r = runSimulation(s.cfg);
  const m = r.metrics;
  console.log("\n=== " + s.name + " ===");
  console.log(`  Verdict     : ${r.verdict.label}  (${r.verdict.key})`);
  console.log(`  Reach       : ${m.totalReachPct}%   On-target: ${m.onTargetRate}%   In-demo: ${m.inDemoPenetration}%`);
  console.log(`  Rounds      : ${m.activeRounds} active, peak@round ${m.peakRound} (+${m.peakReach})   R=${m.rFactor}`);
  console.log(`  Nodes/Edges : ${r.nodes.length} / ${r.edges.length}`);
  // Basic invariants.
  const reachedCount = r.nodes.filter((n) => n.reachedRound >= 0).length;
  if (reachedCount !== m.totalReached) { console.error("  !! reached mismatch"); ok = false; }
  if (m.totalReachPct < 0 || m.totalReachPct > 100) { console.error("  !! reach out of range"); ok = false; }
}

console.log("\n" + (ok ? "All invariants passed." : "INVARIANT FAILURE."));
process.exit(ok ? 0 : 1);
