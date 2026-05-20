"use client";

import { Check, Pencil, Send, Trash2, X } from "lucide-react";
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
  can_manage?: boolean;
  profile: CommentProfile;
};

type Props = {
  feedEventId: string;
  initialCount: number;
  postContext: {
    title: string;
    detail?: string;
    color: string;
  };
  onClose: () => void;
};

export function CommentsDrawer({ feedEventId, initialCount, postContext, onClose }: Props) {
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
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
  }, [comments, feedEventId]);

  useEffect(() => {
    const loadId = setTimeout(() => {
      void fetchComments(true);
    }, 0);
    const focusId = setTimeout(() => inputRef.current?.focus(), 350);
    return () => {
      clearTimeout(loadId);
      clearTimeout(focusId);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedEventId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

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

  function startEdit(comment: FeedComment) {
    setEditingId(comment.id);
    setEditingText(comment.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  async function handleEdit(commentId: string) {
    const content = editingText.trim();
    if (!content || savingId) return;

    setSavingId(commentId);
    try {
      const res = await fetch(`/api/feed/${feedEventId}/comments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev.map((comment) => comment.id === commentId ? data.comment : comment)
        );
        cancelEdit();
      }
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(commentId: string) {
    if (!window.confirm("Apagar este comentario?") || deletingId) return;

    setDeletingId(commentId);
    try {
      const res = await fetch(`/api/feed/${feedEventId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId }),
      });
      if (res.ok) {
        setComments((prev) => prev.filter((comment) => comment.id !== commentId));
        if (editingId === commentId) cancelEdit();
      }
    } finally {
      setDeletingId(null);
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

      <div
        className="cmt-bd fixed inset-0 z-[9997] bg-black/70 backdrop-blur-[3px]"
        onClick={onClose}
      />

      <div
        className="cmt-sh fixed inset-x-0 bottom-0 z-[9998] flex max-h-[82dvh] flex-col rounded-t-3xl border-x border-t border-white/[0.09] bg-[#0D0D0D]"
        style={{ boxShadow: "0 -8px 48px rgba(0,0,0,0.72)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pb-3 pt-3">
          <div className="mb-3 flex justify-center">
            <div className="h-[5px] w-10 rounded-full bg-white/[0.14]" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-[#F5F5F5]/82">
                Comentarios
                <span className="ml-1.5 text-[11px] font-normal text-[#F5F5F5]/30">
                  ({isLoading ? initialCount : comments.length}{hasMore ? "+" : ""})
                </span>
              </p>
              <p className="mt-0.5 text-[11px] text-[#F5F5F5]/32">Comentando em</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid size-7 shrink-0 place-items-center rounded-xl text-[#F5F5F5]/35 transition-all duration-100 hover:bg-white/[0.06] hover:text-[#F5F5F5]/65 active:scale-90"
            >
              <X className="size-4" />
            </button>
          </div>

          <div
            className="mt-3 rounded-2xl border bg-white/[0.025] px-3 py-2.5"
            style={{ borderColor: `${postContext.color}28` }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: postContext.color, boxShadow: `0 0 12px ${postContext.color}66` }}
              />
              <div className="min-w-0">
                <p className="truncate text-[12px] font-bold text-[#F5F5F5]/82">{postContext.title}</p>
                {postContext.detail && (
                  <p className="mt-0.5 truncate text-[11px] text-[#F5F5F5]/36">{postContext.detail}</p>
                )}
              </div>
            </div>
          </div>
        </div>

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
                  Ver mais comentarios
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
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="truncate text-[12px] font-semibold text-[#F5F5F5]/75">
                              {displayName}
                            </span>
                            <span className="shrink-0 text-[10px] text-[#F5F5F5]/25">
                              {formatTimeAgo(comment.created_at)}
                            </span>
                          </div>
                        </div>
                        {comment.can_manage && editingId !== comment.id && (
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => startEdit(comment)}
                              className="grid size-7 place-items-center rounded-lg text-[#F5F5F5]/30 transition-colors hover:bg-white/[0.06] hover:text-[#F5F5F5]/65 active:scale-95"
                              aria-label="Editar comentario"
                            >
                              <Pencil className="size-3.5" strokeWidth={1.8} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(comment.id)}
                              disabled={deletingId === comment.id}
                              className="grid size-7 place-items-center rounded-lg text-[#F5F5F5]/30 transition-colors hover:bg-red-500/[0.08] hover:text-red-400 active:scale-95 disabled:opacity-40"
                              aria-label="Apagar comentario"
                            >
                              <Trash2 className="size-3.5" strokeWidth={1.8} />
                            </button>
                          </div>
                        )}
                      </div>

                      {editingId === comment.id ? (
                        <div className="mt-1.5 space-y-2">
                          <input
                            type="text"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleEdit(comment.id);
                              }
                            }}
                            maxLength={500}
                            className="w-full rounded-xl border border-[#B6FF00]/20 bg-white/[0.06] px-3 py-2 text-[13px] text-[#F5F5F5]/82 outline-none focus:border-[#B6FF00]/40"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(comment.id)}
                              disabled={!editingText.trim() || savingId === comment.id}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#B6FF00] px-3 text-xs font-bold text-[#080808] transition-transform active:scale-95 disabled:opacity-40"
                            >
                              <Check className="size-3.5" strokeWidth={2.5} />
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              disabled={savingId === comment.id}
                              className="h-8 rounded-lg border border-white/[0.07] px-3 text-xs font-semibold text-[#F5F5F5]/45 transition-colors hover:text-[#F5F5F5]/75 disabled:opacity-40"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-0.5 break-words text-[13px] leading-relaxed text-[#F5F5F5]/65">
                          {comment.content}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escreva um comentario..."
              maxLength={500}
              className={cn(
                "min-w-0 flex-1 rounded-xl bg-white/[0.06] px-3.5 py-2.5 text-[13px] text-[#F5F5F5]/80",
                "outline-none placeholder:text-[#F5F5F5]/25",
                "focus:bg-white/[0.08] focus:ring-1 focus:ring-[#B6FF00]/30",
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
