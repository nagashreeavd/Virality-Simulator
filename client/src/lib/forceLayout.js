// A from-scratch force-directed graph layout (Fruchterman–Reingold style).
// No graph library — just physics:
//   - every node repels every other node (like charged particles)
//   - every edge pulls its two endpoints together (like a spring)
//   - a gentle gravity keeps the whole thing centered
// We run a fixed number of cooling iterations once, then freeze the positions
// so the animated replay can reuse them.

export function computeLayout(nodes, edges, { width, height, iterations = 320 } = {}) {
  const n = nodes.length;
  const area = width * height;
  const k = Math.sqrt(area / Math.max(n, 1)) * 0.8; // ideal edge length
  const cx = width / 2;
  const cy = height / 2;

  // Seed positions on a circle (deterministic — no random jitter between runs).
  const pos = nodes.map((node, i) => {
    const a = (i / n) * Math.PI * 2;
    const r = Math.min(width, height) * 0.34;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, dx: 0, dy: 0 };
  });

  const idOf = new Map(nodes.map((nd, i) => [nd.id, i]));
  const E = edges
    .map((e) => [idOf.get(e.source), idOf.get(e.target)])
    .filter(([a, b]) => a !== undefined && b !== undefined);

  let temp = width * 0.1; // max displacement per iteration, cools over time
  const cool = temp / (iterations + 1);

  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < n; i++) { pos[i].dx = 0; pos[i].dy = 0; }

    // Repulsive forces (O(n^2) — fine for the 30–400 nodes we simulate).
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ddx = pos[i].x - pos[j].x;
        let ddy = pos[i].y - pos[j].y;
        let dist = Math.hypot(ddx, ddy) || 0.01;
        const rep = (k * k) / dist;
        const ux = ddx / dist;
        const uy = ddy / dist;
        pos[i].dx += ux * rep; pos[i].dy += uy * rep;
        pos[j].dx -= ux * rep; pos[j].dy -= uy * rep;
      }
    }

    // Attractive spring forces along edges.
    for (const [a, b] of E) {
      let ddx = pos[a].x - pos[b].x;
      let ddy = pos[a].y - pos[b].y;
      let dist = Math.hypot(ddx, ddy) || 0.01;
      const att = (dist * dist) / k;
      const ux = ddx / dist;
      const uy = ddy / dist;
      pos[a].dx -= ux * att; pos[a].dy -= uy * att;
      pos[b].dx += ux * att; pos[b].dy += uy * att;
    }

    // Apply displacement (capped by temperature) + light gravity to center.
    for (let i = 0; i < n; i++) {
      const disp = Math.hypot(pos[i].dx, pos[i].dy) || 0.01;
      pos[i].x += (pos[i].dx / disp) * Math.min(disp, temp);
      pos[i].y += (pos[i].dy / disp) * Math.min(disp, temp);
      pos[i].x += (cx - pos[i].x) * 0.012;
      pos[i].y += (cy - pos[i].y) * 0.012;
    }
    temp = Math.max(temp - cool, 1);
  }

  // Normalize into the viewport with padding.
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pos) {
    minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y); maxY = Math.max(maxY, p.y);
  }
  const pad = 28;
  const sx = (width - pad * 2) / (maxX - minX || 1);
  const sy = (height - pad * 2) / (maxY - minY || 1);
  const s = Math.min(sx, sy);
  const layout = {};
  nodes.forEach((nd, i) => {
    layout[nd.id] = {
      x: pad + (pos[i].x - minX) * s,
      y: pad + (pos[i].y - minY) * s,
    };
  });
  return layout;
}
