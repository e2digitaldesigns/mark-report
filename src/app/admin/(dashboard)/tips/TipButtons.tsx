"use client";

import { useTransition } from "react";
import { deleteTip, setTipRead } from "../../actions";
import s from "../../admin.module.css";

export function TipButtons({ id, isRead }: { id: string; isRead: boolean }) {
  const [pending, start] = useTransition();

  return (
    <div className={s.actions} style={{ opacity: pending ? 0.5 : 1 }}>
      <button className={s.btnGhost} disabled={pending} onClick={() => start(() => setTipRead(id, !isRead))}>
        {isRead ? "Mark unread" : "Mark read"}
      </button>
      <button
        className={s.btnDanger}
        disabled={pending}
        onClick={() => {
          if (confirm("Delete this tip?")) start(() => deleteTip(id));
        }}
      >
        Delete
      </button>
    </div>
  );
}
