"use client";

import Link from "next/link";
import { useTransition } from "react";
import { deleteLink, moveLink, togglePublished, toggleRed } from "../actions";
import s from "../admin.module.css";

export function Order({ id, first, last }: { id: string; first: boolean; last: boolean }) {
  const [pending, start] = useTransition();
  return (
    <div className={s.order}>
      <button
        className={s.iconBtn}
        disabled={first || pending}
        onClick={() => start(() => moveLink(id, "up"))}
        aria-label="Move up"
        title="Move up"
      >
        ▲
      </button>
      <button
        className={s.iconBtn}
        disabled={last || pending}
        onClick={() => start(() => moveLink(id, "down"))}
        aria-label="Move down"
        title="Move down"
      >
        ▼
      </button>
    </div>
  );
}

export function Buttons({ id, title, published, red }: { id: string; title: string; published: boolean; red: boolean }) {
  const [pending, start] = useTransition();

  return (
    <div className={s.actions} style={{ opacity: pending ? 0.5 : 1 }}>
      <button
        className={s.btnGhost}
        disabled={pending}
        onClick={() => start(() => toggleRed(id, !red))}
        title="Toggle red / urgent"
      >
        {red ? "Un-red" : "Red"}
      </button>
      <button
        className={s.btnGhost}
        disabled={pending}
        onClick={() => start(() => togglePublished(id, !published))}
      >
        {published ? "Unpublish" : "Publish"}
      </button>
      <Link href={`/admin/links/${id}`} className={s.btnGhost}>
        Edit
      </Link>
      <button
        className={s.btnDanger}
        disabled={pending}
        onClick={() => {
          if (confirm(`Delete this headline?\n\n${title}`)) start(() => deleteLink(id));
        }}
      >
        Delete
      </button>
    </div>
  );
}

