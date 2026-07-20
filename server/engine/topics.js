// The "interest space". Every piece of content and every audience member is
// represented as a distribution over these topics. Spread probability is driven
// by how well a piece of content's topic profile matches a viewer's interests.

export const TOPICS = [
  "tech",
  "comedy",
  "fashion",
  "sports",
  "food",
  "finance",
  "gaming",
  "education",
];

export const TOPIC_LABELS = {
  tech: "Tech",
  comedy: "Comedy",
  fashion: "Fashion",
  sports: "Sports",
  food: "Food",
  finance: "Finance",
  gaming: "Gaming",
  education: "Education",
};

export const NUM_TOPICS = TOPICS.length;

// Cosine similarity between two topic vectors, in [0, 1] for non-negative inputs.
export function affinity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Normalize a vector so its components sum to 1 (a probability distribution).
export function normalize(vec) {
  const sum = vec.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  return vec.map((v) => Math.max(0, v) / sum);
}
