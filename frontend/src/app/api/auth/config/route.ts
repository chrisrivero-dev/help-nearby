import { NextRequest, NextResponse } from 'next/server';

interface AuthConfig {
  userPoolId: string;
  clientId: string;
  region: string;
  clientSecret?: string;
}

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const config: AuthConfig = {
    userPoolId: process.env.COGNITO_USER_POOL_ID || '',
    clientId: process.env.COGNITO_CLIENT_ID || '',
    region: process.env.COGNITO_REGION || 'us-east-1',
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
  };

  return NextResponse.json(config);
}
