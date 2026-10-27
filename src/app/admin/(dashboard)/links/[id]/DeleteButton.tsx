"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteLink } from "../../../actions";
import s from "../../../admin.module.css";

export function DeleteButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <button
      className={s.btnDanger}
      disabled={pending}
      onClick={() => {
        if (!confirm(`Delete this headline?\n\n${title}`)) return;
        start(async () => {
          await deleteLink(id);
          router.push("/admin");
        });
      }}
    >
      {pending ? "Deleting…" : "Delete headline"}
    </button>
  );
}
