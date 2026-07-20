import { useEffect, useMemo, useRef, useState } from "react";
import { computeLayout } from "../lib/forceLayout.js";

const COLORS = {
  unaware: "#CFCABB",
  target: "#17150F",
  offtarget: "#E5341A",
  sharerRing: "#B8892B",
  seedRing: "#E5341A",
  edge: "rgba(23,21,15,0.07)",
  fired: "rgba(23,21,15,0.40)",
  firedOff: "rgba(229,52,26,0.50)",
  glowInk: "rgba(23,21,15,0.12)",
  glowVerm: "rgba(229,52,26,0.16)",
};

export default function NetworkGraph({ result, round }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [size, setSize] = useState({ w: 720, h: 520 });
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const w = Math.max(320, entries[0].contentRect.width);
      setSize({ w, h: 520 });
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  const layout = useMemo(() => {
    if (!result) return null;
    return computeLayout(result.nodes, result.edges, { width: size.w, height: size.h });
  }, [result, size.w, size.h]);

  const firedRound = useMemo(() => {
    const map = new Map();
    if (!result) return map;
    for (const r of result.rounds) for (const e of r.edges) map.set(`${e.source}-${e.target}`, r.round);
    return map;
  }, [result]);

  const nodeById = useMemo(() => {
    const m = new Map();
    if (result) for (const n of result.nodes) m.set(n.id, n);
    return m;
  }, [result]);

  useEffect(() => {
    if (!result || !layout) return;
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = size.w + "px";
    canvas.style.height = size.h + "px";
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size.w, size.h);

    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.edge;
    for (const e of result.edges) {
      const a = layout[e.source], b = layout[e.target];
      if (!a || !b) continue;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    for (const [key, r] of firedRound) {
      if (r > round) continue;
      const [s, t] = key.split("-").map(Number);
      const a = layout[s], b = layout[t];
      if (!a || !b) continue;
      const target = nodeById.get(t);
      const pulsing = r === round;
      ctx.lineWidth = pulsing ? 2.2 : 1.3;
      ctx.strokeStyle = target && !target.onTarget ? COLORS.firedOff : COLORS.fired;
      ctx.globalAlpha = pulsing ? 1 : 0.7;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    for (const n of result.nodes) {
      const p = layout[n.id];
      if (!p) continue;
      const reached = n.reachedRound >= 0 && n.reachedRound <= round;
      const isNew = n.reachedRound === round;
      const isSeed = n.reachedRound === 0;
      const baseR = 2.6 + Math.min(6, n.degree * 0.35);
      const r = reached ? baseR + (isNew ? 3 : 1) : baseR;
      let fill = COLORS.unaware;
      if (reached) fill = n.onTarget ? COLORS.target : COLORS.offtarget;
      if (reached && isNew) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = n.onTarget ? COLORS.glowInk : COLORS.glowVerm;
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = fill;
      ctx.fill();
      if (reached && n.finalState === "sharer") {
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = COLORS.sharerRing;
        ctx.stroke();
      }
      if (isSeed) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = COLORS.seedRing;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r + 2.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (hover && layout[hover.id]) {
      const p = layout[hover.id];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(23,21,15,0.55)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [result, layout, round, size, hover, firedRound, nodeById]);

  function onMove(ev) {
    if (!layout) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = ev.clientX - rect.left, my = ev.clientY - rect.top;
    let best = null, bestD = 14 * 14;
    for (const n of result.nodes) {
      const p = layout[n.id];
      if (!p) continue;
      const d = (p.x - mx) ** 2 + (p.y - my) ** 2;
      if (d < bestD) { bestD = d; best = { ...n, x: p.x, y: p.y }; }
    }
    setHover(best);
  }

  return (
    <div ref={wrapRef} className="relative w-full">
      <canvas ref={canvasRef} onMouseMove={onMove} onMouseLeave={() => setHover(null)}
        className="border border-rule bg-[#FBFAF5]" />
      {hover && (
        <div className="pointer-events-none absolute z-10 border border-ink/20 bg-paper px-3 py-2 text-xs shadow-[3px_3px_0_rgba(23,21,15,0.12)]"
          style={{ left: Math.min(hover.x + 12, size.w - 160), top: Math.max(hover.y - 10, 4) }}>
          <div className="font-mono font-semibold text-ink">
            AGENT #{hover.id} · {hover.onTarget ? "IN-DEMO" : "OFF-TARGET"}
          </div>
          <div className="text-subink">
            {hover.reachedRound >= 0 ? `reached @ round ${hover.reachedRound}` : "never reached"} · degree {hover.degree}
          </div>
          <div className="text-subink">
            {hover.finalState === "sharer" ? "re-shared it" : hover.reachedRound >= 0 ? "passive viewer" : "unaware"}
          </div>
        </div>
      )}
      <Legend />
    </div>
  );
}

function Legend() {
  const items = [
    ["#17150F", "In-demo reached"],
    ["#E5341A", "Off-target reached"],
    ["#CFCABB", "Unaware"],
    ["#B8892B", "Re-sharer (ring)"],
  ];
  return (
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-micro text-subink">
      {items.map(([c, label]) => (
        <span key={label} className="inline-flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: c }} />
          {label}
        </span>
      ))}
    </div>
  );
}
