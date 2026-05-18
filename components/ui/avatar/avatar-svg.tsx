interface AvatarSVGProps {
  avatarId: string
  accentColor: string
  size?: number
  className?: string
}

// Maps each avatar ID to a [category, variant] key for SVG routing
const AVATAR_SVG_KEY: Record<string, string> = {
  // Legacy
  'runner-v1':      'runner-1',
  'gym-v1':         'gym-1',
  'hybrid-v1':      'hybrid-1',
  'power-v1':       'power',
  // Corrida
  'runner-sprint':   'runner-1',
  'runner-night':    'runner-1',
  'runner-marathon': 'runner-2',
  'runner-elite':    'runner-2',
  'runner-speed':    'runner-2',
  'runner-trail':    'runner-3',
  'runner-endurance':'runner-3',
  // Academia
  'gym-bodybuilder': 'gym-1',
  'gym-strong':      'gym-1',
  'gym-iron':        'gym-1',
  'gym-powerlifting':'gym-2',
  'gym-hypertrophy': 'gym-2',
  'gym-hardcore':    'gym-2',
  'gym-calistenia':  'gym-3',
  // Híbrido
  'hybrid-functional':  'hybrid-1',
  'hybrid-pro':         'hybrid-1',
  'hybrid-cross':       'hybrid-2',
  'hybrid-endurance':   'hybrid-2',
  'hybrid-performance': 'hybrid-2',
  'hybrid-mobility':    'hybrid-3',
  'hybrid-tactical':    'hybrid-3',
}

export function AvatarSVG({ avatarId, accentColor, size = 64, className }: AvatarSVGProps) {
  const props = {
    viewBox: '0 0 64 80',
    width: size,
    height: Math.round(size * 1.25),
    fill: 'none',
    className,
  }
  const key = AVATAR_SVG_KEY[avatarId] ?? 'default'
  const accent = accentColor

  switch (key) {
    case 'runner-1': return <RunnerSVG {...props} accent={accent} />
    case 'runner-2': return <RunnerMarathonSVG {...props} accent={accent} />
    case 'runner-3': return <RunnerTrailSVG {...props} accent={accent} />
    case 'gym-1':    return <GymSVG {...props} accent={accent} />
    case 'gym-2':    return <GymSquatSVG {...props} accent={accent} />
    case 'gym-3':    return <GymCalisteniaSVG {...props} accent={accent} />
    case 'hybrid-1': return <HybridSVG {...props} accent={accent} />
    case 'hybrid-2': return <HybridFunctionalSVG {...props} accent={accent} />
    case 'hybrid-3': return <HybridMobilitySVG {...props} accent={accent} />
    case 'power':    return <PowerSVG {...props} accent={accent} />
    default:         return <DefaultSVG {...props} accent={accent} />
  }
}

interface SVGBaseProps {
  viewBox: string
  width: number
  height: number
  fill: string
  className?: string
  accent: string
}

const bodyFill = 'rgba(255,255,255,0.08)'
const bodyStroke = 'rgba(255,255,255,0.18)'

/* ── Runner 1: mid-stride, forward lean (Sprint / Night / legacy) ── */
function RunnerSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      <line x1="6" y1="38" x2="14" y2="38" stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="8" y1="44" x2="14" y2="44" stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
      <line x1="10" y1="50" x2="14" y2="50" stroke={accent} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
      <g transform="rotate(-10, 32, 44)">
        <circle cx="34" cy="11" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
        <polygon points="30,19 38,19 36,39 28,39" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
        <rect x="33" y="22" width="5" height="14" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(30, 33, 22)" />
        <rect x="26" y="22" width="5" height="14" rx="2.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-38, 31, 22)" />
        <rect x="29" y="39" width="6" height="20" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(18, 32, 39)" />
        <rect x="29" y="39" width="6" height="20" rx="3" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-22, 32, 39)" />
      </g>
      <ellipse cx="42" cy="73" rx="5" ry="2" fill={accent} fillOpacity="0.7" />
    </svg>
  )
}

/* ── Runner 2: marathon, upright, efficient (Marathon / Elite / Speed) ── */
function RunnerMarathonSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Subtle pace dot */}
      <circle cx="9" cy="44" r="2" fill={accent} fillOpacity="0.35" />
      {/* Upright group — slight lean */}
      <g transform="rotate(-6, 32, 40)">
        <circle cx="32" cy="11" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
        <polygon points="27,19 37,19 35,41 29,41" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
        {/* Left arm — compact forward swing */}
        <rect x="21" y="21" width="5" height="13" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-40, 23, 21)" />
        {/* Right arm — compact back swing */}
        <rect x="36" y="21" width="5" height="13" rx="2.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(35, 38, 21)" />
        {/* Left leg — extended forward stride */}
        <rect x="26" y="41" width="7" height="24" rx="3.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(24, 29, 41)" />
        {/* Right leg — extended back push */}
        <rect x="29" y="41" width="7" height="24" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-22, 33, 41)" />
      </g>
      <ellipse cx="38" cy="73" rx="5" ry="1.5" fill={accent} fillOpacity="0.6" />
    </svg>
  )
}

/* ── Runner 3: trail, low stance, arms wide (Trail / Endurance) ── */
function RunnerTrailSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Terrain rocks */}
      <circle cx="16" cy="68" r="2.5" fill={accent} fillOpacity="0.18" />
      <circle cx="24" cy="70" r="1.5" fill={accent} fillOpacity="0.14" />
      <circle cx="48" cy="71" r="2" fill={accent} fillOpacity="0.18" />
      {/* Slope line */}
      <line x1="8" y1="70" x2="56" y2="64" stroke={accent} strokeWidth="1.2" strokeOpacity="0.18" strokeLinecap="round" />
      {/* Strong forward lean */}
      <g transform="rotate(-18, 32, 38)">
        <circle cx="34" cy="10" r="6" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
        <polygon points="28,17 38,17 36,35 26,35" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
        {/* Left arm — wide out for balance */}
        <rect x="13" y="18" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-68, 15, 18)" />
        {/* Right arm — wide back */}
        <rect x="39" y="18" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(62, 41, 18)" />
        {/* Left leg — bent knee, short stride */}
        <rect x="24" y="35" width="6" height="17" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(28, 27, 35)" />
        {/* Right leg — back push */}
        <rect x="28" y="35" width="6" height="17" rx="3" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-16, 31, 35)" />
      </g>
      <ellipse cx="46" cy="67" rx="4.5" ry="1.5" fill={accent} fillOpacity="0.65" />
    </svg>
  )
}

/* ── Gym 1: barbell overhead press (Bodybuilder / Strong / Iron / legacy) ── */
function GymSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      <rect x="8" y="5" width="48" height="4" rx="2" fill={accent} />
      <rect x="6" y="2" width="5" height="10" rx="1.5" fill={accent} fillOpacity="0.6" />
      <rect x="53" y="2" width="5" height="10" rx="1.5" fill={accent} fillOpacity="0.6" />
      <circle cx="32" cy="17" r="7" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      <polygon points="18,26 46,26 43,50 21,50" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="10" y="10" width="6" height="18" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(12, 13, 10)" />
      <rect x="48" y="10" width="6" height="18" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-12, 51, 10)" />
      <rect x="21" y="50" width="8" height="22" rx="4" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="35" y="50" width="8" height="22" rx="4" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <ellipse cx="25" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
      <ellipse cx="39" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
    </svg>
  )
}

/* ── Gym 2: barbell squat, wide stance (Powerlifting / Hypertrophy / Hardcore) ── */
function GymSquatSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Barbell on traps */}
      <rect x="8" y="18" width="48" height="4" rx="2" fill={accent} />
      <rect x="5" y="14" width="5" height="12" rx="1.5" fill={accent} fillOpacity="0.6" />
      <rect x="54" y="14" width="5" height="12" rx="1.5" fill={accent} fillOpacity="0.6" />
      {/* Head — braced forward */}
      <circle cx="32" cy="9" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      {/* Arms gripping bar */}
      <rect x="10" y="18" width="5" height="13" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-25, 12, 18)" />
      <rect x="49" y="18" width="5" height="13" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(25, 51, 18)" />
      {/* Torso */}
      <polygon points="21,22 43,22 40,44 24,44" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      {/* Upper legs — wide squat */}
      <rect x="15" y="44" width="9" height="17" rx="4.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-38, 20, 44)" />
      <rect x="40" y="44" width="9" height="17" rx="4.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(38, 44, 44)" />
      {/* Lower legs — near vertical */}
      <rect x="8" y="56" width="7" height="16" rx="3.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" />
      <rect x="49" y="56" width="7" height="16" rx="3.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" />
      {/* Feet */}
      <ellipse cx="12" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
      <ellipse cx="52" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
    </svg>
  )
}

/* ── Gym 3: pull-up, bar overhead (Calistenia) ── */
function GymCalisteniaSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Pull-up bar */}
      <rect x="6" y="5" width="52" height="4" rx="2" fill={accent} />
      <rect x="7" y="2" width="4" height="5" rx="1" fill={accent} fillOpacity="0.45" />
      <rect x="53" y="2" width="4" height="5" rx="1" fill={accent} fillOpacity="0.45" />
      {/* Arms gripping bar */}
      <rect x="18" y="9" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-12, 20, 9)" />
      <rect x="41" y="9" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(12, 43, 9)" />
      {/* Head — chin above bar */}
      <circle cx="32" cy="21" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      {/* Torso — hanging */}
      <polygon points="26,28 38,28 36,50 28,50" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      {/* Core tension line */}
      <line x1="32" y1="34" x2="32" y2="44" stroke={accent} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 3" />
      {/* Legs — hanging */}
      <rect x="26" y="50" width="6.5" height="20" rx="3.25" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(8, 29, 50)" />
      <rect x="31" y="50" width="6.5" height="20" rx="3.25" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-6, 34, 50)" />
    </svg>
  )
}

/* ── Hybrid 1: box jump, airborne (Functional / Pro / legacy) ── */
function HybridSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      <circle cx="32" cy="9" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      <polygon points="27,17 37,17 35,35 29,35" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="20" y="20" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-48, 25, 20)" />
      <rect x="39" y="20" width="5" height="15" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(48, 39, 20)" />
      <rect x="23" y="35" width="6" height="17" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-42, 26, 35)" />
      <rect x="35" y="35" width="6" height="17" rx="3" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(42, 38, 35)" />
      <rect x="14" y="66" width="36" height="9" rx="3" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />
      <line x1="24" y1="58" x2="24" y2="65" stroke={accent} strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 2" strokeLinecap="round" />
      <line x1="40" y1="58" x2="40" y2="65" stroke={accent} strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Hybrid 2: kettlebell swing, hip hinge (Cross / Endurance / Performance) ── */
function HybridFunctionalSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Kettlebell */}
      <circle cx="46" cy="14" r="5.5" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="1.5" />
      <rect x="43.5" y="6" width="5" height="4" rx="1.5" fill={accent} fillOpacity="0.5" />
      {/* Motion arc */}
      <path d="M 38 26 Q 52 20 48 9" stroke={accent} strokeWidth="1.2" strokeOpacity="0.28" fill="none" strokeDasharray="3 4" strokeLinecap="round" />
      {/* Head */}
      <circle cx="24" cy="14" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      {/* Torso — slight hip hinge */}
      <polygon points="18,21 30,21 36,40 24,40" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      {/* Right arm — reaching toward kettlebell */}
      <rect x="32" y="33" width="5" height="17" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-38, 34, 33)" />
      {/* Left arm — counterbalance */}
      <rect x="12" y="24" width="5" height="14" rx="2.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(22, 14, 24)" />
      {/* Upper legs */}
      <rect x="20" y="40" width="7.5" height="18" rx="3.75" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-12, 23, 40)" />
      <rect x="30" y="40" width="7.5" height="18" rx="3.75" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(18, 33, 40)" />
      {/* Lower legs — planted */}
      <rect x="15" y="55" width="7" height="16" rx="3.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" />
      <rect x="31" y="55" width="7" height="16" rx="3.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" />
      {/* Feet */}
      <ellipse cx="19" cy="72" rx="5.5" ry="1.8" fill={accent} fillOpacity="0.5" />
      <ellipse cx="35" cy="72" rx="5.5" ry="1.8" fill={accent} fillOpacity="0.5" />
    </svg>
  )
}

/* ── Hybrid 3: warrior lunge, arm raised (Mobility / Tactical) ── */
function HybridMobilitySVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Energy at raised arm tip */}
      <circle cx="48" cy="5" r="4.5" fill={accent} fillOpacity="0.12" />
      <circle cx="48" cy="5" r="2.5" fill={accent} fillOpacity="0.7" />
      {/* Raised arm — extended upward */}
      <rect x="35" y="7" width="5" height="18" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(25, 37, 7)" />
      {/* Head */}
      <circle cx="30" cy="14" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      {/* Torso */}
      <polygon points="24,22 36,22 34,43 26,43" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      {/* Left arm — extended down-back */}
      <rect x="14" y="26" width="5" height="14" rx="2.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(45, 16, 26)" />
      {/* Front leg — bent knee (lunge) */}
      <rect x="20" y="43" width="8" height="19" rx="4" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(-8, 24, 43)" />
      {/* Back leg — extended */}
      <rect x="32" y="43" width="7" height="26" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(20, 35, 43)" />
      {/* Front foot */}
      <ellipse cx="18" cy="63" rx="6.5" ry="2" fill={accent} fillOpacity="0.6" />
      {/* Back foot */}
      <ellipse cx="46" cy="68" rx="5" ry="1.5" fill={accent} fillOpacity="0.35" />
    </svg>
  )
}

/* ── Power Athlete: deadlift hip hinge (legacy) ── */
function PowerSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      <circle cx="18" cy="18" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      <polygon points="14,24 24,24 36,46 26,46" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="16" y="28" width="5" height="22" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(15, 18, 28)" />
      <rect x="25" y="28" width="5" height="22" rx="2.5" fill={bodyFill} stroke={accent} strokeWidth="1.2" transform="rotate(8, 27, 28)" />
      <rect x="10" y="56" width="44" height="5" rx="2.5" fill={accent} />
      <rect x="7" y="52" width="5" height="13" rx="1.5" fill={accent} fillOpacity="0.6" />
      <rect x="52" y="52" width="5" height="13" rx="1.5" fill={accent} fillOpacity="0.6" />
      <rect x="28" y="46" width="7" height="17" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(-20, 31, 46)" />
      <rect x="26" y="59" width="7" height="16" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="38" y="46" width="7" height="17" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" transform="rotate(20, 41, 46)" />
      <rect x="38" y="59" width="7" height="16" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <circle cx="30" cy="62" r="3" fill={accent} fillOpacity="0.45" />
      <circle cx="42" cy="62" r="3" fill={accent} fillOpacity="0.45" />
    </svg>
  )
}

/* ── Default fallback ── */
function DefaultSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      <circle cx="32" cy="11" r="7" fill={bodyFill} stroke={accent} strokeWidth="1.5" />
      <polygon points="26,20 38,20 36,44 28,44" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="25" y="44" width="7" height="22" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <rect x="34" y="44" width="7" height="22" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      <ellipse cx="32" cy="73" rx="7" ry="2.5" fill={accent} fillOpacity="0.5" />
    </svg>
  )
}
