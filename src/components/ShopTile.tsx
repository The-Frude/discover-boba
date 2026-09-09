import Image from 'next/image'

// Deterministic placeholder art (docs/UI-OVERHAUL-PLAN-09sep2026.md §3).
// Renders a real photo when one exists; otherwise a generated "cup of
// boba" tile seeded by the shop's stable ID, so the same shop always
// gets the same tile and a city grid reads as varied but coherent
// rather than a wall of grey boxes. Pure SVG - no images, no network
// requests, negligible payload. Server component, not wired into any
// production page yet.

interface ShopTileProps {
  id: string
  imageUrl?: string | null
  alt: string
  className?: string
  /** Overrides the default 4:3 aspect ratio - e.g. a square on the card's
   * mobile horizontal layout. */
  aspectClassName?: string
  sizes?: string
  priority?: boolean
}

interface Palette {
  name: string
  milk: string
  tea: string
  accent: string
}

// Six palettes drawn from real drink colors. Tapioca pearls are dark
// regardless of drink flavor, so pearl color stays constant across
// palettes - only the milk/tea bands and accent (cup outline, lid, straw)
// change.
const PALETTES: Palette[] = [
  { name: 'matcha', milk: '#E8F0DD', tea: '#7A9B5C', accent: '#4F7A34' },
  { name: 'taro', milk: '#EFE6F5', tea: '#B399D4', accent: '#7B5CA6' },
  { name: 'brown-sugar', milk: '#F5EBDD', tea: '#B87940', accent: '#7A4A1F' },
  { name: 'thai-tea', milk: '#FBE8D6', tea: '#E08A3C', accent: '#C05621' },
  { name: 'strawberry', milk: '#FBE4E8', tea: '#E58BA0', accent: '#C24A67' },
  { name: 'jasmine', milk: '#FBF3D9', tea: '#E8C34A', accent: '#B88A1E' },
]

const PEARL_COLOR = '#3B2A1E'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

function generateTileParams(id: string) {
  const hash = hashString(id || 'shop')
  const palette = PALETTES[hash % PALETTES.length]
  // Wave amplitude and the milk/tea split point both vary per-shop so
  // shops sharing a palette (roughly 1 in 6) still look distinct from
  // each other, not just distinct from other palettes.
  const waveAmplitude = 8 + (Math.floor(hash / 7) % 16) // 8-23
  const teaBandTop = 130 + (Math.floor(hash / 13) % 40) // 130-169 (of 300 tall)
  const pearlCount = 5 + (Math.floor(hash / 37) % 4) // 5-8

  const baseXs = [136, 160, 184, 208, 232, 256, 280]
  const pearls = baseXs.slice(0, pearlCount).map((x, i) => {
    const jitter = Math.floor(hash / (17 + i * 3)) % 10
    return {
      cx: x + (jitter - 5),
      cy: 252 + (Math.floor(hash / (23 + i * 5)) % 10),
      r: 8 + (Math.floor(hash / (29 + i * 7)) % 3),
    }
  })

  const straw = {
    rotation: -10 + (Math.floor(hash / 41) % 20), // -10 to 9 degrees
  }

  return { palette, waveAmplitude, teaBandTop, pearls, straw }
}

function GeneratedTile({ id }: { id: string }) {
  const { palette, waveAmplitude, teaBandTop, pearls, straw } = generateTileParams(id)
  const clipId = `cup-${id}`.replace(/[^a-zA-Z0-9-]/g, '')

  const cup = { x: 110, y: 55, width: 180, height: 215, rx: 18 }
  const teaPath = `M ${cup.x} ${teaBandTop} C ${cup.x + 60} ${teaBandTop - waveAmplitude}, ${cup.x + 120} ${teaBandTop + waveAmplitude}, ${cup.x + cup.width} ${teaBandTop} L ${cup.x + cup.width} ${cup.y + cup.height} L ${cup.x} ${cup.y + cup.height} Z`

  return (
    <svg viewBox="0 0 400 300" className="w-full h-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="300" fill="var(--bg, #FDFBF7)" />

      {/* Straw */}
      <rect
        x="190"
        y="8"
        width="14"
        height="58"
        rx="6"
        fill={palette.accent}
        opacity="0.85"
        transform={`rotate(${straw.rotation} 197 37)`}
      />

      <defs>
        <clipPath id={clipId}>
          <rect x={cup.x} y={cup.y} width={cup.width} height={cup.height} rx={cup.rx} />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipId})`}>
        <rect x={cup.x} y={cup.y} width={cup.width} height={cup.height} fill={palette.milk} />
        <path d={teaPath} fill={palette.tea} />
        {pearls.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={PEARL_COLOR} />
        ))}
      </g>

      {/* Cup outline */}
      <rect
        x={cup.x}
        y={cup.y}
        width={cup.width}
        height={cup.height}
        rx={cup.rx}
        fill="none"
        stroke={palette.accent}
        strokeWidth="3"
        opacity="0.35"
      />

      {/* Lid */}
      <rect x={cup.x - 8} y={cup.y - 10} width={cup.width + 16} height="14" rx="7" fill={palette.accent} opacity="0.85" />
    </svg>
  )
}

export default function ShopTile({ id, imageUrl, alt, className, aspectClassName, sizes, priority }: ShopTileProps) {
  return (
    <div className={`relative ${aspectClassName ?? 'aspect-[4/3]'} overflow-hidden rounded-media ${className ?? ''}`}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes ?? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
          className="object-cover"
        />
      ) : (
        <GeneratedTile id={id} />
      )}
    </div>
  )
}
