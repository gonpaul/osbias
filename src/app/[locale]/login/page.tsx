"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux/store";
import { fetchMe } from "@/lib/redux/slices/authSlice";
import { useTranslations, useLocale } from "next-intl";
import { defaultLocale } from "@/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const t = useTranslations('Auth');
  const locale = useLocale();

  const loc = (locale || defaultLocale) as string;

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) router.replace(`/${loc}/`);
    })();
  }, [router, loc]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setErr(t('invalidCredentials'));
      setLoading(false);
      return;
    }
    await dispatch(fetchMe());
    router.push(`/${loc}/`);
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center pb-40 text-[color:var(--foreground)]">
      <div className="max-w-[400px] w-full flex flex-col bg-[color:var(--darkelbg)] rounded-xl p-20">
        <h2 className="text-3xl font-semibold text-center mb-6">{t('login')}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-6 p-8 rounded shadow">
          <label className="flex flex-col gap-2">
            <span className="text-lg">{t('email')}</span>
            <input
              className="border border-gray-300 text-lg rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-lg">{t('password')}</span>
            <input
              type="password"
              className="border border-gray-300 text-lg rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>
          {err && (
            <p className="text-red-600 text-lg">{err}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 rounded hover:bg-[color:var(--emphasis)] hover:opacity-85 transition-opacity duration-300 disabled:opacity-60"
          >
            {loading ? t('signingIn') : t('login')}
          </button>
        </form>
        <div className="mt-6 flex px-10 justify-between items-center text-base">
          <span>{t('dontHaveAccount')}</span>
          <a
            href={`/${loc}/register`}
            className="text-[color:var(--emphasis-light)] relative hover:opacity-85 transition-opacity duration-300
              after:content-[''] after:absolute after:left-0 after:-bottom-0.5 after:w-0 after:h-[2px] after:bg-[color:var(--emphasis-light)] after:transition-all after:duration-300 hover:after:w-full ml-2"
            style={{ textDecoration: "none" }}
          >
            {t('createOne')}
          </a>
        </div>
      </div>
    </div>
  );
}
