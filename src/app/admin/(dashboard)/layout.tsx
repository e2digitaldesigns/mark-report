import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "../actions";
import s from "../admin.module.css";

export const metadata = { title: "Admin" };

// The back office is per-user and always dynamic; it's fine for it to block.
export const instant = false;

async function AdminGate({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins before any content renders
  return <>{children}</>;
}

async function UserBadge() {
  const { email } = await requireAdmin();
  return <span>{email}</span>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.shell}>
      <header className={s.bar}>
        <Link href="/admin" className={s.brand}>
          BACK OFFICE
        </Link>
        <nav className={s.nav}>
          <Link href="/admin">Headlines</Link>
          <Link href="/admin/links/new">New</Link>
          <Link href="/admin/tips">Tips</Link>
          <Link href="/admin/settings">Settings</Link>
          <a href="/" target="_blank" rel="noopener">
            View site ↗
          </a>
        </nav>
        <div className={s.user}>
          <Suspense fallback={null}>
            <UserBadge />
          </Suspense>
          <form action={signOut}>
            <button className={s.linkBtn}>Sign out</button>
          </form>
        </div>
      </header>
      <main className={s.main}>
        <Suspense fallback={<p className={s.sub}>Loading…</p>}>
          <AdminGate>{children}</AdminGate>
        </Suspense>
      </main>
    </div>
  );
}
