'use client';

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

const SECRET_ARN =
  process.env.NEXT_PUBLIC_SECRETS_ARN ||
  'arn:aws:secretsmanager:us-east-1:033313105753:secret:helpnearby/frontend-qc4pl3';
const REGION = process.env.NEXT_PUBLIC_SECRETS_REGION || 'us-east-1';

// Cache secrets to avoid repeated API calls
let secretsCache: Record<string, string> = {};

export async function getSecrets(): Promise<Record<string, string>> {
  if (secretsCache) {
    return secretsCache;
  }

  try {
    const client = new SecretsManagerClient({ region: REGION });

    const command = new GetSecretValueCommand({ SecretId: SECRET_ARN });
    const response = await client.send(command);

    if (response.SecretString) {
      secretsCache = JSON.parse(response.SecretString);
      return secretsCache;
    }

    // Fallback to environment variables if Secrets Manager fails
    return {
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'production',
      NEXT_PUBLIC_COGNITO_USER_POOL_ID:
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      NEXT_PUBLIC_COGNITO_APP_CLIENT_ID:
        process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || '',
      NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION || '',
      NEXT_PUBLIC_COGNITO_CLIENT_SECRET:
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET || '',
    };
  } catch (error) {
    console.error('Failed to fetch secrets from AWS Secrets Manager:', error);
    // Fallback to environment variables
    return {
      NEXT_PUBLIC_ENV: process.env.NEXT_PUBLIC_ENV || 'production',
      NEXT_PUBLIC_COGNITO_USER_POOL_ID:
        process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || '',
      NEXT_PUBLIC_COGNITO_APP_CLIENT_ID:
        process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || '',
      NEXT_PUBLIC_COGNITO_REGION: process.env.NEXT_PUBLIC_COGNITO_REGION || '',
      NEXT_PUBLIC_COGNITO_CLIENT_SECRET:
        process.env.NEXT_PUBLIC_COGNITO_CLIENT_SECRET || '',
    };
  }
}
