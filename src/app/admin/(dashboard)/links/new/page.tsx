import { createLink } from "../../../actions";
import { SECTIONS, type LinkSection } from "@/lib/types";
import LinkForm from "../LinkForm";
import s from "../../../admin.module.css";

export const instant = false; // per-user admin page; allowed to block

export default async function NewLinkPage({ searchParams }: PageProps<"/admin/links/new">) {
  const params = await searchParams;
  const section = SECTIONS.some((x) => x.value === params.section)
    ? (params.section as LinkSection)
    : "col1";

  return (
    <>
      <div className={s.head}>
        <h1 className={s.h1}>New headline</h1>
      </div>
      <LinkForm action={createLink} mode="create" initial={{ section }} />
    </>
  );
}
