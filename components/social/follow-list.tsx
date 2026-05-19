import Link from "next/link";
import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { FollowButton } from "@/components/social/follow-button";

export type FollowUser = {
  user_id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_id: string | null;
  isFollowingThem: boolean;
  isCurrentUser: boolean;
};

export function FollowList({
  users,
  emptyText,
  showFollowButtons,
}: {
  users: FollowUser[];
  emptyText: string;
  showFollowButtons: boolean;
}) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-[#F5F5F5]/30">{emptyText}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-white/[0.04]">
      {users.map((user) => {
        const displayName = user.display_name || user.username || "Atleta";
        const initials = displayName[0]?.toUpperCase() ?? "?";
        const href = `/perfil/${user.username}`;
        return (
          <li key={user.user_id} className="group/card relative flex items-center gap-3.5 px-5 py-4 transition-colors duration-150 hover:bg-white/[0.03] active:bg-white/[0.05]">
            {/* Full-card link behind everything */}
            <Link href={href} className="absolute inset-0 z-0" aria-label={`Ver perfil de ${displayName}`} />

            <div className="relative z-10 shrink-0">
              <AvatarDisplay avatarId={user.avatar_id} initials={initials} size="sm" />
            </div>

            <div className="relative z-10 min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#F5F5F5]/85 transition-colors group-hover/card:text-[#F5F5F5]">
                {displayName}
              </p>
              <p className="text-[11px] text-[#F5F5F5]/30">@{user.username}</p>
              {user.bio && (
                <p className="mt-0.5 line-clamp-1 text-[11px] text-[#F5F5F5]/32">{user.bio}</p>
              )}
            </div>

            {showFollowButtons && !user.isCurrentUser && (
              <div className="relative z-10 shrink-0">
                <FollowButton
                  targetUserId={user.user_id}
                  initialIsFollowing={user.isFollowingThem}
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
