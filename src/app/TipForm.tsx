"use client";

import Script from "next/script";
import { useActionState, useEffect, useRef } from "react";
import { submitTip } from "./actions";
import styles from "./page.module.css";

declare global {
  interface Window {
    turnstile?: { reset: () => void };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export default function TipForm({ siteName }: { siteName: string }) {
  const [state, action, pending] = useActionState(submitTip, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  // After every attempt the CAPTCHA token is spent; get a fresh one.
  useEffect(() => {
    if (!state) return;
    if (state.ok) formRef.current?.reset();
    window.turnstile?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className={styles.tips}>
      <label htmlFor="tip-message" className={styles.tipsLabel}>
        SEND NEWS TIPS TO {siteName}
      </label>
      <textarea id="tip-message" name="message" className={styles.tipsBox} maxLength={5000} required />
      {/* honeypot — hidden from people, tempting to bots */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className={styles.tipsHp} aria-hidden />
      {SITE_KEY && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
          <div className="cf-turnstile" data-sitekey={SITE_KEY} data-size="flexible" style={{ maxWidth: 300 }} />
        </>
      )}
      <button className={styles.tipsBtn} disabled={pending}>
        {pending ? "SENDING…" : "SUBMIT"}
      </button>
      {state?.error && <p className={styles.tipsError}>{state.error}</p>}
      {state?.ok && <p className={styles.tipsOk}>{state.ok}</p>}
    </form>
  );
}
