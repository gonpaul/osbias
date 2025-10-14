'use client';
import { useEffect, useState } from "react";
import { getModelsByProvider } from "@/lib/config/ai-models";
import type { UserAIPreferences } from "@/types/ai-preferences";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prefs, setPrefs] = useState<any>(null);
  const [aiPrefs, setAiPrefs] = useState<UserAIPreferences>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    maxTokens: 512
  });
  const [msg, setMsg] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");

  useEffect(() => {
    (async () => {
      const m = await fetch("/api/users/me", { credentials: "include" });
      if (m.ok) {
        const me = await m.json();
        setName(me.name); setEmail(me.email);
        // keys are not returned for security, but we can show presence flags
        // if you want to prefill, leave empty for safety
      }
      const p = await fetch("/api/users/me/preferences", { credentials: "include" });
      if (p.ok) {
        const preferences = await p.json();
        setPrefs(preferences);
        // Extract AI preferences from user preferences
        if (preferences.aiProvider && preferences.aiModel) {
          setAiPrefs({
            provider: preferences.aiProvider,
            model: preferences.aiModel,
            maxTokens: preferences.aiMaxTokens || 512
          });
        }
      }
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
      body: JSON.stringify({ name, email, openai_api_key: openaiKey || null, anthropic_api_key: anthropicKey || null }),
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

  async function saveAiPrefs(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const updatedPrefs = {
      ...prefs,
      aiProvider: aiPrefs.provider,
      aiModel: aiPrefs.model,
      aiMaxTokens: aiPrefs.maxTokens
    };
    const res = await fetch("/api/users/me/preferences", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updatedPrefs),
    });
    if (res.ok) {
      setPrefs(updatedPrefs);
      setMsg("AI preferences saved");
    } else {
      setMsg("Failed to save AI preferences");
    }
  }

  const handleExportAll = async () => {
    try {
      const res = await fetch("/api/journal/export", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_entries_${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMsg("Export completed successfully");
      } else {
        setMsg("Export failed");
      }
    } catch {
      setMsg("Export failed");
    }
  };

  const handleExportAllTxt = async () => {
    try {
      const res = await fetch("/api/journal/export?format=txt", {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_entries_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMsg("Export completed successfully");
      } else {
        setMsg("Export failed");
      }
    } catch {
      setMsg("Export failed");
    }
  };

  const handleExportZip = async (ext: 'md' | 'txt') => {
    try {
      const res = await fetch(`/api/journal/export?format=zip&ext=${ext}`, {
        method: "GET",
        credentials: "include",
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `journal_entries_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setMsg("ZIP export completed successfully");
      } else {
        setMsg("ZIP export failed");
      }
    } catch {
      setMsg("ZIP export failed");
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch("/api/journal/import", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      
      if (res.ok) {
        const result = await res.json();
        setMsg(`Successfully imported ${result.count} entries`);
        // Reset the file input
        e.target.value = '';
      } else {
        setMsg("Import failed");
      }
    } catch {
      setMsg("Import failed");
    }
  };

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
            <h2 className="text-xl font-semibold mb-4">AI Preferences</h2>
            <form onSubmit={saveAiPrefs} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">AI Provider</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="provider"
                      value="openai"
                      checked={aiPrefs.provider === 'openai'}
                      onChange={() => {
                        setAiPrefs({ ...aiPrefs, provider: 'openai', model: 'gpt-4o-mini' });
                      }}
                      className="text-[color:var(--emphasis)]"
                    />
                    <span>OpenAI</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="provider"
                      value="claude"
                      checked={aiPrefs.provider === 'claude'}
                      onChange={() => {
                        setAiPrefs({ ...aiPrefs, provider: 'claude', model: 'claude-3-5-sonnet-20241022' });
                      }}
                      className="text-[color:var(--emphasis)]"
                    />
                    <span>Claude</span>
                  </label>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">Model</span>
                <select
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={aiPrefs.model}
                  onChange={_e => setAiPrefs({ ...aiPrefs, model: _e.target.value })}
                >
                  {getModelsByProvider(aiPrefs.provider).map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">Max Tokens</span>
                <input
                  type="number"
                  min="1"
                  max="200000"
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  placeholder={aiPrefs.maxTokens.toString()}
                  onChange={e => setAiPrefs({ ...aiPrefs, maxTokens: parseInt(e.target.value) || 512 })}
                />
                <span className="text-sm text-gray-500">Maximum number of tokens in AI responses (1-200,000)</span>
              </label>
              <button
                className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto"
              >
                Save AI preferences
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-[color:var(--darkelbg)] p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">API Keys</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">OpenAI API Key</span>
                <input
                  type="password"
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={openaiKey}
                  onChange={e => setOpenaiKey(e.target.value)}
                  placeholder="sk-..."
                  autoComplete="off"
                />
                <span className="text-sm text-gray-500">Leave blank to keep unchanged. Enter null to remove.</span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">Anthropic API Key</span>
                <input
                  type="password"
                  className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-[color:var(--secondary)] focus:outline-none focus:ring-2 focus:ring-emphasis"
                  value={anthropicKey}
                  onChange={e => setAnthropicKey(e.target.value)}
                  placeholder="anthropic-key..."
                  autoComplete="off"
                />
                <span className="text-sm text-gray-500">Leave blank to keep unchanged. Enter null to remove.</span>
              </label>
              <button className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto">
                Save API keys
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
                  onChange={_e => setPrefs({ ...prefs, theme: _e.target.value })}
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

          <section className="rounded-xl bg-[color:var(--darkelbg)] p-6 md:p-[2.5vw] xl:p-[2vw] shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Data Management</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Export Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Export Data</h3>
                <p className="text-sm text-gray-600">Download your journal entries as files</p>
                <div className="space-y-3">
                  <button
                    onClick={handleExportAll}
                    className="w-full text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300"
                  >
                    Export All Entries (.md)
                  </button>
                  <button
                    onClick={handleExportAllTxt}
                    className="w-full text-lg cursor-pointer bg-gray-600 text-white font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300"
                  >
                    Export All Entries (.txt)
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleExportZip('md')}
                      className="w-full text-lg cursor-pointer bg-(--darkelbg) text-(--foreground) border border-(--secondary)/40 font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300"
                    >
                      Export ZIP (.md files)
                    </button>
                    <button
                      onClick={() => handleExportZip('txt')}
                      className="w-full text-lg cursor-pointer bg-(--darkelbg) text-(--foreground) border border-(--secondary)/40 font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300"
                    >
                      Export ZIP (.txt files)
                    </button>
                  </div>
                </div>
              </div>

              {/* Import Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Import Data</h3>
                <p className="text-sm text-gray-600">Upload .md or .txt files to create new entries</p>
                <div className="space-y-3">
                  <input
                    type="file"
                    id="import-file"
                    accept=".md,.txt"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                  <label
                    htmlFor="import-file"
                    className="w-full text-lg cursor-pointer bg-green-600 text-white font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300 block text-center"
                  >
                    Choose File to Import
                  </label>
                  <p className="text-xs text-gray-500">
                    Supported formats: .md, .txt
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {msg && (
          <p className="mt-6 text-center text-[color:var(--emphasis)]">{msg}</p>
        )}
      </div>
    </div>
  );
}
