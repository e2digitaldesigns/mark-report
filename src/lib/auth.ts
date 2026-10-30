import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures the request comes from a signed-in admin. Redirects otherwise.
 * RLS enforces the same rule in the database — this just gives a nice UX.
 */
export async function requireAdmin() {
  // getClaims() reads Date.now() to check token expiry; opt into request time first.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  const email = (data?.claims?.email as string | undefined) ?? null;

  if (!userId) redirect("/admin/login");

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/admin/login?error=not_admin");

  return { supabase, userId, email };
}
