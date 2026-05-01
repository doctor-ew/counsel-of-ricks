import { Link, useNavigate } from 'react-router-dom'

interface NavLink {
  to: string
  label: string
  color?: string
}

interface Props {
  backTo?: string
  links?: NavLink[]
}

const PortalSeal = () => (
  <div
    className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
    style={{
      border: '1.5px solid var(--cit-portal)',
      boxShadow: '0 0 22px rgba(93,255,175,0.4)',
    }}
    aria-hidden
  >
    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="var(--cit-portal)" strokeWidth={1.3}>
      <ellipse cx={12} cy={12} rx={10} ry={10} />
      <ellipse cx={12} cy={12} rx={6.5} ry={6.5} opacity={0.7} />
      <ellipse cx={12} cy={12} rx={3} ry={3} opacity={0.4} />
    </svg>
  </div>
)

export default function CitadelNav({ backTo, links }: Props) {
  const navigate = useNavigate()
  return (
    <header
      className="relative z-10 flex h-20 flex-shrink-0 items-center gap-4 border-b px-4"
      style={{
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        background: 'var(--cit-vacuum)',
        borderColor: 'var(--cit-hairline)',
      }}
    >
      {backTo ? (
        <button
          onClick={() => navigate(backTo)}
          className="text-cit-text-dim hover:text-portal text-[10px] tracking-[0.2em] transition-colors mr-2"
        >
          ◀ BACK
        </button>
      ) : (
        <PortalSeal />
      )}

      <Link to="/" className="flex flex-col leading-tight">
        <div
          className="leading-none text-portal"
          style={{
            fontFamily: 'RickAndMorty, Audiowide, system-ui, sans-serif',
            fontSize: '40px',
            textShadow: '0 0 18px rgba(93,255,175,0.6)',
          }}
        >
          COUNCEL OF RICKS
        </div>
        <div className="mt-1 text-[10px] tracking-[0.2em] text-cit-text-dim">
          INTERDIMENSIONAL TRIBUNAL
        </div>
      </Link>

      <div className="flex-1" />

      {links?.map((link) => (
        <Link
          key={link.to}
          to={link.to}
          className="text-[10px] tracking-[0.18em] transition-colors hover:opacity-100 opacity-70"
          style={{ color: link.color ?? 'var(--cit-scan-cyan)' }}
        >
          {link.label}
        </Link>
      ))}
    </header>
  )
}
