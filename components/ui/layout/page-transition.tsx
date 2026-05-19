"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Wraps page children with a fade+slide-up animation on every route change.
 * The `key={pathname}` forces React to remount this div, re-triggering the CSS animation.
 */
export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const pathname = usePathname();
  return (
    <div key={pathname} className={cn("page-enter flex min-w-0 flex-1 flex-col", className)}>
      {children}
    </div>
  );
}
