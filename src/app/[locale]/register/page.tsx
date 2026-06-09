"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "@/lib/redux/store";
import { fetchMe } from "@/lib/redux/slices/authSlice";
import { useTranslations, useLocale } from "next-intl";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const t = useTranslations('Auth');
  const locale = useLocale();
  const loc = locale || 'en';

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
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      let msg = t('registrationFailed');
      try { const j = await res.json(); if (j?.error) msg = j.error; } catch {}
      setErr(msg);
      setLoading(false);
      return;
    }
    await dispatch(fetchMe());
    router.push(`/${loc}/`);
  }

  return (
    <div className="flex flex-col min-h-screen justify-center items-center pb-40 text-[color:var(--foreground)]">
      <div className="max-w-[400px] w-full flex flex-col bg-[color:var(--darkelbg)] rounded-xl p-20">
        <h2 className="text-3xl font-semibold text-center mb-6">{t('register')}</h2>
        <form onSubmit={onSubmit} className="flex flex-col gap-6 p-8 rounded shadow">
          <label className="flex flex-col gap-2">
            <span className="text-lg">{t('name')}</span>
            <input
              className="border border-gray-300 text-lg rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
              value={name}
              onChange={e => setName(e.target.value)}
              autoComplete="name"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-lg">{t('email')}</span>
            <input
              className="border border-gray-300 text-lg rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-lg">{t('password')}</span>
            <input
              type="password"
              className="border border-gray-300 text-lg rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
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
            {loading ? t('creating') : t('createAccount')}
          </button>
        </form>
      </div>
    </div>
  );
}
