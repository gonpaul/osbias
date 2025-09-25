'use client';
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [prefs, setPrefs] = useState<any>({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    (async () => {
      const m = await fetch("/api/users/me", { credentials: "include" });
      if (m.ok) {
        const me = await m.json();
        setName(me.name); setEmail(me.email);
      }
      const p = await fetch("/api/users/me/preferences", { credentials: "include" });
      if (p.ok) setPrefs(await p.json());
      setLoading(false);
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, email }),
    });
    setMsg(res.ok ? "Profile saved" : "Failed to save profile");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users/me/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    setMsg(res.status === 204 ? "Password changed" : "Password change failed");
    setOldPassword(""); setNewPassword("");
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const res = await fetch("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(prefs),
    });
    setMsg(res.ok ? "Preferences saved" : "Failed to save preferences");
  }

  if (loading) return <div className="p-8">Loading…</div>;

  return (
    <div className="w-full text-[color:var(--foreground)]">
      <div className="mx-auto max-w-[min(94vw,1400px)] px-4 md:px-[4vw] lg:px-[6vw] py-10 mt-15">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">Profile</h1>
          <p className="mt-2 opacity-80">
            Manage your account details, security, and preferences.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-[2.5vw]">
          <section className="rounded-xl bg-[color:var(--darkelbg)] p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">Account details</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">Name</span>
                <input
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">Email</span>
                <input
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </label>
              <button
                className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto"
              >
                Save
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-[color:var(--darkelbg)] p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">Preferences</h2>
            <form onSubmit={savePrefs} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">Theme</span>
                <select
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={prefs.theme || "system"}
                  onChange={e => setPrefs({ ...prefs, theme: e.target.value })}
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </label>
              <button
                className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto"
              >
                Save preferences
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-[color:var(--darkelbg)] p-6 md:p-[2.5vw] xl:p-[2vw] shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Change password</h2>
            <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex flex-col gap-2 md:col-span-1">
                <span className="text-lg">Current password</span>
                <input
                  type="password"
                  placeholder="Current password"
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
              <label className="flex flex-col gap-2 md:col-span-1">
                <span className="text-lg">New password (min 6)</span>
                <input
                  type="password"
                  placeholder="New password (min 6)"
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </label>
              <div className="flex items-end md:col-span-1">
                <button
                  className="w-full md:w-auto text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300"
                >
                  Update password
                </button>
              </div>
            </form>
          </section>
        </div>

        {msg && (
          <p className="mt-6 text-center text-[color:var(--emphasis)]">{msg}</p>
        )}
      </div>
    </div>
  );
}
