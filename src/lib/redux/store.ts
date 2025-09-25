// lib/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import rootReducer from './rootReducer'; // You'll create this next

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    // Add middleware, dev tools, etc. as needed
  });
};

// Define RootState and AppDispatch types for TypeScript
// export type RootState = ReturnType<typeof rootReducer>;
// export type AppDispatch = ReturnType<typeof makeStore>['dispatch'];