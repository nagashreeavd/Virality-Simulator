// Thin OpenRouter client. Everything AI in this project flows through here.
//
// Design goal: the app must work perfectly with NO api key. If the key is
// missing (or the call fails), callers fall back to deterministic logic. The
// LLM is an enhancement layer, never a hard dependency.

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

export function isAiEnabled() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

// Ask the model for a JSON object. Returns the parsed object, or null on any
// failure so the caller can fall back. Never throws.
export async function chatJSON(messages, { temperature = 0.4, maxTokens = 700 } = {}) {
  if (!isAiEnabled()) return null;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Virality Simulator",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages,
      }),
    });
    if (!res.ok) {
      console.warn("OpenRouter non-200:", res.status);
      return null;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) return null;
    return safeParse(text);
  } catch (err) {
    console.warn("OpenRouter call failed, using fallback:", err?.message || err);
    return null;
  }
}

// Models sometimes wrap JSON in prose or fences — extract the first {...} block.
function safeParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export { MODEL };
