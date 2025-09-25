// lib/redux/ReduxProvider.js
'use client'; // This directive marks the component as a client component

import { Provider } from 'react-redux';
import { makeStore } from './store'; // Import your store creation function
import { ReactNode } from 'react';

interface ReduxProviderProps {
  children: ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  const store = makeStore(); // Create a new store instance for each request/client
  return <Provider store={store}>{children}</Provider>;
}