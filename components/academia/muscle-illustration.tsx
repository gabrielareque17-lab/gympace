"use client";

// viewBox: 0 0 44 58
// Head: cy=7 r=5 | Neck: y=12 | Arms: x=6.5/31 y=15 | Torso: x=13 y=15 | Legs: y=40

const DIM = "rgba(255,255,255,0.07)";
const STROKE = "rgba(255,255,255,0.10)";

function Body() {
  return (
    <g fill={DIM} stroke={STROKE} strokeWidth="0.6">
      <circle cx="22" cy="7" r="5" />
      <rect x="20.5" y="12" width="3" height="3" rx="1.2" />
      <rect x="6.5" y="15" width="6.5" height="21" rx="3" />
      <rect x="31" y="15" width="6.5" height="21" rx="3" />
      <rect x="13" y="15" width="18" height="25" rx="3" />
      <rect x="13" y="40" width="8.5" height="17" rx="3" />
      <rect x="22.5" y="40" width="8.5" height="17" rx="3" />
    </g>
  );
}

type H = { color: string; alpha: number };

function Peito({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <ellipse cx="17.5" cy="23" rx="4.8" ry="5.5" />
      <ellipse cx="26.5" cy="23" rx="4.8" ry="5.5" />
    </g>
  );
}

function Costas({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <ellipse cx="22" cy="17.5" rx="8.5" ry="4" />
      <ellipse cx="14" cy="28" rx="4" ry="8" />
      <ellipse cx="30" cy="28" rx="4" ry="8" />
    </g>
  );
}

function Ombros({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <circle cx="9.75" cy="18" r="5.5" />
      <circle cx="34.25" cy="18" r="5.5" />
    </g>
  );
}

function Bracos({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <ellipse cx="9.75" cy="26" rx="3.5" ry="6" />
      <ellipse cx="34.25" cy="26" rx="3.5" ry="6" />
    </g>
  );
}

function Abdomen({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <rect x="16" y="26" width="5" height="4" rx="1.5" />
      <rect x="23" y="26" width="5" height="4" rx="1.5" />
      <rect x="16" y="31.5" width="5" height="4" rx="1.5" />
      <rect x="23" y="31.5" width="5" height="4" rx="1.5" />
      <rect x="16" y="37" width="5" height="4" rx="1.5" />
      <rect x="23" y="37" width="5" height="4" rx="1.5" />
    </g>
  );
}

function Pernas({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha}>
      <rect x="13" y="40" width="8.5" height="13" rx="3" />
      <rect x="22.5" y="40" width="8.5" height="13" rx="3" />
    </g>
  );
}

function FullBody({ color, alpha }: H) {
  return (
    <g fill={color} opacity={alpha * 0.65}>
      <circle cx="22" cy="7" r="5" />
      <rect x="6.5" y="15" width="6.5" height="21" rx="3" />
      <rect x="31" y="15" width="6.5" height="21" rx="3" />
      <rect x="13" y="15" width="18" height="25" rx="3" />
      <rect x="13" y="40" width="8.5" height="17" rx="3" />
      <rect x="22.5" y="40" width="8.5" height="17" rx="3" />
    </g>
  );
}

const HIGHLIGHTS: Record<string, React.ComponentType<H>> = {
  peito: Peito,
  costas: Costas,
  ombros: Ombros,
  bracos: Bracos,
  abdomen: Abdomen,
  pernas: Pernas,
  "full-body": FullBody,
};

export function MuscleIllustration({
  group,
  color,
  active,
}: {
  group: string;
  color: string;
  active: boolean;
}) {
  const alpha = active ? 0.88 : 0.22;
  const Highlight = HIGHLIGHTS[group] ?? FullBody;

  return (
    <svg
      viewBox="0 0 44 58"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <Body />
      <Highlight color={color} alpha={alpha} />
    </svg>
  );
}
