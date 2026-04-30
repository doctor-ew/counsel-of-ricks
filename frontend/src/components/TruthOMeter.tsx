/**
 * Truth-O-Meter — V1 Citadel Holo (GH-9 visual upgrade over GH-8).
 *
 * Holographic semicircular gauge with scanline overlay, tick crown,
 * portal-glow needle, plasma-tint live arc, and an Audiowide score
 * readout. Hand-rolled SVG (no chart library), CSS transitions on the
 * needle's rotation and the live arc's stroke length so the swing reads
 * smoothly on stage.
 *
 * Score → angle mapping: 0 → -90deg (left), 100 → +90deg (right),
 * i.e. `rotate(-90 + (score / 100) * 180)`.
 *
 * `score === null` is a distinct neutral idle state — needle parked
 * at the +90deg (100) position, no zone label rendered. This is NOT
 * the same as `score === 100`. (AC #11)
 *
 * Zones are externally overridable via the `zones` prop so GH-9
 * (R&M re-skin) and GH-6 (demo presenter) can swap label copy or
 * thresholds without editing component logic.
 */

import { useMemo } from 'react'

export type TruthHue = 'good' | 'warn' | 'danger'

export type TruthZone = {
  label: string
  meaning: string // tooltip / aria description
  min: number // inclusive
  max: number // inclusive
  hue: TruthHue // drives stroke + glow color via CSS vars
  colorClass: string // Tailwind text-* class for the score readout / zone caption
}

/**
 * Default R&M-themed zone scale — 5 buckets across [0, 100].
 * Labels were locked during GH-8 plan review (AC #9, #10).
 * Color tokens upgraded for GH-9 (Citadel Holo): alarm / flare / portal.
 */
export const DEFAULT_ZONES: readonly TruthZone[] = [
  {
    label: 'Cronenberg-Level Nonsense',
    meaning:
      'Probably mutated garbage. Do not trust it unless you enjoy lawsuits and body horror.',
    min: 0,
    max: 19,
    hue: 'danger',
    colorClass: 'text-alarm',
  },
  {
    label: 'Jerry-Level Confidence',
    meaning:
      'Sounds confident. Unfortunately, so does Jerry. Needs serious verification.',
    min: 20,
    max: 39,
    hue: 'warn',
    colorClass: 'text-flare',
  },
  {
    label: 'Aw Jeez, Maybe?',
    meaning: 'Plausible, but shaky. The Morty zone. Ask for citations.',
    min: 40,
    max: 59,
    hue: 'warn',
    colorClass: 'text-flare',
  },
  {
    label: 'Council-Approved-ish',
    meaning:
      'Pretty solid. Still needs a quick sanity check before anyone gets smug.',
    min: 60,
    max: 79,
    hue: 'good',
    colorClass: 'text-portal',
  },
  {
    label: 'C-137 Canon Event',
    meaning: 'Strongly supported. Across most timelines, this holds up.',
    min: 80,
    max: 100,
    hue: 'good',
    colorClass: 'text-portal',
  },
] as const

interface TruthOMeterProps {
  /** 0-100 score, or null for a neutral idle state. */
  score: number | null
  /** Wrapper className for caller-driven layout/sizing. */
  className?: string
  /** Needle swing duration in ms. Default 1200. (AC #8) */
  durationMs?: number
  /** Override the zone scale (e.g. GH-6 demo presenter overrides). */
  zones?: readonly TruthZone[]
}

// Geometry — fixed viewBox via width/height; the gauge is sized by `className`.
const W = 360
const H = 230
const CX = W / 2
const CY = H - 24
const R_OUTER = 150

function polar(angleDeg: number, radius: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)]
}

function arcPath(a0: number, a1: number, radius: number): string {
  const [x0, y0] = polar(a0, radius)
  const [x1, y1] = polar(a1, radius)
  // Always sweeps the "short" direction across the top semicircle.
  return `M ${x0} ${y0} A ${radius} ${radius} 0 0 1 ${x1} ${y1}`
}

function findZone(
  score: number,
  zones: readonly TruthZone[],
): TruthZone | null {
  for (const z of zones) {
    if (score >= z.min && score <= z.max) return z
  }
  return null
}

function hueColorVar(hue: TruthHue | undefined): string {
  if (hue === 'good') return 'var(--cit-portal)'
  if (hue === 'warn') return 'var(--cit-flare)'
  if (hue === 'danger') return 'var(--cit-alarm)'
  return 'var(--cit-text-dim)'
}

export default function TruthOMeter({
  score,
  className,
  durationMs = 1200,
  zones = DEFAULT_ZONES,
}: TruthOMeterProps) {
  const isNull = score === null
  const safeScore = isNull
    ? 100
    : Math.max(0, Math.min(100, score as number))

  // Score → angle. 0 → -90deg, 100 → +90deg.
  const angle = -90 + (safeScore / 100) * 180

  const zone = isNull ? null : findZone(safeScore, zones)
  const zoneLabel = zone?.label ?? ''
  const zoneMeaning = zone?.meaning ?? ''
  const fillColorVar = isNull
    ? 'var(--cit-text-dim)'
    : hueColorVar(zone?.hue)

  // Tick crown — 41 evenly spaced ticks across the 180deg arc, every 8th big.
  const ticks = useMemo(() => {
    const out: {
      x1: number
      y1: number
      x2: number
      y2: number
      big: boolean
    }[] = []
    for (let i = 0; i <= 40; i++) {
      const a = ((-90 + (i / 40) * 180) * Math.PI) / 180
      const big = i % 8 === 0
      const r0 = big ? R_OUTER + 6 : R_OUTER + 10
      const r1 = big ? R_OUTER + 18 : R_OUTER + 14
      out.push({
        x1: CX + r0 * Math.cos(a),
        y1: CY + r0 * Math.sin(a),
        x2: CX + r1 * Math.cos(a),
        y2: CY + r1 * Math.sin(a),
        big,
      })
    }
    return out
  }, [])

  const ariaLabel = isNull
    ? 'Truth-O-Meter: no score yet'
    : `Truth-O-Meter: ${safeScore} out of 100, ${zoneLabel}`

  // Shared CSS transition string for the needle rotation and the live arc.
  const transition = `transform ${durationMs}ms cubic-bezier(0.4, 0, 0.2, 1)`

  return (
    <div
      className={`relative overflow-hidden rounded-lg font-mono text-cit-text ${className ?? ''}`}
      style={{
        width: W,
        height: H,
        background:
          'radial-gradient(ellipse at 50% 100%, rgba(30,106,71,0.2) 0%, transparent 60%), var(--cit-vacuum)',
        boxShadow:
          'inset 0 0 0 1px var(--cit-hairline), 0 0 60px rgba(93,255,175,0.07)',
      }}
      role="img"
      aria-label={ariaLabel}
    >
      {zoneMeaning && <span className="sr-only">{zoneMeaning}</span>}

      {/* CRT scanline overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-25 cit-scanlines" />

      <svg
        width={W}
        height={H}
        className="absolute inset-0"
        xmlns="http://www.w3.org/2000/svg"
      >
        {zoneMeaning && <title>{zoneMeaning}</title>}
        <defs>
          <filter id="cit-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        {/* outer tick crown */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--cit-portal)"
            strokeOpacity={t.big ? 0.6 : 0.25}
            strokeWidth={t.big ? 1.4 : 1}
          />
        ))}

        {/* dim zone arcs — render each zone as a faint backdrop */}
        {zones.map((z, i) => {
          const a0 = -90 + (z.min / 100) * 180
          const a1 = -90 + (z.max / 100) * 180
          // Skip degenerate arcs (zero-width) to avoid SVG path errors.
          if (Math.abs(a1 - a0) < 0.5) return null
          return (
            <path
              key={`zonearc-${i}`}
              d={arcPath(a0, a1, R_OUTER - 6)}
              stroke={hueColorVar(z.hue)}
              strokeOpacity={0.18}
              strokeWidth={20}
              fill="none"
            />
          )
        })}

        {/* live fill arc — animates via stroke transition */}
        {!isNull && (
          <>
            <path
              d={arcPath(-90, angle, R_OUTER - 6)}
              stroke={fillColorVar}
              strokeOpacity={0.95}
              strokeWidth={20}
              fill="none"
              style={{ transition }}
            />
            <path
              d={arcPath(-90, angle, R_OUTER - 6)}
              stroke={fillColorVar}
              strokeOpacity={0.55}
              strokeWidth={28}
              fill="none"
              filter="url(#cit-glow)"
              style={{ transition }}
            />
          </>
        )}

        {/* inner rings */}
        <circle
          cx={CX}
          cy={CY}
          r={96}
          fill="none"
          stroke="var(--cit-hairline)"
          strokeWidth={1}
        />
        <circle
          cx={CX}
          cy={CY}
          r={80}
          fill="none"
          stroke="var(--cit-hairline)"
          strokeWidth={1}
          strokeDasharray="2 4"
        />

        {/* needle — animated rotation */}
        <g
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transformBox: 'view-box',
            transition,
            willChange: 'transform',
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - (R_OUTER - 10)}
            stroke="var(--cit-portal)"
            strokeWidth={2}
          />
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - (R_OUTER - 10)}
            stroke="var(--cit-scan-cyan)"
            strokeWidth={6}
            strokeOpacity={0.4}
            filter="url(#cit-glow)"
          />
          <circle
            cx={CX}
            cy={CY - (R_OUTER - 10)}
            r={4}
            fill="var(--cit-portal)"
          />
        </g>
        <circle cx={CX} cy={CY} r={6} fill="var(--cit-portal)" />
        <circle
          cx={CX}
          cy={CY}
          r={14}
          fill="none"
          stroke="var(--cit-portal)"
          strokeOpacity={0.4}
        />
      </svg>

      {/* corners */}
      <div className="absolute left-4 top-3.5 text-[10px] tracking-[0.2em] text-portal opacity-90">
        ◉ CRED-SCAN · LIVE
      </div>
      <div className="absolute right-4 top-3.5 text-[10px] tracking-[0.2em] text-cit-text-dim">
        BR-7Θ19
      </div>

      {/* big numeric readout */}
      <div
        className={`absolute inset-x-0 bottom-14 text-center leading-none ${isNull ? 'text-cit-text-dim' : 'text-portal'}`}
        style={{
          fontFamily: 'Audiowide, system-ui, sans-serif',
          fontSize: 44,
          textShadow: isNull
            ? 'none'
            : '0 0 18px rgba(93,255,175,0.67)',
        }}
      >
        {isNull ? '—' : safeScore}
      </div>

      {/* zone name */}
      {!isNull && zoneLabel && (
        <div className="absolute inset-x-0 bottom-7 text-center text-[11px] tracking-[0.3em] text-cit-text">
          ╱ {zoneLabel.toUpperCase()} ╲
        </div>
      )}

      {/* axis labels */}
      <div className="absolute inset-x-0 bottom-2 flex justify-between px-7 text-[8px] tracking-[0.15em] text-cit-text-dim">
        <span>00</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}
