// Tiny fetch wrapper around the backend API.

async function post(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || err.error || "Request failed");
  }
  return res.json();
}

export async function getOptions() {
  const res = await fetch("/api/options");
  if (!res.ok) throw new Error("Failed to load options");
  return res.json();
}

export async function getStatus() {
  const res = await fetch("/api/status");
  if (!res.ok) return { aiEnabled: false, model: null };
  return res.json();
}

export const simulate = (config) => post("/api/simulate", config);
export const analyze = (text) => post("/api/analyze", { text });
export const coach = (payload) => post("/api/coach", payload);
