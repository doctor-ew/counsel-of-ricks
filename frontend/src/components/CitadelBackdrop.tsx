// frontend/src/components/CitadelBackdrop.tsx
// Pulsating portals + drifting equation/glyph cloud + faint vector grid.
// Pure CSS animations, GPU-accelerated transforms only. Sits behind chat
// content with `position: absolute; inset: 0`. Honors prefers-reduced-motion.
//
// Usage:
//   <div className="relative h-full overflow-hidden">
//     <CitadelBackdrop density={0.8} />
//     <div className="relative z-10">…your content…</div>
//   </div>

import { useMemo } from 'react';

interface Props {
  /** 0..1+ — scales the glyph count. Default 1. */
  density?: number;
  /** Outer opacity multiplier. Default 1. */
  opacity?: number;
  className?: string;
}

const GLYPHS = [
  '∮', 'Δ', 'Σ', 'Ω', 'Ψ', 'ƒ(x)', '∇²φ', 'eⁱπ+1=0', 'c²=a²+b²',
  '⊕', '⊗', 'BR-7Θ', '∂/∂t', 'τ', '⌬', 'ψ', '∫', 'λ', '½mv²',
  '⟨φ|ψ⟩', 'P=NP?', 'ξ', '∞', 'Θ-19', '⌖', '⟁', '∴', 'C-137',
];

interface Item {
  g: string; top: number; left: number; size: number;
  dur: number; delay: number; drift: number; hue: string; o: number;
}

export default function CitadelBackdrop({ density = 1, opacity = 1, className = '' }: Props) {
  const items = useMemo<Item[]>(() => {
    // Deterministic placement so SSR / rerenders stay stable.
    const rand = (n: number) => {
      const x = Math.sin(n) * 10000;
      return x - Math.floor(x);
    };
    const n = Math.round(22 * density);
    return Array.from({ length: n }, (_, i) => ({
      g: GLYPHS[i % GLYPHS.length],
      top: rand(i * 1.3) * 100,
      left: rand(i * 2.7 + 9) * 100,
      size: 11 + rand(i * 3.1) * 22,
      dur: 18 + rand(i * 4.3) * 22,
      delay: -rand(i * 5.7) * 30,
      drift: 30 + rand(i * 6.9) * 60,
      hue: rand(i * 7.7) > 0.5 ? 'var(--cit-portal)' : 'var(--cit-scan-cyan)',
      o: 0.18 + rand(i * 8.1) * 0.32,
    }));
  }, [density]);

  return (
    <div className={`cit-backdrop ${className}`} aria-hidden style={{ opacity }}>
      <span className="cit-portal-orb cit-portal-a" />
      <span className="cit-portal-orb cit-portal-b" />
      <span className="cit-portal-orb cit-portal-c" />
      <div className="cit-grid" />
      {items.map((it, i) => (
        <span
          key={i}
          className="cit-glyph"
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            fontSize: it.size,
            color: it.hue,
            opacity: it.o,
            // CSS custom property — declared as a string for type-safety.
            ['--drift' as never]: `${it.drift}px`,
            animationDuration: `${it.dur}s`,
            animationDelay: `${it.delay}s`,
          }}
        >
          {it.g}
        </span>
      ))}
    </div>
  );
}
