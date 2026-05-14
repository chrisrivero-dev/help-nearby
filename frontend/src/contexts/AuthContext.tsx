'use client';

import type { FC, ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

interface CognitoConfig {
  UserPoolId: string;
  AppClientId: string;
  Region: string;
  ClientSecret: string;
}

interface AuthConfigResponse {
  userPoolId: string;
  clientId: string;
  region: string;
}

interface User {
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  config: CognitoConfig | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  redirectPath: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Build-time check for dev mode (Next.js embeds this at build time)
const IS_DEV = process.env.NEXT_PUBLIC_ENV === 'development';

export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<CognitoConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Fetch config at mount
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/auth/config');
        const data = await res.json();
        setConfig({
          UserPoolId: data.userPoolId,
          AppClientId: data.clientId,
          Region: data.region,
          ClientSecret: process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET || '',
        });
      } catch (err) {
        console.error('Failed to fetch auth config:', err);
        // Fallback to environment variables
        setConfig({
          UserPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
          AppClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || '',
          Region: process.env.NEXT_PUBLIC_COGNITO_REGION || 'us-east-1',
          ClientSecret: process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET || '',
        });
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    if (configLoading) return;

    const token = typeof window !== 'undefined' ? getCookie('authToken') : null;

    if (token) {
      // Check if we have a redirect path
      const urlParams = new URLSearchParams(window.location.search);
      const from = urlParams.get('from');

      if (from && from !== '/') {
        setRedirectPath(from);
      }
    }

    // Check localStorage for stored user
    const storedUser = localStorage.getItem('cognitoUser');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('cognitoUser');
      }
    }
  }, [configLoading]);

  // Handle redirect after login
  useEffect(() => {
    if (redirectPath && redirectPath !== '/') {
      router.push(redirectPath);
      setRedirectPath(null);
    }
  }, [redirectPath, router]);

  // Calculate SECRET_HASH for AWS Cognito (browser-compatible)
  // SECRET_HASH = HMAC_SHA256(username + client_id, client_secret)
  const calculateSecretHash = async (
    username: string,
    clientId: string,
    clientSecret: string,
  ): Promise<string> => {
    if (clientSecret === 'your_client_secret_here' || !clientSecret) {
      return '';
    }

    try {
      const encoder = new TextEncoder();
      const message = encoder.encode(username + clientId);
      const keyData = encoder.encode(clientSecret);

      // Import the HMAC key
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
      );

      // Sign the message
      const signature = await crypto.subtle.sign('HMAC', key, message);

      // Convert to base64
      let binary = '';
      const bytes = new Uint8Array(signature);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    } catch (e) {
      console.error('SECRET_HASH calculation failed:', e);
      return '';
    }
  };

  const login = async (email: string, password: string) => {
    if (!config) {
      setError('Auth configuration not loaded');
      throw new Error('Auth configuration not loaded');
    }

    setIsLoading(true);
    setError(null);

    try {
      // Dev mode bypass: skip Cognito auth and set a dev cookie
      if (IS_DEV) {
        const devUser = {
          username: email.split('@')[0] || 'dev',
          email: email,
        };

        // Set auth cookie for dev
        setCookie('authToken', 'dev-token-' + Date.now(), 1);

        setUser(devUser);
        localStorage.setItem('cognitoUser', JSON.stringify(devUser));
        localStorage.setItem('accessToken', 'dev-access-token');
        localStorage.setItem('idToken', 'dev-id-token');
        localStorage.setItem('refreshToken', 'dev-refresh-token');

        setIsLoading(false);
        return;
      }

      const client = new CognitoIdentityProviderClient({
        region: config.Region,
      });

      const authParams: any = {
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
        ClientId: config.AppClientId,
      };

      // Add SECRET_HASH if client secret is configured
      const secretHash = await calculateSecretHash(
        email,
        config.AppClientId,
        config.ClientSecret,
      );
      if (secretHash) {
        authParams.AuthParameters.SECRET_HASH = secretHash;
      }

      const result = await client.send(
        new InitiateAuthCommand({ ...authParams }),
      );

      if (result.AuthenticationResult) {
        const userResult = await client.send(
          new GetUserCommand({
            AccessToken: result.AuthenticationResult.AccessToken,
          }),
        );

        const attributes: Record<string, string> = {};
        (userResult.UserAttributes || []).forEach((attr: any) => {
          if (attr.Name && attr.Value) {
            attributes[attr.Name] = attr.Value;
          }
        });

        const cognitoUser: User = {
          username: userResult.Username || email,
          email: attributes.email || email,
        };

        // Set auth cookie
        setCookie(
          'authToken',
          result.AuthenticationResult.AccessToken || '',
          1,
        );

        setUser(cognitoUser);
        localStorage.setItem('cognitoUser', JSON.stringify(cognitoUser));
        localStorage.setItem(
          'accessToken',
          result.AuthenticationResult.AccessToken || '',
        );
        localStorage.setItem(
          'idToken',
          result.AuthenticationResult.IdToken || '',
        );
        localStorage.setItem(
          'refreshToken',
          result.AuthenticationResult.RefreshToken || '',
        );
      } else {
        throw new Error('Authentication failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cognitoUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    setCookie('authToken', '', -1); // Clear cookie
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    config,
    login,
    logout,
    error,
    redirectPath,
  };

  // Don't render children until config is loaded (to prevent race conditions)
  if (configLoading) {
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
}

function setCookie(name: string, value: string, expiryDays: number) {
  if (typeof window === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + expiryDays * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}
