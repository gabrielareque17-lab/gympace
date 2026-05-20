"use client";

import { Send, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import { AvatarDisplay } from "@/components/ui/avatar/avatar-display";
import { formatTimeAgo } from "@/lib/date-utils";
import { cn } from "@/lib/utils";

type CommentProfile = {
  username: string | null;
  display_name: string | null;
  avatar_id: string | null;
} | null;

type FeedComment = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile: CommentProfile;
};

type Props = {
  feedEventId: string;
  initialCount: number;
  onClose: () => void;
};

export function CommentsDrawer({ feedEventId, initialCount, onClose }: Props) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchComments = useCallback(async (replace = true) => {
    const before = replace ? undefined : comments[0]?.created_at;
    const url = `/api/feed/${feedEventId}/comments?limit=20${before ? `&before=${encodeURIComponent(before)}` : ""}`;
    try {
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (replace) {
          setComments(data.comments ?? []);
        } else {
          setComments((prev) => [...(data.comments ?? []), ...prev]);
        }
        setHasMore(data.hasMore ?? false);
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, [feedEventId, comments]);

  useEffect(() => {
    fetchComments(true);
    const id = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedEventId]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  // Scroll to bottom after loading
  useEffect(() => {
    if (!isLoading && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [isLoading, comments.length]);

  async function handleSend() {
    const content = text.trim();
    if (!content || isSending) return;
    setIsSending(true);
    setText("");

    try {
      const res = await fetch(`/api/feed/${feedEventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setTimeout(() => {
          listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
        }, 50);
      }
    } catch {
      setText(content);
    } finally {
      setIsSending(false);
    }
  }

  return createPortal(
    <>
      <style>{`
        @keyframes cmtBdIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cmtShIn { from { transform: translateY(100%) } to { transform: translateY(0) } }
        .cmt-bd { animation: cmtBdIn 0.15s ease both }
        .cmt-sh { animation: cmtShIn 0.25s cubic-bezier(0.16,1,0.3,1) both }
      `}</style>

      {/* Backdrop */}
      <div
        className="cmt-bd fixed inset-0 z-[9997] bg-black/70 backdrop-blur-[3px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="cmt-sh fixed inset-x-0 bottom-0 z-[9998] flex max-h-[80dvh] flex-col rounded-t-3xl border-t border-x border-white/[0.09] bg-[#0D0D0D]"
        style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.72)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + Header */}
        <div className="shrink-0 px-5 pb-3 pt-3">
          <div className="mb-3 flex justify-center">
            <div className="h-[5px] w-10 rounded-full bg-white/[0.14]" />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-[#F5F5F5]/80">
              Comentários
              {comments.length > 0 && (
                <span className="ml-1.5 text-[11px] font-normal text-[#F5F5F5]/30">
                  ({comments.length}{hasMore ? "+" : ""})
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="grid size-7 place-items-center rounded-xl text-[#F5F5F5]/35 transition-all duration-100 hover:bg-white/[0.06] hover:text-[#F5F5F5]/65 active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-2">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="size-7 shrink-0 animate-pulse rounded-full bg-white/[0.06]" />
                  <div className="flex-1 space-y-1.5 pt-0.5">
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-white/[0.05]" />
                    <div className="h-2 w-3/4 animate-pulse rounded bg-white/[0.04]" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-[13px] text-[#F5F5F5]/30">Seja o primeiro a comentar</p>
            </div>
          ) : (
            <div className="space-y-3 py-1">
              {hasMore && (
                <button
                  type="button"
                  onClick={() => fetchComments(false)}
                  className="w-full py-2 text-[11px] font-semibold text-[#B6FF00]/60 transition-opacity hover:text-[#B6FF00]/90"
                >
                  Ver mais comentários
                </button>
              )}
              {comments.map((comment) => {
                const displayName = comment.profile?.display_name ?? comment.profile?.username ?? "Atleta";
                return (
                  <div key={comment.id} className="flex gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      <AvatarDisplay
                        avatarId={comment.profile?.avatar_id ?? null}
                        initials={displayName[0]?.toUpperCase() ?? "A"}
                        size="xs"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[12px] font-semibold text-[#F5F5F5]/75">
                          {displayName}
                        </span>
                        <span className="text-[10px] text-[#F5F5F5]/25">
                          {formatTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 break-words text-[13px] leading-relaxed text-[#F5F5F5]/65">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Input */}
        <div
          className="shrink-0 border-t border-white/[0.06] px-4 py-3"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <div className="flex items-center gap-2.5">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Escreva um comentário..."
              maxLength={500}
              className={cn(
                "min-w-0 flex-1 rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-[#F5F5F5]/80",
                "outline-none placeholder:text-[#F5F5F5]/25",
                "focus:ring-1 focus:ring-[#B6FF00]/30 focus:bg-white/[0.08]",
                "transition-all duration-150"
              )}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!text.trim() || isSending}
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-xl transition-all duration-150",
                "active:scale-90 disabled:pointer-events-none disabled:opacity-30",
                text.trim() ? "bg-[#B6FF00] text-[#080808]" : "bg-white/[0.06] text-[#F5F5F5]/30"
              )}
              style={text.trim() ? { boxShadow: "0 0 14px rgba(182,255,0,0.35)" } : undefined}
            >
              <Send className="size-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
