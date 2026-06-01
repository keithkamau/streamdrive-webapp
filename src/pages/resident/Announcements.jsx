// src/pages/admin/Announcements.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAnnouncements,
  addAnnouncement,
  deleteAnnouncement,
  addComment,
  deleteComment,
} from "../../services/announcementService";
import { Card, Button, Input, Alert, Divider } from "../../components/ui/index";

export default function Announcements() {
  const { user } = useAuth();

  // ── Data ──────────────────────────────────────────────────────────────────────
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // ← NEW (was missing)

  // ── New announcement form ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState(null); // ← NEW (was silent)

  // ── Comments ──────────────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState({}); // keyed by announcement id
  const [commentError, setCommentError] = useState({}); // ← NEW keyed by announcement id
  const [commentSaving, setCommentSaving] = useState({}); // keyed by announcement id

  // ── Load ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    setError(null); // ← NEW
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      // Was: console.error(err)                                  ← FIXED
      setError(err.message ?? "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }

  // ── Post announcement ─────────────────────────────────────────────────────────
  async function handlePost() {
    if (!title.trim() || !body.trim()) {
      setPostError("Title and body are both required."); // ← NEW
      return;
    }

    setPosting(true);
    setPostError(null); // ← NEW
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
      // Was: console.error(err)                                  ← FIXED
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
      await fetchAnnouncements();
    } catch (err) {
      // Was: console.error(err)                                  ← FIXED
      setError(err.message ?? "Failed to delete announcement.");
    }
  }

  // ── Post comment ──────────────────────────────────────────────────────────────
  async function handleComment(announcementId) {
    const text = (commentText[announcementId] ?? "").trim();
    if (!text) return;

    setCommentSaving((prev) => ({ ...prev, [announcementId]: true }));
    setCommentError((prev) => ({ ...prev, [announcementId]: null })); // ← NEW
    try {
      await addComment({
        announcementId,
        text,
        postedBy: user?.name ?? "Admin",
        houseNumber: user?.houseNumber,
        isAdmin: true,
      });
      setCommentText((prev) => ({ ...prev, [announcementId]: "" }));
      await fetchAnnouncements();
    } catch (err) {
      // Was: console.error(err)                                  ← FIXED
      setCommentError((prev) => ({
        ...prev,
        [announcementId]: err.message ?? "Failed to post comment.",
      }));
    } finally {
      setCommentSaving((prev) => ({ ...prev, [announcementId]: false }));
    }
  }

  // ── Delete comment ────────────────────────────────────────────────────────────
  async function handleDeleteComment(commentId, announcementId) {
    try {
      await deleteComment(commentId);
      await fetchAnnouncements();
    } catch (err) {
      // Was: console.error(err)                                  ← FIXED
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

      {/* Page-level error (load failures, delete failures) */}
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

        <Input
          placeholder='Title'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className='w-full rounded-lg border border-zinc-300 dark:border-zinc-600
                     bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                     px-3 py-2 text-sm resize-none focus:outline-none
                     focus:ring-2 focus:ring-green-500'
          rows={4}
          placeholder='Write your announcement…'
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
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
                  {a.postedBy} · {new Date(a.createdAt).toLocaleDateString()}
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
                  <div>
                    <span className='font-medium text-zinc-700 dark:text-zinc-300'>
                      {c.postedBy}
                    </span>
                    <span className='ml-2 text-zinc-500 dark:text-zinc-400'>
                      {c.text}
                    </span>
                  </div>
                  {(user?.isAdmin || c.houseNumber === user?.houseNumber) && (
                    <button
                      className='text-xs text-red-400 hover:text-red-600 shrink-0'
                      onClick={() => handleDeleteComment(c.id, a.id)}
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
              <div className='flex gap-2 mt-1'>
                <Input
                  placeholder='Write a comment…'
                  value={commentText[a.id] ?? ""}
                  onChange={(e) =>
                    setCommentText((prev) => ({
                      ...prev,
                      [a.id]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleComment(a.id)}
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
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
