// V1 Citadel Holo — top chrome. Portal seal, brand, IN-SESSION orb, and an
// agent-mode pill that recolors with the active speaker.
//
// Note: agent role union is inlined here (not imported from data/types.ts)
// because the rest of the app uses the backend's role enum
// ('agent' | 'witness' | 'arbiter') with agent_mode ('plaintiff_coach' |
// 'defense_cross') driving the active counsel. AppHeaderRole maps from
// the existing AgentMode + speaker context — kept narrow on purpose.

export type AppHeaderRole = 'defense' | 'coach' | 'arbiter'

interface Props {
  /** Current active counsel — drives the right-side pill color */
  agent: AppHeaderRole
  /** Mono uptime string, e.g. "00:01:09" */
  uptime?: string
  caseId?: string
}

const AGENT_LABEL: Record<AppHeaderRole, string> = {
  defense: 'CROSS · LAWYER RICK',
  coach: 'COACH · ADVOCATE SUMMER',
  arbiter: 'BENCH · JUSTICE MORTY',
}

const AGENT_TINT: Record<AppHeaderRole, string> = {
  defense: 'var(--cit-plasma)',
  coach: 'var(--cit-portal)',
  arbiter: 'var(--cit-flare)',
}

export default function AppHeader({
  agent,
  uptime = '00:00:00',
  caseId = 'CR-7Θ19-Δ',
}: Props) {
  const tint = AGENT_TINT[agent]
  return (
    <header
      className="relative flex h-16 items-center gap-4 overflow-hidden border-b px-4 text-cit-text"
      style={{
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        background: 'var(--cit-vacuum)',
        borderColor: 'var(--cit-hairline)',
      }}
    >
      {/* agent-tinted radial wash */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          background: `radial-gradient(ellipse at 0% 50%, ${tint}33, transparent 60%)`,
        }}
      />

      {/* portal seal */}
      <div
        className="relative flex h-9 w-9 items-center justify-center rounded-full"
        style={{
          border: '1px solid var(--cit-portal)',
          boxShadow:
            '0 0 18px rgba(93,255,175,0.4), inset 0 0 12px rgba(93,255,175,0.2)',
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 24 24"
          width={22}
          height={22}
          fill="none"
          stroke="var(--cit-portal)"
          strokeWidth={1.4}
        >
          <ellipse cx={12} cy={12} rx={10} ry={10} />
          <ellipse cx={12} cy={12} rx={6.5} ry={6.5} opacity={0.7} />
          <ellipse cx={12} cy={12} rx={3} ry={3} opacity={0.4} />
        </svg>
      </div>

      <div className="relative flex flex-col leading-tight">
        <div
          className="text-[20px] leading-none text-portal"
          style={{
            fontFamily: 'RickAndMorty, Audiowide, system-ui, sans-serif',
            letterSpacing: '0.04em',
            textShadow: '0 0 14px rgba(93,255,175,0.55)',
          }}
        >
          COUNCEL OF RICKS
        </div>
        <div className="mt-0.5 text-[10px] tracking-[0.2em] text-cit-text-dim">
          INTERDIMENSIONAL TRIBUNAL · DEPOSITION SUITE
        </div>
      </div>

      <div className="flex-1" />

      {/* IN SESSION orb */}
      <div className="relative flex items-center gap-2 text-[10px] tracking-[0.2em] text-portal">
        <span
          className="h-2 w-2 rounded-full"
          style={{
            background: 'var(--cit-portal)',
            boxShadow: '0 0 10px var(--cit-portal)',
          }}
        />
        IN SESSION · {uptime}
      </div>

      <div
        className="h-6 w-px"
        style={{ background: 'var(--cit-hairline)' }}
      />

      {/* agent pill */}
      <div
        className="relative flex items-center gap-2 rounded px-3 py-1.5 text-[11px] tracking-[0.15em]"
        style={{
          color: tint,
          border: `1px solid ${tint}66`,
          boxShadow: `0 0 12px ${tint}44, inset 0 0 8px ${tint}22`,
        }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: tint }}
        />
        {AGENT_LABEL[agent]}
      </div>

      <div className="relative text-[10px] tracking-[0.15em] text-cit-text-dim">
        CASE · {caseId}
      </div>
    </header>
  )
}
