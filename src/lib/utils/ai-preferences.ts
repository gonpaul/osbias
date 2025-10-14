import type { UserAIPreferences } from '@/types/ai-preferences';
import { DEFAULT_AI_PREFERENCES } from '@/lib/config/ai-models';

export function parseUserAIPreferences(preferencesJson: string | null): UserAIPreferences {
  if (!preferencesJson) {
    return DEFAULT_AI_PREFERENCES;
  }
  
  try {
    const prefs = JSON.parse(preferencesJson);
    return {
      provider: prefs.aiProvider || DEFAULT_AI_PREFERENCES.provider,
      model: prefs.aiModel || DEFAULT_AI_PREFERENCES.model,
      maxTokens: typeof prefs.maxTokens === 'number' ? prefs.maxTokens : DEFAULT_AI_PREFERENCES.maxTokens
    };
  } catch {
    return DEFAULT_AI_PREFERENCES;
  }
}

export function mergeAIPreferences(
  existingPrefs: string | null, 
  aiPrefs: UserAIPreferences
): string {
  let existing = {};
  if (existingPrefs) {
    try {
      existing = JSON.parse(existingPrefs);
    } catch {
      // If parsing fails, start with empty object
    }
  }
  
  return JSON.stringify({
    ...existing,
    aiProvider: aiPrefs.provider,
    aiModel: aiPrefs.model,
    maxTokens: aiPrefs.maxTokens
  });
}
