"use client";

import { useActionState } from "react";
import { saveSettings } from "../../actions";
import { TIP_FORM_POSITIONS, type SiteSettings } from "@/lib/types";
import s from "../../admin.module.css";

export default function SettingsForm({ settings }: { settings: SiteSettings | null }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);

  return (
    <form action={action} className={s.card}>
      {state?.error && <p className={s.error}>{state.error}</p>}
      {state?.ok && <p className={s.okMsg}>{state.ok}</p>}

      <label className={s.field}>
        <span className={s.label}>Site name (masthead)</span>
        <input className={s.input} name="site_name" required defaultValue={settings?.site_name ?? "THE WIRE REPORT"} />
      </label>

      <label className={s.field}>
        <span className={s.label}>Tagline (optional)</span>
        <input className={s.input} name="tagline" defaultValue={settings?.tagline ?? ""} />
      </label>

      <div className={s.checks}>
        <label className={s.check}>
          <input type="checkbox" name="show_siren" defaultChecked={settings?.show_siren ?? true} />
          Show the siren lead headline
        </label>
        <label className={s.check}>
          <input type="checkbox" name="show_tip_form" defaultChecked={settings?.show_tip_form ?? true} />
          Show the “Send news tips” form
        </label>
      </div>

      <label className={s.field}>
        <span className={s.label}>Where the tip form appears</span>
        <select className={s.select} name="tip_form_position" defaultValue={settings?.tip_form_position ?? "bottom"}>
          {TIP_FORM_POSITIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <div className={s.formActions}>
        <button className={s.btn} disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </button>
      </div>
    </form>
  );
}
