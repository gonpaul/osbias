import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { JournalEntry } from './journalEntriesSlice';

interface CurrentJournalState {
  current: JournalEntry | null;
  title: string;
  content: string;
  saveState: 'idle' | 'saving' | 'saved' | 'error';
  preview: boolean;
}

const initialState: CurrentJournalState = {
  current: null,
  title: '',
  content: '',
  saveState: 'idle',
  preview: false,
};

const currentJournalSlice = createSlice({
  name: 'currentJournal',
  initialState,
  reducers: {
    setCurrent(state, action: PayloadAction<JournalEntry | null>) {
      state.current = action.payload;
      state.title = action.payload?.title || '';
      state.content = action.payload?.content || '';
      state.saveState = 'idle';
    },
    // Use during save completion; do NOT touch title/content buffer
    setCurrentMeta(state, action: PayloadAction<JournalEntry | null>) {
      state.current = action.payload;
    },
    setTitle(state, action: PayloadAction<string>) {
      state.title = action.payload;
      state.saveState = 'idle';
    },
    setContent(state, action: PayloadAction<string>) {
      state.content = action.payload;
      state.saveState = 'idle';
    },
    setSaveState(state, action: PayloadAction<'idle' | 'saving' | 'saved' | 'error'>) {
      state.saveState = action.payload;
    },
    setPreview(state, action: PayloadAction<boolean>) {
      state.preview = action.payload;
    },
    clearCurrent(state) {
      state.current = null;
      state.title = '';
      state.content = '';
      state.saveState = 'idle';
      state.preview = false;
    },
  },
});

export const {
  setCurrent,
  setCurrentMeta,
  setTitle,
  setContent,
  setSaveState,
  setPreview,
  clearCurrent,
} = currentJournalSlice.actions;

export default currentJournalSlice.reducer;
