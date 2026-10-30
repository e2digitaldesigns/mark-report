"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { createPublicClient } from "@/lib/supabase/public";

export type TipState = { error?: string; ok?: string } | undefined;

const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY;

async function clientIp() {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

/** Stored instead of the raw IP: stable enough to rate-limit, not reversible. */
function hashIp(ip: string) {
  const salt = process.env.TIP_IP_SALT ?? TURNSTILE_SECRET ?? "";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

async function passesCaptcha(token: string, ip: string | null) {
  if (!TURNSTILE_SECRET) {
    console.warn("TURNSTILE_SECRET_KEY is not set — CAPTCHA check skipped.");
    return true;
  }
  if (!token) return false;
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({ secret: TURNSTILE_SECRET, response: token, ...(ip ? { remoteip: ip } : {}) }),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

/** Public "send news tip" form: honeypot → CAPTCHA → per-IP limit (enforced in the DB). */
export async function submitTip(_prev: TipState, formData: FormData): Promise<TipState> {
  // Honeypot: real visitors never see this field, bots fill it in.
  if (String(formData.get("website") ?? "").trim()) return { ok: "Thanks — tip received." };

  const message = String(formData.get("message") ?? "").trim();
  if (!message) return { error: "Please enter your tip." };
  if (message.length > 5000) return { error: "That's too long (5,000 characters max)." };

  const ip = await clientIp();
  const token = String(formData.get("cf-turnstile-response") ?? "");
  if (!(await passesCaptcha(token, ip))) {
    return { error: "Please complete the CAPTCHA and try again." };
  }

  const { data, error } = await createPublicClient().rpc("submit_tip", {
    p_message: message,
    p_ip_hash: ip ? hashIp(ip) : null,
  });
  if (error) return { error: "Sorry, something went wrong. Please try again." };
  if (data === "rate_limited") return { error: "You've sent several tips recently. Please try again later." };
  if (data !== "ok") return { error: "Please enter your tip." };

  return { ok: "Thanks — tip received." };
}
