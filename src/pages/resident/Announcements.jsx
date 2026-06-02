import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment,
} from "../../services/announcementService";
import { Card, Button, Input, Alert, Divider } from "../../components/ui/index";

// ─── Character-count limits (must match announcementService) ─────────────────
const TITLE_MAX = 200;
const BODY_MAX = 5_000;
const COMMENT_MAX = 1_000;

export default function Announcements() {
  const { user } = useAuth();

  // ── Data ──────────────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── New announcement form ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null);

  // ── Comments ──────────────────────────────────────────────────────────────────
  // keyed by announcement id
  const [commentText, setCommentText] = useState({});
  const [commentError, setCommentError] = useState({});
  const [commentSaving, setCommentSaving] = useState({});

  // ── Load ──────────────────────────────────────────────────────────────────────
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError(err.message ?? "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  // ── Client-side validation ────────────────────────────────────────────────────
  function validatePost() {
    if (!title.trim()) return "Title is required.";
    if (title.trim().length > TITLE_MAX)
      return `Title must be ${TITLE_MAX} characters or fewer.`;
    if (!body.trim()) return "Body is required.";
    if (body.trim().length > BODY_MAX)
      return `Body must be ${BODY_MAX} characters or fewer.`;
    return null;
  }

  // ── Post announcement ─────────────────────────────────────────────────────────
  async function handlePost() {
    const validationError = validatePost();
    if (validationError) {
      setPostError(validationError);
      return;
    }

    setPosting(true);
    setPostError(null);
    try {
      await addAnnouncement({
        title: title.trim(),
        body: body.trim(),
        postedBy: user?.name ?? "Admin",
        houseNumber: user?.houseNumber,
        isAdmin: true,
      });
      setTitle("");
      setBody("");
      await fetchAnnouncements();
    } catch (err) {
      setPostError(
        err.message ?? "Failed to post announcement. Please try again.",
      );
    } finally {
      setPosting(false);
    }
  }

  // ── Delete announcement ───────────────────────────────────────────────────────
  async function handleDeleteAnnouncement(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      // Optimistic local removal so we don't need a round-trip
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err.message ?? "Failed to delete announcement.");
    }
  }

  // ── Post comment ──────────────────────────────────────────────────────────────
  async function handleComment(announcementId) {
    const text = (commentText[announcementId] ?? "").trim();

    if (!text) return;
    if (text.length > COMMENT_MAX) {
      setCommentError((prev) => ({
        ...prev,
        [announcementId]: `Comment must be ${COMMENT_MAX} characters or fewer.`,
      }));
      return;
    }

    setCommentSaving((prev) => ({ ...prev, [announcementId]: true }));
    setCommentError((prev) => ({ ...prev, [announcementId]: null }));

    try {
      const newComment = await addComment({
        announcementId,
        text,
        postedBy: user?.name ?? "Admin",
        houseNumber: user?.houseNumber,
        isAdmin: true,
      });

      // Optimistic local append — avoids full refetch
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? { ...a, comments: [...(a.comments ?? []), newComment] }
            : a,
        ),
      );
      setCommentText((prev) => ({ ...prev, [announcementId]: "" }));
    } catch (err) {
      setCommentError((prev) => ({
        ...prev,
        [announcementId]: err.message ?? "Failed to post comment.",
      }));
    } finally {
      setCommentSaving((prev) => ({ ...prev, [announcementId]: false }));
    }
  }

  // ── Delete comment ────────────────────────────────────────────────────────────
  // Receives the comment's UUID (primary key) and the parent announcement id
  // so we can do an optimistic local removal.
  async function handleDeleteComment(commentId, announcementId) {
    try {
      await deleteComment(commentId);
      // Optimistic local removal
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcementId
            ? {
                ...a,
                comments: (a.comments ?? []).filter((c) => c.id !== commentId),
              }
            : a,
        ),
      );
    } catch (err) {
      setCommentError((prev) => ({
        ...prev,
        [announcementId]: err.message ?? "Failed to delete comment.",
      }));
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className='p-4 md:p-6 space-y-6'>
      <h1 className='text-2xl font-bold font-display text-zinc-900 dark:text-zinc-50'>
        Announcements
      </h1>

      {/* Page-level error (load / delete failures) */}
      {error && (
        <Alert type='danger' onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* ── Compose ───────────────────────────────────────────────────────────── */}
      <Card className='space-y-3'>
        <h2 className='text-base font-semibold text-zinc-800 dark:text-zinc-200'>
          New Announcement
        </h2>

        {postError && (
          <Alert type='danger' onDismiss={() => setPostError(null)}>
            {postError}
          </Alert>
        )}

        <div className='space-y-1'>
          <Input
            placeholder='Title'
            value={title}
            maxLength={TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
          />
          <p className='text-xs text-zinc-400 text-right'>
            {title.length}/{TITLE_MAX}
          </p>
        </div>

        <div className='space-y-1'>
          <textarea
            className='w-full rounded-lg border border-zinc-300 dark:border-zinc-600
                       bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                       px-3 py-2 text-sm resize-none focus:outline-none
                       focus:ring-2 focus:ring-green-500'
            rows={4}
            placeholder='Write your announcement…'
            maxLength={BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <p className='text-xs text-zinc-400 text-right'>
            {body.length}/{BODY_MAX}
          </p>
        </div>

        <div className='flex justify-end'>
          <Button onClick={handlePost} disabled={posting}>
            {posting ? "Posting…" : "Post Announcement"}
          </Button>
        </div>
      </Card>

      {/* ── Feed ──────────────────────────────────────────────────────────────── */}
      {loading ? (
        <p className='text-center text-zinc-500 py-8'>Loading…</p>
      ) : announcements.length === 0 ? (
        <p className='text-center text-zinc-500 py-8'>No announcements yet.</p>
      ) : (
        announcements.map((a) => (
          <Card key={a.id} className='space-y-3'>
            {/* Header */}
            <div className='flex items-start justify-between gap-2'>
              <div>
                <h3 className='font-semibold text-zinc-900 dark:text-zinc-50'>
                  {a.title}
                </h3>
                <p className='text-xs text-zinc-400 mt-0.5'>
                  {a.postedBy} ·{" "}
                  {new Date(a.postedAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {(user?.isAdmin || a.houseNumber === user?.houseNumber) && (
                <Button
                  variant='ghost'
                  size='xs'
                  className='text-red-500 hover:text-red-700 shrink-0'
                  onClick={() => handleDeleteAnnouncement(a.id)}
                >
                  Delete
                </Button>
              )}
            </div>

            <p className='text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap'>
              {a.body}
            </p>

            <Divider />

            {/* Comments */}
            <div className='space-y-2'>
              {(a.comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className='flex items-start justify-between gap-2 text-sm'
                >
                  <div className='min-w-0'>
                    <span className='font-medium text-zinc-700 dark:text-zinc-300'>
                      {c.postedBy}
                    </span>
                    <span className='ml-2 text-zinc-500 dark:text-zinc-400 wrap-break-word'>
                      {c.text}
                    </span>
                  </div>
                  {(user?.isAdmin || c.houseNumber === user?.houseNumber) && (
                    <button
                      className='text-xs text-red-400 hover:text-red-600 shrink-0 ml-2'
                      onClick={() => handleDeleteComment(c.id, a.id)}
                      aria-label='Delete comment'
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}

              {/* Per-announcement comment error */}
              {commentError[a.id] && (
                <Alert
                  type='danger'
                  onDismiss={() =>
                    setCommentError((prev) => ({ ...prev, [a.id]: null }))
                  }
                >
                  {commentError[a.id]}
                </Alert>
              )}

              {/* Comment input */}
              <div className='space-y-1'>
                <div className='flex gap-2 mt-1'>
                  <Input
                    placeholder='Write a comment…'
                    value={commentText[a.id] ?? ""}
                    maxLength={COMMENT_MAX}
                    onChange={(e) =>
                      setCommentText((prev) => ({
                        ...prev,
                        [a.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleComment(a.id)
                    }
                    className='text-sm'
                  />
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => handleComment(a.id)}
                    disabled={commentSaving[a.id]}
                  >
                    {commentSaving[a.id] ? "…" : "Reply"}
                  </Button>
                </div>
                {(commentText[a.id] ?? "").length > 0 && (
                  <p className='text-xs text-zinc-400 text-right'>
                    {(commentText[a.id] ?? "").length}/{COMMENT_MAX}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
