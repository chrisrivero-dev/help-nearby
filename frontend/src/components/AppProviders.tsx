'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import LanguageProvider from '@/components/LanguageProvider';
import { LocationProvider } from '@/components/help/LocationContext';
import { ThemeProvider } from '@/components/ThemeProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocationProvider defaultZip="90012">
          <AuthProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </AuthProvider>
        </LocationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
