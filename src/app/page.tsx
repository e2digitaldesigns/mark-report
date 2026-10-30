import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Link, SiteSettings, TipFormPosition } from "@/lib/types";
import TipForm from "./TipForm";
import styles from "./page.module.css";

/** Cache tag the admin actions expire so edits show up instantly. */
const FRONT_PAGE_TAG = "front-page";

const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE ?? "America/New_York";

async function getData() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();

  const [links, settings] = await Promise.all([
    supabase
      .from("links")
      .select("*")
      .eq("is_published", true)
      .order("position", { ascending: true })
      .order("created_at", { ascending: false }),
    supabase.from("site_settings").select("*").maybeSingle(),
  ]);

  if (links.error) console.error("links query failed:", links.error.message);

  return {
    links: (links.data ?? []) as Link[],
    settings: (settings.data ?? null) as SiteSettings | null,
  };
}

function Headline({ link, big = false }: { link: Link; big?: boolean }) {
  const cls = [
    styles.headline,
    big && styles.big,
    link.is_red && styles.red,
    link.is_bold && styles.bold,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.item}>
      {link.image_url && (
        <a href={link.url} target="_blank" rel="noopener">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={link.image_url} alt="" className={big ? styles.sirenImg : styles.img} />
        </a>
      )}
      <a href={link.url} target="_blank" rel="noopener" className={cls}>
        {link.title}
      </a>
    </div>
  );
}

function Column({ links, children }: { links: Link[]; children?: React.ReactNode }) {
  const stories = links.filter((l) => l.kind === "story");
  const resources = links.filter((l) => l.kind === "resource");
  return (
    <div className={styles.column}>
      {stories.map((l) => (
        <Headline key={l.id} link={l} />
      ))}
      {resources.length > 0 && (
        <>
          <hr className={styles.rule} />
          <ul className={styles.resources}>
            {resources.map((l) => (
              <li key={l.id}>
                <a href={l.url} target="_blank" rel="noopener">
                  {l.title}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      {children}
    </div>
  );
}

export default async function Home() {
  "use cache";
  cacheLife("minutes"); // safety net; admin saves expire the tag immediately
  cacheTag(FRONT_PAGE_TAG);

  const data = await getData();

  if (!data) {
    return (
      <main className={styles.page}>
        <p className={styles.setup}>
          Supabase isn&apos;t configured yet. Copy <code>.env.example</code> to{" "}
          <code>.env.local</code>, fill in your project URL and key, then restart.
        </p>
      </main>
    );
  }

  const { links, settings } = data;
  const by = (s: Link["section"]) => links.filter((l) => l.section === s);
  const siren = settings?.show_siren === false ? [] : by("siren");
  const siteName = settings?.site_name ?? "THE WIRE REPORT";

  // The tip form can be switched off or placed in a column / below the page from the back office.
  const tipPosition = settings?.tip_form_position ?? "bottom";
  const tipIn = (where: TipFormPosition) =>
    settings?.show_tip_form !== false && tipPosition === where ? <TipForm siteName={siteName} /> : null;

  const latest = links.reduce<string | null>(
    (max, l) => (!max || l.updated_at > max ? l.updated_at : max),
    settings?.updated_at ?? null,
  );
  const stamp = latest
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: TIMEZONE,
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(latest))
    : "";

  return (
    <main className={styles.page}>
      {by("top").length > 0 && (
        <section className={styles.top}>
          {by("top").map((l) => (
            <Headline key={l.id} link={l} />
          ))}
        </section>
      )}

      {siren.length > 0 && (
        <section className={styles.siren}>
          {siren.map((l) => (
            <div key={l.id} className={styles.sirenRow}>
              {l.is_red && <span className={styles.beacon} aria-hidden />}
              <Headline link={l} big />
              {l.is_red && <span className={styles.beacon} aria-hidden />}
            </div>
          ))}
        </section>
      )}

      <header className={styles.masthead}>
        <h1 className={styles.logo}>{siteName}</h1>
        {settings?.tagline && <p className={styles.tagline}>{settings.tagline}</p>}
        {stamp && <p className={styles.stamp}>{stamp}</p>}
      </header>

      <hr className={styles.rule} />

      <section className={styles.columns}>
        <Column links={by("col1")}>{tipIn("col1")}</Column>
        <Column links={by("col2")}>{tipIn("col2")}</Column>
        <Column links={by("col3")}>{tipIn("col3")}</Column>
      </section>

      {tipIn("bottom")}

      <footer className={styles.footer}>
        © {new Date().getFullYear()} {siteName}
      </footer>
    </main>
  );
}
