import { combineReducers } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';
import authReducer from './slices/authSlice';
import journalEntriesReducer from './slices/journalEntriesSlice';
import currentJournalReducer from './slices/currentJournalSlice';
import journalHeadersReducer from './slices/journalHeadersSlice';

const rootReducer = combineReducers({
  counter: counterReducer,
  auth: authReducer,
  journalEntries: journalEntriesReducer,
  currentJournal: currentJournalReducer,
  journalHeaders: journalHeadersReducer,
  // Add other reducers here
});

export default rootReducer;