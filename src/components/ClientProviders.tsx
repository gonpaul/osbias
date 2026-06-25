'use client';

import { ReactNode } from 'react';
import ReduxProvider from '@/lib/redux/ReduxProvider';
import SessionBootstrap from '@/lib/redux/SessionBootstrap';
import ShortcutsHelp from '@/components/ShortcutsHelp';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider>
      <SessionBootstrap />
      <ShortcutsHelp />
      {children}
    </ReduxProvider>
  );
}
