import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Same tag the admin actions expire, so settings edits show up immediately. */
export const FRONT_PAGE_TAG = "front-page";

export const DEFAULT_SITE_NAME = "THE WIRE REPORT";

export async function getSiteName(): Promise<{ siteName: string; tagline: string | null }> {
  "use cache";
  cacheLife("minutes");
  cacheTag(FRONT_PAGE_TAG);

  if (!isSupabaseConfigured()) return { siteName: DEFAULT_SITE_NAME, tagline: null };

  const { data } = await createPublicClient()
    .from("site_settings")
    .select("site_name, tagline")
    .maybeSingle();

  return { siteName: data?.site_name || DEFAULT_SITE_NAME, tagline: data?.tagline ?? null };
}
