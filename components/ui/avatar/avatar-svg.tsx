interface AvatarSVGProps {
  avatarId: string
  accentColor: string
  size?: number
  className?: string
}

export function AvatarSVG({ avatarId, accentColor, size = 64, className }: AvatarSVGProps) {
  const props = {
    viewBox: '0 0 64 80',
    width: size,
    height: Math.round(size * 1.25),
    fill: 'none',
    className,
  }

  switch (avatarId) {
    case 'runner-v1':
      return <RunnerSVG {...props} accent={accentColor} />
    case 'gym-v1':
      return <GymSVG {...props} accent={accentColor} />
    case 'hybrid-v1':
      return <HybridSVG {...props} accent={accentColor} />
    case 'power-v1':
      return <PowerSVG {...props} accent={accentColor} />
    default:
      return <DefaultSVG {...props} accent={accentColor} />
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

/* ── Runner: mid-stride, leaning forward ── */
function RunnerSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Speed lines */}
      <line x1="6" y1="38" x2="14" y2="38" stroke={accent} strokeWidth="1.5" strokeOpacity="0.4" strokeLinecap="round" />
      <line x1="8" y1="44" x2="14" y2="44" stroke={accent} strokeWidth="1.5" strokeOpacity="0.3" strokeLinecap="round" />
      <line x1="10" y1="50" x2="14" y2="50" stroke={accent} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />

      {/* Whole figure group — leaning forward */}
      <g transform="rotate(-10, 32, 44)">
        {/* Head */}
        <circle cx="34" cy="11" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />

        {/* Torso */}
        <polygon points="30,19 38,19 36,39 28,39" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

        {/* Left arm — punching forward */}
        <rect
          x="33" y="22" width="5" height="14" rx="2.5"
          fill={bodyFill} stroke={accent} strokeWidth="1.2"
          transform="rotate(30, 33, 22)"
        />

        {/* Right arm — swinging back */}
        <rect
          x="26" y="22" width="5" height="14" rx="2.5"
          fill={bodyFill} stroke={bodyStroke} strokeWidth="1"
          transform="rotate(-38, 31, 22)"
        />

        {/* Left leg — forward stride */}
        <rect
          x="29" y="39" width="6" height="20" rx="3"
          fill={bodyFill} stroke={accent} strokeWidth="1.2"
          transform="rotate(18, 32, 39)"
        />

        {/* Right leg — back stride */}
        <rect
          x="29" y="39" width="6" height="20" rx="3"
          fill={bodyFill} stroke={bodyStroke} strokeWidth="1"
          transform="rotate(-22, 32, 39)"
        />
      </g>

      {/* Ground foot accent */}
      <ellipse cx="42" cy="73" rx="5" ry="2" fill={accent} fillOpacity="0.7" />
    </svg>
  )
}

/* ── Gym Rat: barbell overhead press ── */
function GymSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Barbell */}
      <rect x="8" y="5" width="48" height="4" rx="2" fill={accent} />
      {/* Left plate */}
      <rect x="6" y="2" width="5" height="10" rx="1.5" fill={accent} fillOpacity="0.6" />
      {/* Right plate */}
      <rect x="53" y="2" width="5" height="10" rx="1.5" fill={accent} fillOpacity="0.6" />

      {/* Head */}
      <circle cx="32" cy="17" r="7" fill={bodyFill} stroke={accent} strokeWidth="1.5" />

      {/* Torso — wide shoulders */}
      <polygon points="18,26 46,26 43,50 21,50" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Left arm — raised to barbell */}
      <rect
        x="10" y="10" width="6" height="18" rx="3"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(12, 13, 10)"
      />

      {/* Right arm — raised to barbell */}
      <rect
        x="48" y="10" width="6" height="18" rx="3"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(-12, 51, 10)"
      />

      {/* Left leg */}
      <rect x="21" y="50" width="8" height="22" rx="4" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />
      {/* Right leg */}
      <rect x="35" y="50" width="8" height="22" rx="4" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Feet */}
      <ellipse cx="25" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
      <ellipse cx="39" cy="73" rx="6" ry="2" fill={accent} fillOpacity="0.5" />
    </svg>
  )
}

/* ── Hybrid Athlete: box jump, airborne ── */
function HybridSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Head */}
      <circle cx="32" cy="9" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />

      {/* Torso */}
      <polygon points="27,17 37,17 35,35 29,35" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Left arm — raised in V */}
      <rect
        x="20" y="20" width="5" height="15" rx="2.5"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(-48, 25, 20)"
      />

      {/* Right arm — raised in V */}
      <rect
        x="39" y="20" width="5" height="15" rx="2.5"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(48, 39, 20)"
      />

      {/* Left leg — tucked up */}
      <rect
        x="23" y="35" width="6" height="17" rx="3"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(-42, 26, 35)"
      />

      {/* Right leg — tucked up */}
      <rect
        x="35" y="35" width="6" height="17" rx="3"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(42, 38, 35)"
      />

      {/* Box below */}
      <rect x="14" y="66" width="36" height="9" rx="3" fill={accent} fillOpacity="0.15" stroke={accent} strokeWidth="1" strokeOpacity="0.4" />

      {/* Altitude dashes */}
      <line x1="24" y1="58" x2="24" y2="65" stroke={accent} strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 2" strokeLinecap="round" />
      <line x1="40" y1="58" x2="40" y2="65" stroke={accent} strokeWidth="1.2" strokeOpacity="0.3" strokeDasharray="2 2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Power Athlete: deadlift hip hinge ── */
function PowerSVG({ accent, ...svg }: SVGBaseProps) {
  return (
    <svg {...svg}>
      {/* Head — forward and lower (bent) */}
      <circle cx="18" cy="18" r="6.5" fill={bodyFill} stroke={accent} strokeWidth="1.5" />

      {/* Back — long diagonal from hip to shoulder */}
      <polygon points="14,24 24,24 36,46 26,46" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Left arm */}
      <rect
        x="16" y="28" width="5" height="22" rx="2.5"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(15, 18, 28)"
      />

      {/* Right arm */}
      <rect
        x="25" y="28" width="5" height="22" rx="2.5"
        fill={bodyFill} stroke={accent} strokeWidth="1.2"
        transform="rotate(8, 27, 28)"
      />

      {/* Bar */}
      <rect x="10" y="56" width="44" height="5" rx="2.5" fill={accent} />
      {/* Left plate */}
      <rect x="7" y="52" width="5" height="13" rx="1.5" fill={accent} fillOpacity="0.6" />
      {/* Right plate */}
      <rect x="52" y="52" width="5" height="13" rx="1.5" fill={accent} fillOpacity="0.6" />

      {/* Upper left leg */}
      <rect
        x="28" y="46" width="7" height="17" rx="3.5"
        fill={bodyFill} stroke={bodyStroke} strokeWidth="1"
        transform="rotate(-20, 31, 46)"
      />

      {/* Lower left leg — vertical from knee */}
      <rect x="26" y="59" width="7" height="16" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Upper right leg */}
      <rect
        x="38" y="46" width="7" height="17" rx="3.5"
        fill={bodyFill} stroke={bodyStroke} strokeWidth="1"
        transform="rotate(20, 41, 46)"
      />

      {/* Lower right leg */}
      <rect x="38" y="59" width="7" height="16" rx="3.5" fill={bodyFill} stroke={bodyStroke} strokeWidth="1" />

      {/* Knee accent dots */}
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
