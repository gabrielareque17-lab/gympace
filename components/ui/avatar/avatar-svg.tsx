import { getAvatarById } from '@/lib/avatar-registry'

interface AvatarSVGProps {
  avatarId: string
  accentColor: string
  secondaryColor?: string
  size?: number
  className?: string
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
}: AvatarSVGProps) {
  const definition = getAvatarById(avatarId)
  const category = definition?.category ?? 'running'
  const rarity = definition?.rarity ?? 'core'
  const accent = accentColor
  const secondary = secondaryColor ?? definition?.secondaryColor ?? accentColor
  const h = hashAvatar(avatarId)
  const uid = avatarId.replace(/[^a-z0-9_-]/gi, '-')
  const skin = SKIN_TONES[getFeature(h, SKIN_TONES.length, 7)]
  const hairColor = HAIR_COLORS[getFeature(h, HAIR_COLORS.length, 19)]
  const hairStyle = getFeature(h, 4, 31)
  const mouthStyle = getFeature(h, 3, 43)
  const eyeStyle = getFeature(h, 3, 59)
  const isFeminine = definition?.female === true
  const isHybrid = category === 'hybrid'
  const isPremium = category === 'premium'
  const isGym = category === 'gym' || isPremium
  const bodyWide = isGym ? 5 : 0

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
          <stop offset="100%" stopColor="#050505" stopOpacity="0.98" />
        </radialGradient>
        <linearGradient id={`${uid}-body`} x1="20" y1="58" x2="78" y2="92">
          <stop stopColor={accent} stopOpacity="0.92" />
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

      {isFeminine ? (
        <>
          <path
            d="M25 38C27 21 38 12 49 12C62 12 71 23 72 39C62 29 44 26 25 38Z"
            fill={hairColor}
          />
          <path d="M22 36C19 48 20 65 29 72C31 60 31 47 28 36Z" fill={hairColor} />
          <path d="M68 36C65 47 65 61 67 72C76 65 77 48 74 36Z" fill={hairColor} />
        </>
      ) : (
        <>
          {hairStyle === 0 && <path d="M25 36C28 20 41 11 58 17C54 15 44 22 39 29C34 28 29 31 25 36Z" fill={hairColor} />}
          {hairStyle === 1 && <path d="M25 34C31 17 49 10 66 26C53 22 40 24 25 34Z" fill={hairColor} />}
          {hairStyle === 2 && <path d="M24 37C25 22 36 13 49 13C61 13 70 23 71 36C58 30 42 29 24 37Z" fill={hairColor} />}
          {hairStyle === 3 && <path d="M28 32C35 15 55 14 67 30C55 27 42 27 28 32Z" fill={hairColor} />}
        </>
      )}

      <path
        d="M27 36C36 31 59 31 69 36"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />

      {eyeStyle === 0 && (
        <>
          <circle cx="38" cy="47" r="3.2" fill="#101010" />
          <circle cx="58" cy="47" r="3.2" fill="#101010" />
          <circle cx="39" cy="46" r="0.9" fill="white" fillOpacity="0.78" />
          <circle cx="59" cy="46" r="0.9" fill="white" fillOpacity="0.78" />
        </>
      )}
      {eyeStyle === 1 && (
        <>
          <path d="M35 47C37 44 41 44 43 47" stroke="#101010" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M53 47C55 44 59 44 61 47" stroke="#101010" strokeWidth="2.4" strokeLinecap="round" />
        </>
      )}
      {eyeStyle === 2 && (
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

      {mouthStyle === 0 && <path d="M39 60C43 64 53 64 57 60" stroke="#101010" strokeWidth="2.2" strokeLinecap="round" />}
      {mouthStyle === 1 && <path d="M41 61C45 63 51 63 55 61" stroke="#101010" strokeWidth="2" strokeLinecap="round" />}
      {mouthStyle === 2 && <path d="M41 60C44 66 52 66 55 60" fill="#101010" fillOpacity="0.92" />}

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
