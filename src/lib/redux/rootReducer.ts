import { combineReducers } from '@reduxjs/toolkit';
import counterReducer from './slices/counterSlice';
import authReducer from './slices/authSlice';
import journalEntriesReducer from './slices/journalEntriesSlice'
import currentJournalReducer from './slices/currentJournalSlice'

const rootReducer = combineReducers({
  counter: counterReducer,
  auth: authReducer,
  journalEntries: journalEntriesReducer,
  currentJournal: currentJournalReducer
  // Add other reducers here
});

export default rootReducer;