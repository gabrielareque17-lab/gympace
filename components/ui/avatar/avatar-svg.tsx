import { getAvatarById } from '@/lib/avatar-registry'

interface AvatarSVGProps {
  avatarId: string
  accentColor: string
  secondaryColor?: string
  size?: number
  className?: string
}

function hashAvatar(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
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
  const visorTilt = [-5, 0, 5][h % 3]
  const hair = h % 4
  const jaw = h % 3
  const shoulderWide = category === 'gym' || category === 'premium'
  const isHybrid = category === 'hybrid'
  const isPremium = category === 'premium'
  const isFemale = definition?.female === true

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
        <radialGradient id={`${uid}-bg`} cx="50%" cy="35%" r="68%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.24" />
          <stop offset="46%" stopColor={secondary} stopOpacity={isHybrid ? '0.16' : '0.08'} />
          <stop offset="100%" stopColor="#050505" stopOpacity="0.98" />
        </radialGradient>
        <linearGradient id={`${uid}-skin`} x1="26" y1="18" x2="70" y2="78">
          <stop stopColor="#2A2A2A" />
          <stop offset="1" stopColor="#0F0F0F" />
        </linearGradient>
        <linearGradient id={`${uid}-visor`} x1="23" y1="41" x2="73" y2="41">
          <stop stopColor={accent} />
          <stop offset="1" stopColor={secondary} />
        </linearGradient>
        <linearGradient id={`${uid}-suit`} x1="20" y1="62" x2="76" y2="92">
          <stop stopColor={category === 'running' ? '#111A0D' : category === 'gym' ? '#160E20' : '#101010'} />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="4" y="4" width="88" height="88" rx="26" fill={`url(#${uid}-bg)`} />
      <path d="M17 73C20 58 30 50 48 50C66 50 76 58 79 73V89H17V73Z" fill={`url(#${uid}-suit)`} />
      <path
        d={shoulderWide ? 'M13 86C17 66 28 58 48 58C68 58 79 66 83 86' : 'M19 86C23 68 33 59 48 59C63 59 73 68 77 86'}
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="2"
        strokeLinecap="round"
      />

      {isFemale && (
        <>
          <path d="M34 17C27 29 22 47 24 67C27 73 34 77 39 75C36 58 33 37 34 17Z" fill="#050505" />
          <path d="M62 17C69 29 74 47 72 67C69 73 62 77 57 75C60 58 63 37 62 17Z" fill="#050505" />
        </>
      )}

      <path
        d={jaw === 0
          ? 'M29 31C31 20 38 14 48 14C58 14 65 20 67 31L64 49C62 60 56 66 48 66C40 66 34 60 32 49L29 31Z'
          : jaw === 1
          ? 'M30 30C33 19 39 14 48 14C57 14 63 19 66 30L64 50C61 60 56 65 48 65C40 65 35 60 32 50L30 30Z'
          : 'M28 32C31 20 38 15 48 15C58 15 65 20 68 32L63 52C60 61 55 66 48 66C41 66 36 61 33 52L28 32Z'}
        fill={`url(#${uid}-skin)`}
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1.5"
      />

      {isFemale ? (
        <path d="M27 28C32 13 50 8 66 24C54 17 41 17 30 23Z" fill="#050505" />
      ) : (
        <>
          {hair === 0 && <path d="M30 31C35 17 46 11 63 22C57 18 48 19 39 25C35 27 32 29 30 31Z" fill="#050505" />}
          {hair === 1 && <path d="M30 29C36 15 51 10 66 27C55 22 43 22 30 29Z" fill="#050505" />}
          {hair === 2 && <path d="M29 32C30 20 38 13 49 13C58 13 65 19 67 31C56 25 43 24 29 32Z" fill="#050505" />}
          {hair === 3 && <path d="M33 27C39 15 52 13 63 24C54 21 45 22 33 27Z" fill="#050505" />}
        </>
      )}

      <g transform={`rotate(${visorTilt} 48 40)`} filter={`url(#${uid}-glow)`}>
        <path
          d="M26 38C32 34 40 32 48 32C56 32 64 34 70 38L67 45C55 48 41 48 29 45L26 38Z"
          fill={`url(#${uid}-visor)`}
          fillOpacity="0.9"
        />
        <path d="M31 40H65" stroke="#050505" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
        <path d="M33 37C42 35 54 35 63 37" stroke="white" strokeOpacity="0.28" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      <path d="M38 56C42 59 54 59 58 56" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 67L48 77L54 67" stroke={accent} strokeOpacity="0.55" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M24 75H38M58 75H72" stroke={secondary} strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />

      {category === 'running' && (
        <g filter={`url(#${uid}-glow)`}>
          <path d="M12 34H23M9 43H20M13 52H23" stroke={accent} strokeOpacity="0.38" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {category === 'gym' && (
        <g filter={`url(#${uid}-glow)`}>
          <rect x="18" y="23" width="60" height="4" rx="2" fill={accent} fillOpacity="0.5" />
          <rect x="14" y="19" width="5" height="12" rx="2" fill={secondary} fillOpacity="0.45" />
          <rect x="77" y="19" width="5" height="12" rx="2" fill={secondary} fillOpacity="0.45" />
        </g>
      )}
      {isHybrid && (
        <g filter={`url(#${uid}-glow)`}>
          <path d="M15 32H26M70 24L80 34M75 21L83 29" stroke={accent} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 51H23M72 51H82" stroke={secondary} strokeOpacity="0.35" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {isPremium && (
        <g filter={`url(#${uid}-glow)`}>
          <path d="M34 17L40 8L48 16L56 8L62 17" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M24 78C31 83 39 86 48 86C57 86 65 83 72 78" stroke={accent} strokeOpacity="0.42" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
      {rarity !== 'core' && (
        <path
          d="M13 18C22 10 34 6 48 6C62 6 74 10 83 18"
          stroke={rarity === 'legendary' || rarity === 'seasonal' ? '#FACC15' : secondary}
          strokeOpacity="0.34"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )}
    </svg>
  )
}
