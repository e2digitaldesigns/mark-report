"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { FormState } from "../../actions";
import { SECTIONS, type Link as LinkRow, type LinkKind, type LinkSection } from "@/lib/types";
import s from "../../admin.module.css";

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  initial?: Partial<LinkRow>;
  mode: "create" | "edit";
};

export default function LinkForm({ action, initial = {}, mode }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [title, setTitle] = useState(initial.title ?? "");
  const [url, setUrl] = useState(initial.url ?? "");
  const [imageUrl, setImageUrl] = useState(initial.image_url ?? "");
  const [section, setSection] = useState<LinkSection>(initial.section ?? "col1");
  const [kind, setKind] = useState<LinkKind>(initial.kind ?? "story");
  const [published, setPublished] = useState(initial.is_published ?? true);
  const [red, setRed] = useState(initial.is_red ?? false);
  const [bold, setBold] = useState(initial.is_bold ?? false);
  const [lastOk, setLastOk] = useState<string | undefined>();

  // After "Save & add another", clear the form so the next headline can be typed.
  if (state?.ok && state.ok !== lastOk) {
    setLastOk(state.ok);
    setTitle("");
    setUrl("");
    setImageUrl("");
    setRed(false);
    setBold(false);
  }

  const big = section === "siren";

  return (
    <form action={formAction} className={s.card}>
      {state?.error && <p className={s.error}>{state.error}</p>}
      {state?.ok && <p className={s.okMsg}>{state.ok}</p>}

      <label className={s.field}>
        <span className={s.label}>Headline</span>
        <textarea
          className={s.textarea}
          name="title"
          required
          maxLength={400}
          rows={2}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="SHOCK: …"
          autoFocus
        />
        <span className={s.hint}>Tip: end with “...” for the classic tease.</span>
      </label>

      <label className={s.field}>
        <span className={s.label}>Link URL</span>
        <input
          className={s.input}
          name="url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://"
        />
      </label>

      <div className={s.grid2}>
        <label className={s.field}>
          <span className={s.label}>Section</span>
          <select
            className={s.select}
            name="section"
            value={section}
            onChange={(e) => setSection(e.target.value as LinkSection)}
          >
            {SECTIONS.map((x) => (
              <option key={x.value} value={x.value}>
                {x.label}
              </option>
            ))}
          </select>
        </label>

        <label className={s.field}>
          <span className={s.label}>Type</span>
          <select className={s.select} name="kind" value={kind} onChange={(e) => setKind(e.target.value as LinkKind)}>
            <option value="story">Story headline</option>
            <option value="resource">Resource link (bottom of column)</option>
          </select>
        </label>
      </div>

      <label className={s.field}>
        <span className={s.label}>Image URL (optional)</span>
        <input
          className={s.input}
          name="image_url"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://… shown above the headline"
        />
      </label>

      {mode === "create" && (
        <label className={s.field}>
          <span className={s.label}>Placement</span>
          <select className={s.select} name="placement" defaultValue="top">
            <option value="top">Top of section</option>
            <option value="bottom">Bottom of section</option>
          </select>
        </label>
      )}

      <div className={s.checks}>
        <label className={s.check}>
          <input type="checkbox" name="is_red" checked={red} onChange={(e) => setRed(e.target.checked)} />
          Red (urgent)
        </label>
        <label className={s.check}>
          <input type="checkbox" name="is_bold" checked={bold} onChange={(e) => setBold(e.target.checked)} />
          Bold caps
        </label>
        <label className={s.check}>
          <input
            type="checkbox"
            name="is_published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Published
        </label>
      </div>

      <div className={s.preview}>
        <span className={s.previewLabel}>Preview</span>
        <span
          className={big ? s.previewBig : undefined}
          style={{
            color: red ? "#e00000" : "#000",
            textTransform: bold || big ? "uppercase" : undefined,
          }}
        >
          {title || "Your headline here"}
        </span>
      </div>

      <div className={s.formActions}>
        <button className={s.btn} name="intent" value="save" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Publish headline" : "Save changes"}
        </button>
        {mode === "create" && (
          <button className={s.btnGhost} name="intent" value="another" disabled={pending}>
            Save &amp; add another
          </button>
        )}
        <Link href="/admin" className={s.btnGhost}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
