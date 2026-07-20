// Builds the synthetic social network the content spreads through.
//
// Real social graphs are "scale-free": a few hub accounts have enormous reach
// while most people have a handful of connections. We reproduce that with
// Barabási–Albert preferential attachment ("the rich get richer") — new nodes
// prefer to connect to already-popular nodes. We also bias attachment toward
// high-influence agents so natural amplifiers become the hubs.

export function buildGraph(rng, agents, { attachment = 3 } = {}) {
  const n = agents.length;
  const m = Math.max(1, Math.min(attachment, n - 1)); // edges each new node adds
  const adjacency = Array.from({ length: n }, () => new Set());

  // A weighted "target pool": each entry is a node id. A node appears more often
  // when it has higher degree (preferential attachment) or higher influence.
  const pool = [];
  const seedNodes = Math.min(m + 1, n);
  for (let i = 0; i < seedNodes; i++) {
    // Fully connect the small seed core.
    for (let j = i + 1; j < seedNodes; j++) {
      adjacency[i].add(j);
      adjacency[j].add(i);
    }
    pool.push(i, i);
  }

  for (let i = seedNodes; i < n; i++) {
    const targets = new Set();
    let guard = 0;
    while (targets.size < m && guard < m * 25) {
      guard++;
      let pick = pool.length ? pool[Math.floor(rng() * pool.length)] : Math.floor(rng() * i);
      // Occasionally bias the pick toward the more influential of two candidates.
      if (rng() < 0.5) {
        const alt = pool.length ? pool[Math.floor(rng() * pool.length)] : pick;
        if (agents[alt].influence > agents[pick].influence) pick = alt;
      }
      if (pick !== i) targets.add(pick);
    }
    for (const t of targets) {
      adjacency[i].add(t);
      adjacency[t].add(i);
      // Reinforce the pool: both endpoints become likelier future targets.
      pool.push(i, t);
    }
  }

  // Materialize a clean edge list and final degrees.
  const edges = [];
  for (let i = 0; i < n; i++) {
    agents[i].degree = adjacency[i].size;
    for (const j of adjacency[i]) if (i < j) edges.push({ source: i, target: j });
  }

  return { adjacency: adjacency.map((s) => [...s]), edges };
}

// Choose the seed accounts that first post the content. Strategy:
//  - "influencers": start with the biggest on-target hubs (a paid/creator push)
//  - "organic": a few random on-target accounts (you just posted it yourself)
export function pickSeeds(rng, agents, { seedStrategy = "organic", seedCount = 3 }) {
  const onTarget = agents.filter((a) => a.onTarget);
  const pool = onTarget.length ? onTarget : agents;
  let seeds;
  if (seedStrategy === "influencers") {
    seeds = [...pool]
      .sort((a, b) => b.degree * b.influence - a.degree * a.influence)
      .slice(0, seedCount);
  } else {
    const shuffled = [...pool].sort(() => rng() - 0.5);
    seeds = shuffled.slice(0, seedCount);
  }
  return seeds.map((a) => a.id);
}
