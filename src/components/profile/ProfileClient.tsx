'use client';

import { useState, useEffect } from 'react';
import { getModelsByProvider } from '@/lib/config/ai-models';
import type { UserAIPreferences } from '@/types/ai-preferences';
import { useTranslations } from 'next-intl';
import { useTheme } from '@/lib/hooks/use-theme';

type Profile = {
  id: number;
  name: string;
  email: string;
  picture?: string | null;
  nickname?: string | null;
};

type Prefs = {
  theme?: string;
  aiProvider?: string;
  aiModel?: string;
  aiMaxTokens?: number;
};

type Props = {
  profile: Profile;
  preferences: Prefs;
};

export default function ProfileClient({ profile, preferences }: Props) {
  const t = useTranslations('Profile');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [prefs, setPrefs] = useState<any>(preferences);
  const [aiPrefs, setAiPrefs] = useState<UserAIPreferences>({
    provider: (preferences.aiProvider as UserAIPreferences['provider']) || 'openrouter',
    model: preferences.aiModel || 'gpt-4o-mini',
    maxTokens: preferences.aiMaxTokens || 512,
  });
  const [msg, setMsg] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [anthropicKey, setAnthropicKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');

  // Apply theme from preferences on mount
  const { setTheme } = useTheme();

  useEffect(() => {
    if (preferences?.theme) {
      setTheme(preferences.theme as 'light' | 'dark' | 'system');
    }
  }, [preferences.theme, setTheme]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/users/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, openai_api_key: openaiKey || null, anthropic_api_key: anthropicKey || null, openrouter_api_key: openrouterKey || null }),
    });
    setMsg(res.ok ? t('profileSaved') : t('profileSaveFailed'));
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/users/me/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
    setMsg(res.status === 204 ? t('passwordChanged') : t('passwordChangeFailed'));
    setOldPassword(''); setNewPassword('');
  }

  async function savePrefs(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const res = await fetch('/api/users/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(prefs),
    });
    setMsg(res.ok ? t('preferencesSaved') : t('preferencesSaveFailed'));
  }

  async function saveAiPrefs(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const updatedPrefs = {
      ...prefs,
      aiProvider: aiPrefs.provider,
      aiModel: aiPrefs.model,
      aiMaxTokens: aiPrefs.maxTokens,
    };
    const res = await fetch('/api/users/me/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updatedPrefs),
    });
    if (res.ok) {
      setPrefs(updatedPrefs);
      setMsg(t('aiPreferencesSaved'));
    } else {
      setMsg(t('aiPreferencesSaveFailed'));
    }
  }

  const handleExportAll = async () => {
    try {
      const res = await fetch('/api/journal/export', { method: 'GET', credentials: 'include' });
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
        setMsg(t('exportCompleted'));
      } else {
        setMsg(t('exportFailed'));
      }
    } catch {
      setMsg(t('exportFailed'));
    }
  };

  const handleExportAllTxt = async () => {
    try {
      const res = await fetch('/api/journal/export?format=txt', { method: 'GET', credentials: 'include' });
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
        setMsg(t('exportCompleted'));
      } else {
        setMsg(t('exportFailed'));
      }
    } catch {
      setMsg(t('exportFailed'));
    }
  };

  const handleExportZip = async (ext: 'md' | 'txt') => {
    try {
      const res = await fetch(`/api/journal/export?format=zip&ext=${ext}`, { method: 'GET', credentials: 'include' });
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
        setMsg(t('zipExportCompleted'));
      } else {
        setMsg(t('zipExportFailed'));
      }
    } catch {
      setMsg(t('zipExportFailed'));
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/journal/import', { method: 'POST', credentials: 'include', body: formData });
      if (res.ok) {
        const result = await res.json();
        setMsg(t('importSuccess', { count: result.count }));
        e.target.value = '';
      } else {
        setMsg(t('importFailed'));
      }
    } catch {
      setMsg(t('importFailed'));
    }
  };

  return (
    <div className="w-full text-(--foreground)">
      <div className="mx-auto max-w-[min(94vw,1400px)] px-4 md:px-[4vw] lg:px-[6vw] py-10 mt-15">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold">{t('title')}</h1>
          <p className="mt-2 opacity-80">{t('subtitle')}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-[2.5vw]">
          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">{t('accountDetails')}</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('name')}</span>
                <input className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('email')}</span>
                <input className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
              </label>
              <button className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto">
                {t('save')}
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">{t('aiPreferences')}</h2>
            <form onSubmit={saveAiPrefs} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('aiProvider')}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="provider" value="openai" checked={aiPrefs.provider === 'openai'} onChange={() => setAiPrefs({ ...aiPrefs, provider: 'openai', model: 'gpt-4o-mini' })} className="text-[color:var(--golden)] accent-(--foreground)" />
                    <span>OpenAI</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="provider" value="claude" checked={aiPrefs.provider === 'claude'} onChange={() => setAiPrefs({ ...aiPrefs, provider: 'claude', model: 'claude-3-5-sonnet-20241022' })} className="text-[color:var(--golden)] accent-(--foreground)" />
                    <span>Claude</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="provider" value="openrouter" checked={aiPrefs.provider === 'openrouter'} onChange={() => setAiPrefs({ ...aiPrefs, provider: 'openrouter', model: 'openrouter/auto' })} className="text-[color:var(--golden)] accent-(--foreground)" />
                    <span>OpenRouter</span>
                  </label>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('model')}</span>
                <select className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={aiPrefs.model} onChange={_e => setAiPrefs({ ...aiPrefs, model: _e.target.value })}>
                  {getModelsByProvider(aiPrefs.provider).map(model => (
                    <option key={model.id} value={model.id}>{model.name} - {model.description}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('maxTokens')}</span>
                <input type="number" min="1" max="200000" className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" placeholder={aiPrefs.maxTokens.toString()} onChange={e => setAiPrefs({ ...aiPrefs, maxTokens: parseInt(e.target.value) || 512 })} />
                <span className="text-sm text-(--secondary)">{t('maxTokensHint')}</span>
              </label>
              <button className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto">
                {t('saveAiPreferences')}
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">{t('apiKeys')}</h2>
            <form onSubmit={saveProfile} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('openaiKey')}</span>
                <input type="password" className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={openaiKey} onChange={e => setOpenaiKey(e.target.value)} placeholder="sk-..." autoComplete="off" />
                <span className="text-sm text-(--secondary)">{t('apiKeyHint')}</span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('anthropicKey')}</span>
                <input type="password" className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={anthropicKey} onChange={e => setAnthropicKey(e.target.value)} placeholder="anthropic-key..." autoComplete="off" />
                <span className="text-sm text-(--secondary)">{t('apiKeyHint')}</span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('openrouterKey')}</span>
                <input type="password" className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={openrouterKey} onChange={e => setOpenrouterKey(e.target.value)} placeholder="sk-or-..." autoComplete="off" />
                <span className="text-sm text-(--secondary)">{t('apiKeyHint')}</span>
              </label>
              <button className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto">
                {t('saveApiKeys')}
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow">
            <h2 className="text-xl font-semibold mb-4">{t('preferences')}</h2>
            <form onSubmit={savePrefs} className="flex flex-col gap-6">
              <label className="flex flex-col gap-2">
                <span className="text-lg">{t('theme')}</span>
                <select className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={prefs.theme || "system"} onChange={_e => { const val = _e.target.value; setPrefs({ ...prefs, theme: val }); setTheme(val as 'light' | 'dark' | 'system'); }}>
                  <option value="system">{t('themeSystem')}</option>
                  <option value="light">{t('themeLight')}</option>
                  <option value="dark">{t('themeDark')}</option>
                </select>
              </label>
              <button className="mt-2 text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300 w-full md:w-auto">
                {t('savePreferences')}
              </button>
            </form>
          </section>

          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">{t('changePassword')}</h2>
            <form onSubmit={changePassword} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <label className="flex flex-col gap-2 md:col-span-1">
                <span className="text-lg">{t('currentPassword')}</span>
                <input type="password" placeholder={t('currentPassword')} className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={oldPassword} onChange={e => setOldPassword(e.target.value)} autoComplete="current-password" />
              </label>
              <label className="flex flex-col gap-2 md:col-span-1">
                <span className="text-lg">{t('newPassword')}</span>
                <input type="password" placeholder={t('newPassword')} className="border border-gray-300 text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] rounded-md px-3 py-2 bg-white text-(--secondary) focus:outline-none focus:ring-2 focus:ring-(--golden)" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
              </label>
              <div className="flex items-end md:col-span-1">
                <button className="w-full md:w-auto text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 lg:px-[1.8vw] rounded hover:opacity-85 transition-opacity duration-300">
                  {t('updatePassword')}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-xl bg-(--darkelbg) p-6 md:p-[2.5vw] xl:p-[2vw] shadow md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">{t('dataManagement')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('exportData')}</h3>
                <p className="text-sm text-(--secondary)">{t('exportDataHint')}</p>
                <div className="space-y-3">
                  <button onClick={handleExportAll} className="w-full text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300">{t('exportMd')}</button>
                  <button onClick={handleExportAllTxt} className="w-full text-lg cursor-pointer bg-(--darkelbg) text-(--foreground) font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300">{t('exportTxt')}</button>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleExportZip('md')} className="w-full text-lg cursor-pointer bg-(--darkelbg) text-(--foreground) border border-(--secondary)/40 font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300">
                      {t('exportZipMd')}
                    </button>
                    <button onClick={() => handleExportZip('txt')} className="w-full text-lg cursor-pointer bg-(--darkelbg) text-(--foreground) border border-(--secondary)/40 font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300">
                      {t('exportZipTxt')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('importData')}</h3>
                <p className="text-sm text-(--secondary)">{t('importDataHint')}</p>
                <div className="space-y-3">
                  <input type="file" id="import-file" accept=".md,.txt" onChange={handleFileImport} className="hidden" />
                  <label htmlFor="import-file" className="w-full text-lg cursor-pointer bg-[color:var(--emphasis)] text-white font-semibold py-2 px-4 rounded hover:opacity-85 transition-opacity duration-300 block text-center">{t('chooseFile')}</label>
                  <p className="text-xs text-(--secondary)">{t('importSupportedFormats')}</p>
                </div>
              </div>
            </div>
          </section>
        </div>
        {msg && <div className="mt-4 text-sm text-(--secondary)">{msg}</div>}
      </div>
    </div>
  );
}
