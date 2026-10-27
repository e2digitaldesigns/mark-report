import { createClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL } from "./env";

/**
 * Cookie-free client for the public front page. Because it never touches
 * cookies, the page can be statically cached and revalidated (ISR).
 * RLS limits it to published rows.
 */
export function createPublicClient() {
  return createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
