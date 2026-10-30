import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import type { Link } from "@/lib/types";
import { updateLink } from "../../../actions";
import LinkForm from "../LinkForm";
import { DeleteButton } from "./DeleteButton";
import s from "../../../admin.module.css";

export const instant = false; // per-user admin page; allowed to block

export default async function EditLinkPage({ params }: PageProps<"/admin/links/[id]">) {
  const { id } = await params;
  const { supabase } = await requireAdmin();

  const { data } = await supabase.from("links").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const link = data as Link;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Edit headline</h1>
          <p className={s.sub}>Last updated {new Date(link.updated_at).toLocaleString("en-US")}</p>
        </div>
        <DeleteButton id={link.id} title={link.title} />
      </div>
      <LinkForm action={updateLink.bind(null, link.id)} mode="edit" initial={link} />
    </>
  );
}
