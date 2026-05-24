import { getAvatarById, type AvatarDefinition } from '@/lib/avatar-registry'

interface AvatarSVGProps {
  avatarId: string
  accentColor: string
  secondaryColor?: string
  size?: number
  className?: string
  definition?: AvatarDefinition | null
}

const SKIN_TONES = ['#FFD0A8', '#E8AD7C', '#B97952', '#7A4632', '#F2C8B8']
const HAIR_COLORS = ['#171717', '#4A2D22', '#7C3F24', '#D7A64A', '#ECE2D0']

function hashAvatar(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
}

function getFeature(hash: number, modulo: number, offset = 0) {
  return Math.abs(hash + offset) % modulo
}

export function AvatarSVG({
  avatarId,
  accentColor,
  secondaryColor,
  size = 64,
  className,
  definition: definitionOverride,
}: AvatarSVGProps) {
  const definition = definitionOverride ?? getAvatarById(avatarId)
  const category = definition?.category ?? 'running'
  const rarity = definition?.rarity ?? 'core'
  const customVisual = definition?.customVisual
  const accent = customVisual?.primaryColor ?? accentColor
  const secondary = secondaryColor ?? definition?.secondaryColor ?? accentColor
  const backgroundColor = customVisual?.backgroundColor ?? '#050505'
  const outfitColor = customVisual?.outfitColor ?? accent
  const h = hashAvatar(avatarId)
  const uid = avatarId.replace(/[^a-z0-9_-]/gi, '-')
  const skin = SKIN_TONES[getFeature(h, SKIN_TONES.length, 7)]
  const hairColor = customVisual?.hairColor ?? HAIR_COLORS[getFeature(h, HAIR_COLORS.length, 19)]
  const hairStyle = customVisual?.hairStyle ?? String(getFeature(h, 4, 31))
  const mouthStyle = customVisual?.faceStyle ?? String(getFeature(h, 3, 43))
  const faceToEye: Record<string, string> = { confiante: '1', feliz: '1', serio: '0', focado: '2' }
  const eyeStyle = customVisual?.faceStyle
    ? (faceToEye[customVisual.faceStyle] ?? String(getFeature(h, 3, 59)))
    : String(getFeature(h, 3, 59))
  const isFeminine = definition?.female === true || customVisual?.gender === 'feminino'
  const isHybrid = category === 'hybrid'
  const isPremium = category === 'premium'
  const isGym = category === 'gym' || isPremium
  const bodyWide = isGym ? 5 : 0
  const accessory = customVisual?.accessory ?? 'none'

  const isNamedHair = ['curto','topete','raspado','moicano','careca','medio','afro','rabo','ondulado','longo','cacheado'].includes(hairStyle)
  const hairEl = (() => {
    if (hairStyle === 'careca') return null
    if (hairStyle === 'afro') return (
      <g>
        <path d="M11 52C11 21 27 4 48 4C69 4 85 21 85 52C72 41 48 34 24 41Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === 'cacheado') return (
      <g>
        <path d="M17 44C17 21 30 7 48 7C66 7 79 21 79 44C65 34 31 34 17 44Z" fill={hairColor} />
        <path d="M17 44C11 57 13 71 23 79C21 67 19 55 17 46Z" fill={hairColor} />
        <path d="M79 44C85 57 83 71 73 79C75 67 77 55 79 46Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === 'longo' || (isFeminine && !isNamedHair)) return (
      <g>
        <path d="M22 41C24 22 36 10 48 10C60 10 72 22 74 41C61 32 35 32 22 41Z" fill={hairColor} />
        <path d="M22 41C18 53 19 67 28 76C30 64 28 52 25 42Z" fill={hairColor} />
        <path d="M74 41C78 53 77 67 68 76C66 64 68 52 71 42Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === 'ondulado') return (
      <g>
        <path d="M20 41C20 23 32 10 48 10C64 10 76 23 76 41C62 35 34 35 20 41Z" fill={hairColor} />
        <path d="M20 41C14 56 13 72 21 82C24 76 22 61 22 44Z" fill={hairColor} />
        <path d="M76 41C82 56 83 72 75 82C72 76 74 61 74 44Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === 'medio') return (
      <g>
        <path d="M20 41C20 23 32 10 48 10C64 10 76 23 76 41C62 35 34 35 20 41Z" fill={hairColor} />
        <path d="M20 41C15 52 16 64 24 72C26 64 24 53 22 43Z" fill={hairColor} />
        <path d="M76 41C81 52 80 64 72 72C70 64 72 53 74 43Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === 'rabo') return (
      <g>
        <path d="M22 41C22 24 33 11 48 11C63 11 74 24 74 41C62 36 34 36 22 41Z" fill={hairColor} />
        <path d="M44 68C42 80 42 90 48 91C54 90 54 80 52 68C50 72 46 72 44 68Z" fill={hairColor} />
      </g>
    )
    if (hairStyle === '1' || hairStyle === 'topete') return (
      <g>
        <path d="M21 42C21 24 33 10 48 10C63 10 75 24 75 42C61 36 35 36 21 42Z" fill={hairColor} />
        <path d="M37 10C35 2 43 1 48 1C53 1 61 2 59 10" fill={hairColor} />
      </g>
    )
    if (hairStyle === '2' || hairStyle === 'raspado') return (
      <path d="M20 43C20 25 32 11 48 11C64 11 76 25 76 43C62 37 34 37 20 43Z" fill={hairColor} />
    )
    if (hairStyle === '3' || hairStyle === 'moicano') return (
      <path d="M42 42C41 25 44 11 48 11C52 11 55 25 54 42C52 37 44 37 42 42Z" fill={hairColor} />
    )
    // '0' / 'curto' / default
    return <path d="M21 42C21 24 33 10 48 10C63 10 75 24 75 42C61 36 35 36 21 42Z" fill={hairColor} />
  })()

  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`${uid}-bg`} cx="50%" cy="30%" r="76%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.26" />
          <stop offset="45%" stopColor={secondary} stopOpacity={isHybrid ? '0.18' : '0.1'} />
          <stop offset="100%" stopColor={backgroundColor} stopOpacity="0.98" />
        </radialGradient>
        <linearGradient id={`${uid}-body`} x1="20" y1="58" x2="78" y2="92">
          <stop stopColor={outfitColor} stopOpacity="0.92" />
          <stop offset="1" stopColor={secondary} stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={`${uid}-face`} x1="28" y1="22" x2="68" y2="69">
          <stop stopColor={skin} />
          <stop offset="1" stopColor="#D99168" />
        </linearGradient>
        <filter id={`${uid}-soft-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="4" y="4" width="88" height="88" rx="28" fill={`url(#${uid}-bg)`} />

      <g filter={`url(#${uid}-soft-glow)`}>
        <path
          d={`M${19 - bodyWide} 90C${20 - bodyWide} 70 31 59 48 59C65 59 ${76 + bodyWide} 70 ${77 + bodyWide} 90H${19 - bodyWide}Z`}
          fill={`url(#${uid}-body)`}
          fillOpacity="0.82"
        />
        <path
          d="M33 66C37 74 41 80 48 86C55 80 59 74 63 66"
          stroke="#050505"
          strokeOpacity="0.34"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M29 78H39M57 78H67"
          stroke="white"
          strokeOpacity="0.34"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {isGym && (
        <g opacity="0.78">
          <rect x="16" y="22" width="64" height="4" rx="2" fill={accent} />
          <rect x="11" y="18" width="6" height="12" rx="2" fill={secondary} />
          <rect x="79" y="18" width="6" height="12" rx="2" fill={secondary} />
        </g>
      )}

      {category === 'running' && (
        <g opacity="0.72">
          <path d="M11 36H23M8 46H19M13 56H24" stroke={accent} strokeWidth="2.4" strokeLinecap="round" />
          <path d="M73 58C79 56 83 53 86 49" stroke={secondary} strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      <path
        d="M48 13C58 13 67 18 70 27C76 31 79 38 79 46C79 62 67 73 48 73C29 73 17 62 17 46C17 38 20 31 26 27C29 18 38 13 48 13Z"
        fill={`url(#${uid}-face)`}
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1.6"
      />

      <path
        d="M22 45C17 44 14 47 14 51C14 55 17 58 22 57"
        fill={skin}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.3"
      />
      <path
        d="M74 45C79 44 82 47 82 51C82 55 79 58 74 57"
        fill={skin}
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.3"
      />

      {hairEl}

      <path
        d="M27 36C36 31 59 31 69 36"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {eyeStyle === '0' && (
        <>
          <circle cx="38" cy="47" r="3.2" fill="#101010" />
          <circle cx="58" cy="47" r="3.2" fill="#101010" />
          <circle cx="39" cy="46" r="0.9" fill="white" fillOpacity="0.78" />
          <circle cx="59" cy="46" r="0.9" fill="white" fillOpacity="0.78" />
        </>
      )}
      {eyeStyle === '1' && (
        <>
          <path d="M35 47C37 44 41 44 43 47" stroke="#101010" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M53 47C55 44 59 44 61 47" stroke="#101010" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {eyeStyle === '2' && (
        <>
          <rect x="34" y="44" width="9" height="6" rx="3" fill="#101010" />
          <rect x="53" y="44" width="9" height="6" rx="3" fill="#101010" />
          <path d="M43 47H53" stroke="#101010" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}

      <path
        d="M48 49.5C46.5 52 46.2 54 48 55.4"
        stroke="#8A4D37"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {(mouthStyle === '0' || mouthStyle === 'confiante' || mouthStyle === 'sorriso') && <path d="M39 60C43 64 53 64 57 60" stroke="#101010" strokeWidth="2.2" strokeLinecap="round" />}
      {(mouthStyle === '1' || mouthStyle === 'serio' || mouthStyle === 'focado') && <path d="M41 61C45 63 51 63 55 61" stroke="#101010" strokeWidth="2" strokeLinecap="round" />}
      {(mouthStyle === '2' || mouthStyle === 'feliz') && <path d="M41 60C44 66 52 66 55 60" fill="#101010" fillOpacity="0.92" />}

      <path
        d="M35 39C39 37 43 37 45 39M51 39C55 37 59 37 63 39"
        stroke={hairColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.62"
      />

      {isHybrid && (
        <g filter={`url(#${uid}-soft-glow)`}>
          <path d="M73 20L76 26L82 29L76 32L73 38L70 32L64 29L70 26L73 20Z" fill={secondary} fillOpacity="0.86" />
          <path d="M18 23L20 27L24 29L20 31L18 35L16 31L12 29L16 27L18 23Z" fill={accent} fillOpacity="0.72" />
        </g>
      )}

      {isPremium && (
        <g filter={`url(#${uid}-soft-glow)`}>
          <path
            d="M35 18L40 10L48 18L56 10L61 18L58 24H38L35 18Z"
            fill="#FACC15"
            fillOpacity="0.92"
            stroke="#FFF7A8"
            strokeOpacity="0.5"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </g>
      )}

      {accessory === 'bone' && (
        <path d="M25 34C34 22 55 20 69 31L68 36C56 31 40 30 25 38V34Z" fill={secondary} fillOpacity="0.92" />
      )}

      {accessory === 'headphone' && (
        <g>
          <path d="M25 43C25 28 34 18 48 18C62 18 71 28 71 43" stroke={secondary} strokeWidth="3" strokeLinecap="round" />
          <rect x="18" y="43" width="8" height="14" rx="4" fill={secondary} />
          <rect x="70" y="43" width="8" height="14" rx="4" fill={secondary} />
        </g>
      )}

      {accessory === 'oculos' && (
        <path d="M31 46H45M51 46H65M45 46H51" stroke={secondary} strokeWidth="2.2" strokeLinecap="round" />
      )}

      {rarity !== 'core' && (
        <path
          d="M16 18C24 10 35 6 48 6C61 6 72 10 80 18"
          stroke={rarity === 'legendary' || rarity === 'seasonal' ? '#FACC15' : secondary}
          strokeOpacity="0.38"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
