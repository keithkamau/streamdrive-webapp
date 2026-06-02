import { supabase } from "../lib/supabase";

// ─── Sanitisation helper ──────────────────────────────────────────────────────
// Trims whitespace and strips any null bytes that could cause DB issues.
function sanitise(str) {
  if (typeof str !== "string") return str;
  return str.trim().replace(/\0/g, "");
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapAnnouncement(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    postedBy: row.posted_by,
    houseNumber: row.house_number,
    isAdmin: row.is_admin,
    postedAt: row.created_at,
    comments: (row.comments || []).map(mapComment),
  };
}

function mapComment(row) {
  return {
    id: row.id,
    text: row.text,
    postedBy: row.posted_by,
    houseNumber: row.house_number,
    isAdmin: row.is_admin,
    postedAt: row.created_at,
  };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      body,
      posted_by,
      house_number,
      is_admin,
      created_at,
      comments (
        id,
        text,
        posted_by,
        house_number,
        is_admin,
        created_at
      )
    `,
    )
    .order("created_at", { ascending: false })
    .order("created_at", { ascending: true, referencedTable: "comments" });

  if (error) throw error;
  return data.map(mapAnnouncement);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function addAnnouncement({
  title,
  body,
  postedBy,
  houseNumber,
  isAdmin,
}) {
  // Input validation
  const cleanTitle = sanitise(title);
  const cleanBody = sanitise(body);

  if (!cleanTitle) throw new Error("Title is required.");
  if (cleanTitle.length > 200)
    throw new Error("Title must be 200 characters or fewer.");
  if (!cleanBody) throw new Error("Body is required.");
  if (cleanBody.length > 5000)
    throw new Error("Body must be 5 000 characters or fewer.");

  const { data, error } = await supabase
    .from("announcements")
    .insert([
      {
        title: cleanTitle,
        body: cleanBody,
        posted_by: sanitise(postedBy),
        house_number: sanitise(houseNumber),
        is_admin: Boolean(isAdmin),
      },
    ])
    .select("id, title, body, posted_by, house_number, is_admin, created_at")
    .single();

  if (error) throw error;
  return mapAnnouncement({ ...data, comments: [] });
}

export async function addComment({
  announcementId,
  text,
  postedBy,
  houseNumber,
  isAdmin,
}) {
  // Input validation
  if (!announcementId) throw new Error("Announcement ID is required.");
  const cleanText = sanitise(text);
  if (!cleanText) throw new Error("Comment text is required.");
  if (cleanText.length > 1000)
    throw new Error("Comment must be 1 000 characters or fewer.");

  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        announcement_id: announcementId,
        text: cleanText,
        posted_by: sanitise(postedBy),
        house_number: sanitise(houseNumber),
        is_admin: Boolean(isAdmin),
      },
    ])
    .select("id, text, posted_by, house_number, is_admin, created_at")
    .single();

  if (error) throw error;
  return mapComment(data);
}

export async function deleteAnnouncement(id) {
  if (!id) throw new Error("Announcement ID is required.");

  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) throw error;
}

// ─── deleteComment ────────────────────────────────────────────────────────────
// Deletes a single comment by its primary-key UUID.
// The RLS policy on the `comments` table should ensure only the owner
// or an admin can delete.
export async function deleteComment(commentId) {
  if (!commentId) throw new Error("Comment ID is required.");

  const { error } = await supabase
    .from("comments")
    .delete()
    .eq("id", commentId);

  if (error) throw error;
}
