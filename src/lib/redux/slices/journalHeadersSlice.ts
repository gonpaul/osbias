import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { JournalEntryHeader } from '@/models/journal';

interface JournalHeadersState {
  headers: JournalEntryHeader[];
  loading: boolean;
  error: string | null;
}

const initialState: JournalHeadersState = {
  headers: [],
  loading: false,
  error: null,
};

const journalHeadersSlice = createSlice({
  name: 'journalHeaders',
  initialState,
  reducers: {
    setHeaders(state, action: PayloadAction<JournalEntryHeader[]>) {
      state.headers = action.payload;
    },
    addHeader(state, action: PayloadAction<JournalEntryHeader>) {
      if (!state.headers.some(h => h.id === action.payload.id)) {
        state.headers = [action.payload, ...state.headers];
      }
    },
    updateHeader(state, action: PayloadAction<Partial<JournalEntryHeader> & { id: number }>) {
      const idx = state.headers.findIndex(h => h.id === action.payload.id);
      if (idx !== -1) {
        state.headers[idx] = { ...state.headers[idx], ...action.payload };
      }
    },
    removeHeader(state, action: PayloadAction<number>) {
      state.headers = state.headers.filter(h => h.id !== action.payload);
    },
    // Replace a temporary draft header (negative ID) with the real one from DB
    replaceTempHeader(state, action: PayloadAction<JournalEntryHeader>) {
      // Remove any negative-ID temp header, then add the real one
      state.headers = state.headers.filter(h => h.id >= 0);
      state.headers = [action.payload, ...state.headers];
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  setHeaders,
  addHeader,
  updateHeader,
  removeHeader,
  replaceTempHeader,
  setLoading,
  setError,
} = journalHeadersSlice.actions;

export default journalHeadersSlice.reducer;
