// Playback controls for stepping through the cascade round by round.

export default function ReplayControls({ round, maxRound, playing, onScrub, onToggle, onReset }) {
  return (
    <div className="flex flex-wrap items-center gap-3 border border-rule bg-paper p-3">
      <button
        onClick={onToggle}
        className="bg-ink px-4 py-2 font-mono text-xs uppercase tracking-micro text-bone transition hover:bg-vermillion"
      >
        {playing ? "❚❚ Pause" : "▶ Play spread"}
      </button>
      <button
        onClick={onReset}
        className="border border-ink/25 px-3 py-2 font-mono text-xs uppercase tracking-micro text-subink transition hover:border-ink hover:text-ink"
      >
        ⟲ Reset
      </button>
      <div className="flex flex-1 items-center gap-3">
        <span className="tnum whitespace-nowrap font-mono text-xs text-subink">
          ROUND <span className="font-semibold text-ink">{round}</span> / {maxRound}
        </span>
        <input type="range" min="0" max={maxRound} value={round}
          onChange={(e) => onScrub(Number(e.target.value))} className="flex-1" />
      </div>
    </div>
  );
}
