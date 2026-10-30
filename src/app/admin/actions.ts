"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TIP_FORM_POSITIONS, type LinkKind, type LinkSection, type TipFormPosition } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | undefined;

const SECTIONS: LinkSection[] = ["siren", "top", "col1", "col2", "col3"];
const KINDS: LinkKind[] = ["story", "resource"];

function refreshSite() {
  updateTag("front-page"); // expire the cached public front page now
  revalidatePath("/admin", "layout");
}

function cleanUrl(raw: FormDataEntryValue | null, required: boolean) {
  const value = String(raw ?? "").trim();
  if (!value) return required ? { error: "URL is required." } : { value: null };
  try {
    const u = new URL(value);
    if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error();
    return { value: u.toString() };
  } catch {
    return { error: `"${value}" isn't a valid http(s) URL.` };
  }
}

function parseLink(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Headline is required." } as const;
  if (title.length > 400) return { error: "Headline is too long (400 max)." } as const;

  const url = cleanUrl(formData.get("url"), true);
  if ("error" in url) return { error: url.error } as const;
  const image = cleanUrl(formData.get("image_url"), false);
  if ("error" in image) return { error: `Image: ${image.error}` } as const;

  const section = String(formData.get("section")) as LinkSection;
  const kind = String(formData.get("kind") ?? "story") as LinkKind;
  if (!SECTIONS.includes(section)) return { error: "Pick a section." } as const;
  if (!KINDS.includes(kind)) return { error: "Pick a type." } as const;

  return {
    data: {
      title,
      url: url.value!,
      image_url: image.value,
      section,
      kind,
      is_red: formData.get("is_red") === "on",
      is_bold: formData.get("is_bold") === "on",
      is_published: formData.get("is_published") === "on",
    },
  } as const;
}

type Supa = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

/** Position that puts a row at the top (or bottom) of its section/kind group. */
async function edgePosition(supabase: Supa, section: LinkSection, kind: LinkKind, where: "top" | "bottom") {
  const { data } = await supabase
    .from("links")
    .select("position")
    .eq("section", section)
    .eq("kind", kind)
    .order("position", { ascending: where === "top" })
    .limit(1)
    .maybeSingle();
  if (!data) return 0;
  return where === "top" ? data.position - 1 : data.position + 1;
}

// ---------------------------------------------------------------- links

export async function createLink(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireAdmin();
  const parsed = parseLink(formData);
  if ("error" in parsed) return { error: parsed.error };

  const where = formData.get("placement") === "bottom" ? "bottom" : "top";
  const position = await edgePosition(supabase, parsed.data.section, parsed.data.kind, where);

  const { error } = await supabase
    .from("links")
    .insert({ ...parsed.data, position, created_by: userId });
  if (error) return { error: error.message };

  refreshSite();
  if (formData.get("intent") === "another") {
    return { ok: `Added “${parsed.data.title}”.` };
  }
  redirect("/admin?saved=1");
}

export async function updateLink(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const parsed = parseLink(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data: current } = await supabase
    .from("links")
    .select("section, kind")
    .eq("id", id)
    .maybeSingle();
  if (!current) return { error: "That headline no longer exists." };

  const patch: Record<string, unknown> = { ...parsed.data };
  // Moving to a new section/type? Drop it in at the top there.
  if (current.section !== parsed.data.section || current.kind !== parsed.data.kind) {
    patch.position = await edgePosition(supabase, parsed.data.section, parsed.data.kind, "top");
  }

  const { error } = await supabase.from("links").update(patch).eq("id", id);
  if (error) return { error: error.message };

  refreshSite();
  redirect("/admin?saved=1");
}

export async function deleteLink(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) throw new Error(error.message);
  refreshSite();
}

export async function togglePublished(id: string, next: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("links").update({ is_published: next }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshSite();
}

export async function toggleRed(id: string, next: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("links").update({ is_red: next }).eq("id", id);
  if (error) throw new Error(error.message);
  refreshSite();
}

/** Swap a link with its neighbour in the same section + type, then renumber the group. */
export async function moveLink(id: string, direction: "up" | "down") {
  const { supabase } = await requireAdmin();

  const { data: row } = await supabase
    .from("links")
    .select("section, kind")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;

  const { data: group } = await supabase
    .from("links")
    .select("id")
    .eq("section", row.section)
    .eq("kind", row.kind)
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (!group) return;

  const ids = group.map((g) => g.id as string);
  const i = ids.indexOf(id);
  const j = direction === "up" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]];

  await Promise.all(
    ids.map((linkId, position) => supabase.from("links").update({ position }).eq("id", linkId)),
  );
  refreshSite();
}

// ----------------------------------------------------------------- tips

export async function setTipRead(id: string, next: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tips").update({ is_read: next }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
}

export async function deleteTip(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("tips").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin", "layout");
}

// ------------------------------------------------------------- settings

export async function saveSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireAdmin();
  const site_name = String(formData.get("site_name") ?? "").trim();
  if (!site_name) return { error: "Site name is required." };

  const tip_form_position = String(formData.get("tip_form_position") ?? "bottom") as TipFormPosition;
  if (!TIP_FORM_POSITIONS.some((p) => p.value === tip_form_position)) {
    return { error: "Pick a place for the tip form." };
  }

  const { error } = await supabase
    .from("site_settings")
    .update({
      site_name,
      tagline: String(formData.get("tagline") ?? "").trim() || null,
      show_siren: formData.get("show_siren") === "on",
      show_tip_form: formData.get("show_tip_form") === "on",
      tip_form_position,
    })
    .eq("id", true);
  if (error) return { error: error.message };

  refreshSite();
  return { ok: "Settings saved." };
}

// ----------------------------------------------------------------- auth

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message };

  const next = String(formData.get("next") ?? "");
  redirect(next.startsWith("/admin") && !next.startsWith("/admin/login") ? next : "/admin");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
