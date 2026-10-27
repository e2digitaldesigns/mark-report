import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { signOut } from "../actions";
import LoginForm from "./LoginForm";
import s from "../admin.module.css";

export const metadata = { title: "Sign in · Admin" };

export default function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  return (
    <div className={s.shell}>
      <div className={s.loginWrap}>
        <div className={`${s.card} ${s.loginCard}`}>
          <div className={s.loginLogo}>BACK OFFICE</div>
          <p className={s.loginSub}>Sign in to manage headlines</p>
          <Suspense fallback={null}>
            <LoginBody searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

async function LoginBody({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/admin";

  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims?.sub) {
      const { data: isAdmin } = await supabase.rpc("is_admin");
      if (isAdmin) redirect("/admin");
      const email = (data.claims.email as string) ?? "This account";
      return (
        <>
          <p className={s.error}>
            {email} is signed in but isn&apos;t an admin. Add the user to the <code>admins</code> table,
            or sign in with another account.
          </p>
          <form action={signOut}>
            <button className={s.btnGhost} style={{ width: "100%" }}>
              Sign out
            </button>
          </form>
        </>
      );
    }
  } else {
    return <p className={s.error}>Supabase env vars are missing — see .env.example.</p>;
  }

  return <LoginForm next={next} />;
}
