import { requireAdmin } from "@/lib/auth";
import type { SiteSettings } from "@/lib/types";
import SettingsForm from "./SettingsForm";
import s from "../../admin.module.css";

export const instant = false; // per-user admin page; allowed to block

export default async function SettingsPage() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("site_settings").select("*").maybeSingle();

  return (
    <>
      <div className={s.head}>
        <div>
          <h1 className={s.h1}>Site settings</h1>
          <p className={s.sub}>Masthead and front-page options</p>
        </div>
      </div>
      <SettingsForm settings={data as SiteSettings | null} />
    </>
  );
}
