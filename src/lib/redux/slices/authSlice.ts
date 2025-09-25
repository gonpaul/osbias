import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

type User = { id: number; name: string; email: string; role: 'user' | 'admin' } | null;

export const fetchMe = createAsyncThunk("auth/fetchMe", async () => {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) return null;
  return (await res.json()) as User;
});

const slice = createSlice({
  name: "auth",
  initialState: { user: null as User, loading: false },
  reducers: {
    clearUser(state) { state.user = null; },
  },
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => { s.loading = true; });
    b.addCase(fetchMe.fulfilled, (s, a) => { s.loading = false; s.user = a.payload; });
    b.addCase(fetchMe.rejected, (s) => { s.loading = false; s.user = null; });
  },
});

export const { clearUser } = slice.actions;
export default slice.reducer;
