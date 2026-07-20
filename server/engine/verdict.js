// Reads the finished cascade and turns raw spread into metrics + a human verdict.
//
// The four archetypes mirror how growth teams actually talk about a post:
//   Viral Hit  — broke containment, reached the mainstream over many rounds.
//   Niche Hit  — loved by its target, but never jumped the fence (like the demo).
//   Slow Burn  — modest reach that keeps compounding over many rounds.
//   Flop       — never caught. Died in the first couple of rounds.

export function computeMetrics(agents, rounds) {
  const population = agents.length;
  const reached = agents.filter((a) => a.reachedRound >= 0);
  const totalReached = reached.length;
  const onTargetReached = reached.filter((a) => a.onTarget).length;
  const targetPool = agents.filter((a) => a.onTarget).length || 1;

  const totalReachPct = totalReached / population;
  // Of everyone we reached, how many were the people we wanted? (precision)
  const onTargetRate = totalReached ? onTargetReached / totalReached : 0;
  // Of our intended audience, how many did we actually hit? (in-demo penetration)
  const inDemoPenetration = onTargetReached / targetPool;

  // Reach added per round + when momentum peaked.
  const perRound = rounds.map((r) => (r.seeded ? 0 : r.newlyReached.length));
  const activeRounds = rounds.filter((r, i) => i > 0 && r.newlyReached.length > 0).length;
  let peakRound = 0;
  let peakReach = 0;
  perRound.forEach((v, i) => {
    if (v > peakReach) {
      peakReach = v;
      peakRound = i;
    }
  });

  // Reproduction number R: new reach in round 2 vs round 1 — >1 means growth.
  const r1 = perRound[1] || 0;
  const r2 = perRound[2] || 0;
  const rFactor = r1 ? +(r2 / r1).toFixed(2) : 0;

  return {
    population,
    totalReached,
    onTargetReached,
    totalReachPct: +(totalReachPct * 100).toFixed(1),
    onTargetRate: +(onTargetRate * 100).toFixed(1),
    inDemoPenetration: +(inDemoPenetration * 100).toFixed(1),
    activeRounds,
    peakRound,
    peakReach,
    rFactor,
    perRound,
  };
}

export function classify(m) {
  const reach = m.totalReachPct;
  let key, label, tone, summary;

  // Order matters: stalls are flops first; a genuine breakout beats everything;
  // small-but-beloved is niche; the middle ground that keeps compounding is slow burn.
  if (m.activeRounds <= 2 || reach < 10) {
    key = "flop";
    label = "Didn't Catch";
    tone = "cool";
    summary =
      "Spread stalled within the first rounds and never built momentum. The hook or the audience match needs work.";
  } else if (reach >= 38 && m.activeRounds >= 4) {
    key = "viral";
    label = "Viral Hit";
    tone = "positive";
    summary =
      "Broke out of its core audience and kept compounding across many rounds. This is a genuine breakout.";
  } else if (reach < 22 && m.onTargetRate >= 55) {
    key = "niche";
    label = "Niche Hit";
    tone = "warm";
    summary =
      "Strongly loved inside its target audience, but it never jumped the fence into the mainstream. Strong in-demo, no breakout.";
  } else {
    key = "slowburn";
    label = "Slow Burn";
    tone = "neutral";
    summary =
      "No explosive spike, but steady compounding reach round after round. Content that ages well.";
  }

  return { key, label, tone, summary, recommendations: recommend(key, m) };
}

function recommend(key, m) {
  const tips = [];
  if (key === "flop") {
    tips.push("Sharpen the first 2 seconds — a weak hook caps everything downstream.");
    tips.push("Your topic-to-audience match looks low; retarget to a persona that actually cares.");
  }
  if (key === "niche") {
    tips.push("Add one broadly-relatable angle to give the content a bridge out of the niche.");
    tips.push("Seed a few high-degree accounts outside your core to test cross-over.");
  }
  if (key === "slowburn") {
    tips.push("Momentum is real but slow — a paid boost on day one could tip it into breakout range.");
    tips.push("Lean into evergreen framing; this format keeps earning reach over time.");
  }
  if (key === "viral") {
    tips.push("Ride it: post follow-up content within 24h while the network is warm.");
    tips.push("Capture the new off-target audience with a clear next action.");
  }
  if (m.onTargetRate < 40 && key !== "flop") {
    tips.push("Most reach landed off-target — tighten topical focus to convert better.");
  }
  return tips;
}
