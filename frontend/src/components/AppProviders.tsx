'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import LanguageProvider from '@/components/LanguageProvider';
import { LocationProvider } from '@/components/help/LocationContext';
import { ThemeProvider } from '@/components/ThemeProvider';
import { OllamaEndpointProvider } from '@/contexts/OllamaEndpointContext';

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
          <OllamaEndpointProvider>
            <AuthProvider>
              <LanguageProvider>{children}</LanguageProvider>
            </AuthProvider>
          </OllamaEndpointProvider>
        </LocationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
