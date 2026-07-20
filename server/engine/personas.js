// Persona presets define the *target audience* the creator is aiming at.
// Each persona has a core interest profile plus behavioural traits that shape
// how easily its members are activated and how far they re-share.

import { TOPICS, NUM_TOPICS, normalize } from "./topics.js";
import { clamp01 } from "./rng.js";

// Helper: build a topic distribution by naming the dominant topics.
function profile(weights) {
  const vec = new Array(NUM_TOPICS).fill(0.03); // small baseline interest in everything
  for (const [topic, w] of Object.entries(weights)) {
    const idx = TOPICS.indexOf(topic);
    if (idx >= 0) vec[idx] += w;
  }
  return normalize(vec);
}

export const PERSONAS = {
  genz_creators: {
    id: "genz_creators",
    name: "Gen-Z Creators",
    blurb: "18–24, extremely online, high share velocity, chase trends and comedy.",
    interests: profile({ comedy: 0.5, gaming: 0.25, fashion: 0.2, tech: 0.15 }),
    susceptibility: 0.72, // how readily they engage
    shareDrive: 0.68, // how likely a reached member re-shares
    influence: 0.6, // relative reach when they do share
    fickleness: 0.22, // extra randomness in their behaviour
  },
  tech_early_adopters: {
    id: "tech_early_adopters",
    name: "Tech Early Adopters",
    blurb: "Builders and founders. Skeptical, but huge amplification when convinced.",
    interests: profile({ tech: 0.6, finance: 0.25, education: 0.2, gaming: 0.1 }),
    susceptibility: 0.5,
    shareDrive: 0.55,
    influence: 0.78,
    fickleness: 0.12,
  },
  finance_professionals: {
    id: "finance_professionals",
    name: "Finance Professionals",
    blurb: "25–45, time-poor, share selectively but reach decision-makers.",
    interests: profile({ finance: 0.6, tech: 0.2, education: 0.2 }),
    susceptibility: 0.42,
    shareDrive: 0.4,
    influence: 0.7,
    fickleness: 0.1,
  },
  foodies: {
    id: "foodies",
    name: "Foodies & Lifestyle",
    blurb: "Visual-first, save-and-share culture, strong word-of-mouth loops.",
    interests: profile({ food: 0.55, fashion: 0.25, comedy: 0.15 }),
    susceptibility: 0.63,
    shareDrive: 0.62,
    influence: 0.55,
    fickleness: 0.2,
  },
  sports_fans: {
    id: "sports_fans",
    name: "Sports Fans",
    blurb: "Tribal, spike hard around moments, cool off just as fast.",
    interests: profile({ sports: 0.6, comedy: 0.2, gaming: 0.15 }),
    susceptibility: 0.66,
    shareDrive: 0.6,
    influence: 0.6,
    fickleness: 0.28,
  },
  students_learners: {
    id: "students_learners",
    name: "Students & Learners",
    blurb: "Value-driven, save educational content, steadier long-tail spread.",
    interests: profile({ education: 0.5, tech: 0.25, finance: 0.2, gaming: 0.15 }),
    susceptibility: 0.55,
    shareDrive: 0.5,
    influence: 0.5,
    fickleness: 0.14,
  },
  general_public: {
    id: "general_public",
    name: "General Public",
    blurb: "Broad mainstream mix. Hard to target, but the road to true virality.",
    interests: profile({ comedy: 0.3, food: 0.2, sports: 0.2, tech: 0.15, fashion: 0.15 }),
    susceptibility: 0.5,
    shareDrive: 0.48,
    influence: 0.5,
    fickleness: 0.3,
  },
};

export const PERSONA_LIST = Object.values(PERSONAS).map((p) => ({
  id: p.id,
  name: p.name,
  blurb: p.blurb,
}));

// Build the population of agents. A fraction belongs to the target persona
// ("in-demo"); the rest are drawn from the general public so we can measure how
// much spread stays on-target vs leaks into the wider network.
export function buildAudience(rng, { populationSize, targetPersonaId, audienceFocus = 0.6 }) {
  const target = PERSONAS[targetPersonaId] || PERSONAS.general_public;
  const filler = PERSONAS.general_public;
  const agents = [];

  for (let i = 0; i < populationSize; i++) {
    const onTarget = rng() < audienceFocus;
    const base = onTarget ? target : filler;

    // Jitter the persona's core interests so individuals differ.
    const interests = base.interests.map((v) => clamp01(v + rng.gauss(0, 0.04)));
    const total = interests.reduce((s, v) => s + v, 0) || 1;
    const interestVec = interests.map((v) => v / total);

    agents.push({
      id: i,
      onTarget,
      personaId: base.id,
      interests: interestVec,
      susceptibility: clamp01(base.susceptibility + rng.gauss(0, base.fickleness * 0.5)),
      shareDrive: clamp01(base.shareDrive + rng.gauss(0, base.fickleness * 0.5)),
      influence: clamp01(base.influence + rng.gauss(0, 0.12)),
      // Filled in by the graph builder / simulator:
      degree: 0,
      state: "unaware", // unaware -> reached -> sharer (active spreader)
      reachedRound: -1,
    });
  }
  return { agents, target };
}
