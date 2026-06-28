'use client';

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState, useCallback } from 'react';

interface OllamaEndpointContextValue {
  endpoint: string;
  setEndpoint: (endpoint: string) => void;
}

const OllamaEndpointContext = createContext<
  OllamaEndpointContextValue | undefined
>(undefined);

interface OllamaEndpointProviderProps {
  children: ReactNode;
  defaultEndpoint?: string;
}

export const OllamaEndpointProvider: FC<OllamaEndpointProviderProps> = ({
  children,
  defaultEndpoint = 'http://localhost:11434',
}) => {
  const [endpoint, setEndpointState] = useState<string>(defaultEndpoint);

  const setEndpoint = useCallback((newEndpoint: string) => {
    setEndpointState(newEndpoint.trim());
  }, []);

  const value: OllamaEndpointContextValue = {
    endpoint,
    setEndpoint,
  };

  return (
    <OllamaEndpointContext.Provider value={value}>
      {children}
    </OllamaEndpointContext.Provider>
  );
};

export const useOllamaEndpoint = () => {
  const ctx = useContext(OllamaEndpointContext);
  if (!ctx)
    throw new Error(
      'useOllamaEndpoint must be used within OllamaEndpointProvider',
    );
  return ctx;
};

export const useOptionalOllamaEndpoint = () =>
  useContext(OllamaEndpointContext);
