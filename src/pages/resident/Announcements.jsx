import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Card, Badge, Button, Alert } from "../../components/ui";
import {
  getAnnouncements,
  addAnnouncement,
  addComment,
  deleteAnnouncement,
} from "../../services/announcementService";

function timeAgo(dateStr) {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function Avatar({ name, isAdmin }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
        isAdmin ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {initials}
    </div>
  );
}

function CommentBox({ onSubmit, loading }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSubmit(text.trim());
    setText("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex gap-2 mt-3 pt-3 border-t border-zinc-100'
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='Write a comment...'
        className='flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
      />
      <Button type='submit' size='sm' disabled={!text.trim()} loading={loading}>
        Post
      </Button>
    </form>
  );
}

function AnnouncementCard({
  announcement,
  currentUser,
  onAddComment,
  onDelete,
}) {
  const [expanded, setExpanded] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);

  const handleComment = async (text) => {
    setCommentLoading(true);
    await onAddComment(announcement.id, text);
    setCommentLoading(false);
  };

  return (
    <Card className='overflow-hidden'>
      <div className='px-5 py-4 flex items-start justify-between gap-3'>
        <div className='flex items-start gap-3 flex-1 min-w-0'>
          <Avatar name={announcement.postedBy} isAdmin={announcement.isAdmin} />
          <div className='flex-1 min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <span className='text-sm font-semibold text-zinc-900'>
                {announcement.postedBy}
              </span>
              {announcement.isAdmin ? (
                <Badge variant='admin'>Admin</Badge>
              ) : (
                <Badge variant='default'>{announcement.houseNumber}</Badge>
              )}
              <span className='text-xs text-zinc-400'>
                {timeAgo(announcement.postedAt)}
              </span>
            </div>
            <h3 className='font-display font-bold text-zinc-900 text-base mt-1'>
              {announcement.title}
            </h3>
          </div>
        </div>
        <div className='flex items-center gap-1 shrink-0'>
          {currentUser?.houseNumber === announcement.houseNumber && (
            <button
              onClick={() => onDelete(announcement.id)}
              className='p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors'
              title='Delete announcement'
            >
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <polyline points='3 6 5 6 21 6' />
                <path d='M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6' />
                <path d='M10 11v6M14 11v6' />
                <path d='M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2' />
              </svg>
            </button>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className='p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors'
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
              fill='none'
              stroke='currentColor'
              strokeWidth='2'
              viewBox='0 0 24 24'
            >
              <polyline points='6 9 12 15 18 9' />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className='px-5 pb-4'>
          <p className='text-sm text-zinc-600 leading-relaxed'>
            {announcement.body}
          </p>

          {announcement.comments.length > 0 && (
            <div className='mt-4 flex flex-col gap-3'>
              <p className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                {announcement.comments.length} comment
                {announcement.comments.length !== 1 ? "s" : ""}
              </p>
              {announcement.comments.map((comment) => (
                <div key={comment.id} className='flex gap-2.5'>
                  <Avatar name={comment.postedBy} isAdmin={comment.isAdmin} />
                  <div className='flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-3.5 py-2.5'>
                    <div className='flex items-center gap-2 flex-wrap mb-1'>
                      <span className='text-xs font-semibold text-zinc-800'>
                        {comment.postedBy}
                      </span>
                      {comment.isAdmin ? (
                        <Badge variant='admin'>Admin</Badge>
                      ) : (
                        <Badge variant='default'>{comment.houseNumber}</Badge>
                      )}
                      <span className='text-xs text-zinc-400'>
                        {timeAgo(comment.postedAt)}
                      </span>
                    </div>
                    <p className='text-sm text-zinc-600'>{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <CommentBox onSubmit={handleComment} loading={commentLoading} />
        </div>
      )}
    </Card>
  );
}

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", body: "" });
  const [postLoading, setPostLoading] = useState(false);

  const reload = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setPageError("Failed to load announcements. Please refresh.");
      console.error(err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadAnnouncements = async () => {
      try {
        await reload();
      } finally {
        if (mounted) setPageLoading(false);
      }
    };

    loadAnnouncements();

    return () => {
      mounted = false;
    };
  }, []);

  const handleAddComment = async (announcementId, text) => {
    try {
      await addComment({
        announcementId,
        text,
        postedBy: `${user.firstName} ${user.lastName}`,
        houseNumber: user.houseNumber,
        isAdmin: user.isAdmin,
      });
      await reload();
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  const handleNewPost = async (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.body.trim()) return;
    setPostLoading(true);
    try {
      await addAnnouncement({
        title: newPost.title.trim(),
        body: newPost.body.trim(),
        postedBy: `${user.firstName} ${user.lastName}`,
        houseNumber: user.houseNumber,
        isAdmin: user.isAdmin,
      });
      await reload();
      setNewPost({ title: "", body: "" });
      setShowNewForm(false);
    } catch (err) {
      console.error("Failed to post announcement:", err);
    }
    setPostLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      await reload();
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  if (pageLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='flex flex-col items-center gap-3'>
          <svg
            className='animate-spin w-6 h-6 text-green-500'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            />
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8v8H4z'
            />
          </svg>
          <p className='text-sm text-zinc-400'>Loading announcements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-auto flex flex-col gap-6 animate-fade-in'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h2 className='font-display font-bold text-zinc-900 text-xl'>
            Announcements
          </h2>
          <p className='text-sm text-zinc-400 mt-0.5'>
            Estate notices and resident discussions
          </p>
        </div>
        <Button
          onClick={() => setShowNewForm(!showNewForm)}
          variant={showNewForm ? "secondary" : "primary"}
          size='md'
        >
          {showNewForm ? (
            "Cancel"
          ) : (
            <>
              <svg
                className='w-4 h-4'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <line x1='12' y1='5' x2='12' y2='19' />
                <line x1='5' y1='12' x2='19' y2='12' />
              </svg>
              New Post
            </>
          )}
        </Button>
      </div>

      {pageError && <Alert variant='danger'>{pageError}</Alert>}

      {showNewForm && (
        <Card className='p-5 animate-fade-in'>
          <h3 className='font-display font-bold text-zinc-900 text-base mb-4'>
            New Announcement
          </h3>
          <form onSubmit={handleNewPost} className='flex flex-col gap-4'>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                Title
              </label>
              <input
                value={newPost.title}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, title: e.target.value }))
                }
                placeholder='Announcement title'
                className='w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all'
              />
            </div>
            <div className='flex flex-col gap-1.5'>
              <label className='text-xs font-semibold uppercase tracking-widest text-zinc-400'>
                Message
              </label>
              <textarea
                value={newPost.body}
                onChange={(e) =>
                  setNewPost((p) => ({ ...p, body: e.target.value }))
                }
                placeholder='Write your announcement...'
                rows={4}
                className='w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all resize-none'
              />
            </div>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2 text-xs text-zinc-400'>
                <span>Posting as</span>
                <span className='font-semibold text-zinc-600'>
                  {user.firstName} {user.lastName}
                </span>
                {user.isAdmin ? (
                  <Badge variant='admin'>Admin</Badge>
                ) : (
                  <Badge variant='default'>{user.houseNumber}</Badge>
                )}
              </div>
              <Button
                type='submit'
                size='md'
                loading={postLoading}
                disabled={!newPost.title.trim() || !newPost.body.trim()}
              >
                Post
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className='flex flex-col gap-4'>
        {announcements.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 gap-3 text-center'>
            <div className='w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center'>
              <svg
                className='w-6 h-6 text-zinc-400'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                viewBox='0 0 24 24'
              >
                <path d='M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z' />
              </svg>
            </div>
            <div>
              <p className='text-sm font-semibold text-zinc-500'>
                No announcements yet
              </p>
              <p className='text-xs text-zinc-400 mt-0.5'>
                Post the first announcement for Stream Drive
              </p>
            </div>
          </div>
        ) : (
          announcements.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              currentUser={user}
              onAddComment={handleAddComment}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
