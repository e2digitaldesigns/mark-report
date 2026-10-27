"use client";

import { useActionState } from "react";
import { signIn } from "../actions";
import s from "../admin.module.css";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action}>
      {state?.error && <p className={s.error}>{state.error}</p>}
      <input type="hidden" name="next" value={next} />
      <label className={s.field}>
        <span className={s.label}>Email</span>
        <input className={s.input} name="email" type="email" autoComplete="username" required autoFocus />
      </label>
      <label className={s.field}>
        <span className={s.label}>Password</span>
        <input className={s.input} name="password" type="password" autoComplete="current-password" required />
      </label>
      <button className={s.btn} style={{ width: "100%" }} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
