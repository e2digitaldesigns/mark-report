import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SECTIONS, type Link as LinkRow, type LinkSection } from "@/lib/types";
import { Buttons, Order } from "./RowActions";
import s from "../admin.module.css";

const fmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function AdminHome({ searchParams }: PageProps<"/admin">) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const sectionFilter = typeof params.section === "string" ? params.section : "";
  const status = typeof params.status === "string" ? params.status : "";

  let query = supabase
    .from("links")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (q) query = query.or(`title.ilike.%${q.replace(/[%,()]/g, "")}%,url.ilike.%${q.replace(/[%,()]/g, "")}%`);
  if (sectionFilter) query = query.eq("section", sectionFilter);
  if (status === "live") query = query.eq("is_published", true);
  if (status === "draft") query = query.eq("is_published", false);

  const { data, error } = await query;
  const links = (data ?? []) as LinkRow[];
  const filtered = Boolean(q || sectionFilter || status);
  const sections = sectionFilter
    ? SECTIONS.filter((x) => x.value === sectionFilter)
    : SECTIONS;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Headlines</h1>
          <p className={s.sub}>
            {links.length} {filtered ? "matching" : "total"} · changes go live on the front page immediately
          </p>
        </div>
        <Link href="/admin/links/new" className={s.btn}>
          + New headline
        </Link>
      </div>

      {params.saved && <p className={s.okMsg}>Saved. The front page has been refreshed.</p>}
      {error && <p className={s.error}>{error.message}</p>}

      <form className={s.filters} method="get">
        <input className={s.input} name="q" placeholder="Search headline or URL…" defaultValue={q} />
        <select className={s.select} name="section" defaultValue={sectionFilter}>
          <option value="">All sections</option>
          {SECTIONS.map((x) => (
            <option key={x.value} value={x.value}>
              {x.label}
            </option>
          ))}
        </select>
        <select className={s.select} name="status" defaultValue={status}>
          <option value="">Live + drafts</option>
          <option value="live">Live only</option>
          <option value="draft">Drafts only</option>
        </select>
        <button className={s.btnGhost}>Filter</button>
        {filtered && (
          <Link href="/admin" className={s.btnGhost}>
            Clear
          </Link>
        )}
      </form>

      {sections.map(({ value, label }) => {
        const rows = links.filter((l) => l.section === value);
        if (filtered && rows.length === 0) return null;
        return (
          <section key={value} className={s.group}>
            <div className={s.groupHead}>
              <span className={s.groupTitle}>
                {label}
                <span className={s.count}>{rows.length}</span>
              </span>
              <Link href={`/admin/links/new?section=${value}`} className={s.btnGhost} style={{ height: 30 }}>
                + Add
              </Link>
            </div>
            <Group rows={rows} section={value} reorderable={!filtered} />
          </section>
        );
      })}
    </>
  );
}

function Group({ rows, section, reorderable }: { rows: LinkRow[]; section: LinkSection; reorderable: boolean }) {
  if (rows.length === 0) return <p className={s.empty}>Nothing here yet.</p>;

  const stories = rows.filter((r) => r.kind === "story");
  const resources = rows.filter((r) => r.kind === "resource");
  const showKinds = resources.length > 0 && section !== "siren" && section !== "top";

  return (
    <>
      {showKinds && stories.length > 0 && <div className={s.kindLabel}>Stories</div>}
      {stories.map((r, i) => (
        <Row key={r.id} row={r} first={i === 0} last={i === stories.length - 1} reorderable={reorderable} />
      ))}
      {resources.length > 0 && <div className={s.kindLabel}>Resource links (bottom of column)</div>}
      {resources.map((r, i) => (
        <Row key={r.id} row={r} first={i === 0} last={i === resources.length - 1} reorderable={reorderable} />
      ))}
    </>
  );
}

function Row({ row, first, last, reorderable }: { row: LinkRow; first: boolean; last: boolean; reorderable: boolean }) {
  return (
    <div className={`${s.row} ${row.is_published ? "" : s.draft}`}>
      <Order id={row.id} first={first || !reorderable} last={last || !reorderable} />
      <div style={{ minWidth: 0 }}>
        <div className={`${s.title} ${row.is_red ? s.red : ""} ${row.is_bold ? s.bold : ""}`}>{row.title}</div>
        <div className={s.meta}>
          {!row.is_published && <span className={`${s.badge} ${s.badgeDraft}`}>Draft</span>}
          {row.is_red && <span className={`${s.badge} ${s.badgeRed}`}>Red</span>}
          {row.image_url && <span className={s.badge}>Image</span>}
          <a href={row.url} target="_blank" rel="noopener">
            {row.url}
          </a>
          <span>· {fmt.format(new Date(row.updated_at))}</span>
        </div>
      </div>
      <Buttons id={row.id} title={row.title} published={row.is_published} red={row.is_red} />
    </div>
  );
}
