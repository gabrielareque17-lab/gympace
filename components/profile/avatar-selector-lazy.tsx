"use client";

import dynamic from "next/dynamic";

const AvatarSelectorDynamic = dynamic(
  () => import("@/components/ui/avatar/avatar-selector").then((m) => ({ default: m.AvatarSelector })),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-2xl bg-white/[0.04]" />,
  }
);

export function AvatarSelectorLazy({ initialAvatarId }: { initialAvatarId: string | null }) {
  return <AvatarSelectorDynamic initialAvatarId={initialAvatarId} />;
}
