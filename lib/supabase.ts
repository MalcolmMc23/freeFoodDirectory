import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export function createSupabaseServerClient() {
  const env = getSupabaseEnv();

  if (!env) return null;

  return createClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
