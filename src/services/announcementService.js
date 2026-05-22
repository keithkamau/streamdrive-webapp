import { supabase } from "../lib/supabase";

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

export async function getAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      comments (*)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapAnnouncement);
}

export async function addAnnouncement({
  title,
  body,
  postedBy,
  houseNumber,
  isAdmin,
}) {
  const { data, error } = await supabase
    .from("announcements")
    .insert([
      {
        title,
        body,
        posted_by: postedBy,
        house_number: houseNumber,
        is_admin: isAdmin,
      },
    ])
    .select()
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
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        announcement_id: announcementId,
        text,
        posted_by: postedBy,
        house_number: houseNumber,
        is_admin: isAdmin,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return mapComment(data);
}

export async function deleteAnnouncement(id) {
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) throw error;
}
