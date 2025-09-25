import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// JournalEntry type (should match the app's model)
type ID = number;
export type JournalEntry = {
  id: ID;
  user_id: ID;
  framework_id: ID | null;
  title: string;
  content: string;
  created_at?: string;
  updated_at?: string;
};

interface JournalEntriesState {
  entries: JournalEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: JournalEntriesState = {
  entries: [],
  loading: false,
  error: null,
};

const journalEntriesSlice = createSlice({
  name: 'journalEntries',
  initialState,
  reducers: {
    setEntries(state, action: PayloadAction<JournalEntry[]>) {
      // Only update if the array reference or contents actually changed
      // (to avoid unnecessary re-renders and "children should not have changed" errors)
      const incoming = action.payload;
      if (
        state.entries.length === incoming.length &&
        state.entries.every((e, i) => e.id === incoming[i].id)
      ) {
        // If IDs and order are the same, do not replace array reference
        // (assume no change)
        return;
      }
      state.entries = incoming;
    },
    addEntry(state, action: PayloadAction<JournalEntry>) {
      // Avoid duplicate by id
      if (!state.entries.some(e => e.id === action.payload.id)) {
        state.entries = [action.payload, ...state.entries];
      }
    },
    updateEntry(state, action: PayloadAction<JournalEntry>) {
      const idx = state.entries.findIndex(e => e.id === action.payload.id);
      if (idx !== -1) {
        // Replace with new object, but keep array reference if possible
        state.entries = [
          ...state.entries.slice(0, idx),
          action.payload,
          ...state.entries.slice(idx + 1),
        ];
      }
    },
    deleteEntry(state, action: PayloadAction<ID>) {
      state.entries = state.entries.filter(e => e.id !== action.payload);
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    clearEntries(state) {
      state.entries = [];
    },
  },
});

export const {
  setEntries,
  addEntry,
  updateEntry,
  deleteEntry,
  setLoading,
  setError,
  clearEntries,
} = journalEntriesSlice.actions;

export default journalEntriesSlice.reducer;
