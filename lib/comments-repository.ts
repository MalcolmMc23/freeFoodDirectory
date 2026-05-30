import { createSupabaseServerClient } from "./supabase";
import { createAdminSupabaseClient } from "./supabase-admin";

export interface Comment {
  id: string;
  location_id: string;
  comment_text: string;
  display_name: string;
  flag_count: number;
  is_visible: boolean;
  created_at: string;
}

export async function getComments(locationId: string): Promise<Comment[]> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("location_comments")
    .select("id, location_id, comment_text, display_name, created_at")
    .eq("location_id", locationId)
    .eq("is_visible", true)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data ?? []) as Comment[];
}

export async function createComment(params: {
  location_id: string;
  comment_text: string;
  display_name: string;
  ip_hash: string;
}): Promise<Comment> {
  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error("Database unavailable");

  const { data, error } = await supabase
    .from("location_comments")
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data as Comment;
}

export async function countRecentCommentsByIp(ipHash: string): Promise<number> {
  const supabase = createSupabaseServerClient();
  if (!supabase) return 0;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from("location_comments")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", since);

  if (error) throw error;
  return count ?? 0;
}

export async function flagComment(
  id: string
): Promise<{ flag_count: number; is_visible: boolean }> {
  const supabase = createAdminSupabaseClient();
  if (!supabase) throw new Error("Database unavailable");

  const { data: current, error: getError } = await supabase
    .from("location_comments")
    .select("flag_count, is_visible")
    .eq("id", id)
    .single();

  if (getError || !current) throw new Error("Comment not found");

  const newFlagCount = (current as { flag_count: number }).flag_count + 1;
  const newIsVisible = newFlagCount < 5;

  const { data, error } = await supabase
    .from("location_comments")
    .update({ flag_count: newFlagCount, is_visible: newIsVisible })
    .eq("id", id)
    .select("flag_count, is_visible")
    .single();

  if (error) throw error;
  return data as { flag_count: number; is_visible: boolean };
}
