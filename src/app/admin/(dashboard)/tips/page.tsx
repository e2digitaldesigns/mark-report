import { requireAdmin } from "@/lib/auth";
import type { Tip } from "@/lib/types";
import { TipButtons } from "./TipButtons";
import s from "../../admin.module.css";

export const instant = false; // per-user admin page; allowed to block

const fmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export default async function TipsPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("tips")
    .select("*")
    .order("created_at", { ascending: false });

  const tips = (data ?? []) as Tip[];
  const unread = tips.filter((t) => !t.is_read).length;

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>News tips</h1>
          <p className={s.sub}>
            {tips.length} total · {unread} unread
          </p>
        </div>
      </div>

      {error && <p className={s.error}>{error.message}</p>}

      <section className={s.group}>
        {tips.length === 0 ? (
          <p className={s.empty}>No tips yet.</p>
        ) : (
          tips.map((t) => (
            <div key={t.id} className={s.row} style={{ gridTemplateColumns: "1fr auto", opacity: t.is_read ? 0.65 : 1 }}>
              <div style={{ minWidth: 0 }}>
                <div className={s.meta}>
                  {!t.is_read && <span className={`${s.badge} ${s.badgeRed}`}>New</span>}
                  <span>{fmt.format(new Date(t.created_at))}</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", marginTop: 4 }}>{t.message}</div>
              </div>
              <TipButtons id={t.id} isRead={t.is_read} />
            </div>
          ))
        )}
      </section>
    </>
  );
}
