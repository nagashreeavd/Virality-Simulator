// Turns the creator's inputs into a "content object": a topic profile plus the
// three levers that research on social sharing keeps surfacing —
// hook (do people stop scrolling?), quality (do they finish?), and
// emotion (do they feel something strong enough to pass it on?).

import { TOPICS, NUM_TOPICS, normalize } from "./topics.js";
import { clamp01 } from "./rng.js";

export function buildContent({
  title = "Untitled",
  primaryTopic = "comedy",
  secondaryTopic = null,
  hook = 0.6, // 0..1  strength of the opening / thumbnail
  quality = 0.6, // 0..1  production + payoff
  emotion = 0.5, // 0..1  emotional charge (joy, awe, outrage...)
  novelty = 0.5, // 0..1  how fresh/surprising the idea is
} = {}) {
  const vec = new Array(NUM_TOPICS).fill(0.02);
  const pi = TOPICS.indexOf(primaryTopic);
  if (pi >= 0) vec[pi] += 1;
  if (secondaryTopic) {
    const si = TOPICS.indexOf(secondaryTopic);
    if (si >= 0) vec[si] += 0.5;
  }

  return {
    title,
    topics: normalize(vec),
    primaryTopic,
    secondaryTopic,
    hook: clamp01(hook),
    quality: clamp01(quality),
    emotion: clamp01(emotion),
    novelty: clamp01(novelty),
    // A single "intrinsic shareability" scalar derived from the levers.
    // Emotion and novelty are the biggest multipliers on re-sharing;
    // hook governs whether the first viewers even engage.
    get shareability() {
      return clamp01(
        0.35 * this.hook +
          0.25 * this.quality +
          0.25 * this.emotion +
          0.15 * this.novelty
      );
    },
  };
}
