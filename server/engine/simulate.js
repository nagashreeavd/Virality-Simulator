// The spread dynamics: an agent-based Independent Cascade model.
//
// Round 0: the seed accounts post the content and become active "sharers".
// Each round: every agent who became a sharer LAST round gets one chance to
// pass the content to each of their still-unaware neighbours. Whether it lands
// is a probability that blends the content, the relationship, and the viewer:
//
//   p(transmit) = base
//               * affinity(content.topics, viewer.interests)  // do they care?
//               * viewer.susceptibility                        // are they receptive?
//               * content.shareability                         // is it good?
//               * senderPush                                   // how loud is the sender?
//
// A viewer who receives it is "reached". They only become a *sharer* (and keep
// the cascade alive) if the content also clears their personal share threshold —
// this is why great-but-narrow content gets a niche hit, not a breakout.

import { affinity } from "./topics.js";
import { clamp01 } from "./rng.js";

export function runCascade(rng, { agents, adjacency, content, seeds, maxRounds = 12, baseRate = 0.14 }) {
  for (const a of agents) {
    a.state = "unaware";
    a.reachedRound = -1;
  }

  const rounds = []; // per-round record for the animated replay
  let frontier = []; // agents who will attempt to spread this round

  // Seed round.
  for (const id of seeds) {
    const a = agents[id];
    a.state = "sharer";
    a.reachedRound = 0;
    frontier.push(id);
  }
  rounds.push({
    round: 0,
    newlyReached: [...seeds],
    edges: [],
    seeded: true,
  });

  let round = 0;
  while (frontier.length && round < maxRounds) {
    round++;
    const nextFrontier = [];
    const newlyReached = [];
    const firedEdges = [];

    for (const senderId of frontier) {
      const sender = agents[senderId];
      // Louder senders (influence + their own enthusiasm) transmit harder.
      const senderPush = 0.5 + 0.5 * (0.6 * sender.influence + 0.4 * sender.shareDrive);

      for (const nbrId of adjacency[senderId]) {
        const nbr = agents[nbrId];
        if (nbr.state !== "unaware") continue;

        const care = affinity(content.topics, nbr.interests);
        let p =
          baseRate *
          (0.35 + 1.3 * care) * // topical fit dominates but never fully zero
          nbr.susceptibility *
          (0.5 + content.shareability) *
          senderPush;
        p = clamp01(p);

        if (rng() < p) {
          nbr.state = "reached";
          nbr.reachedRound = round;
          newlyReached.push(nbrId);
          firedEdges.push({ source: senderId, target: nbrId });

          // Does this reached viewer become an active re-sharer?
          // Needs both intrinsic drive AND enough topical love for the content.
          const shareProb = clamp01(nbr.shareDrive * (0.4 + care) * (0.5 + content.emotion));
          if (rng() < shareProb) {
            nbr.state = "sharer";
            nextFrontier.push(nbrId);
          }
        }
      }
    }

    rounds.push({ round, newlyReached, edges: firedEdges, seeded: false });
    frontier = nextFrontier;
    if (newlyReached.length === 0) break;
  }

  return rounds;
}
