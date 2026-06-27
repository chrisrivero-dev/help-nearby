/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET } from '../route';
import type { CommunityStore } from '@/lib/community/types';

const store: CommunityStore = {
  tips: [],
  reports: [],
  updates: [],
  opportunities: [
    {
      id: 'approved',
      title: 'Approved Event',
      type: 'event',
      organizationName: 'City',
      status: 'approved',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    },
    {
      id: 'pending',
      title: 'Pending Event',
      type: 'event',
      organizationName: 'City',
      status: 'pending',
      createdAt: '2026-06-20T00:00:00.000Z',
      updatedAt: '2026-06-20T00:00:00.000Z',
    },
    {
      id: 'ended',
      title: 'Ended Event',
      type: 'event',
      organizationName: 'City',
      endAt: '2020-01-01T00:00:00.000Z',
      status: 'approved',
      createdAt: '2020-01-01T00:00:00.000Z',
      updatedAt: '2020-01-01T00:00:00.000Z',
    },
  ],
};

jest.mock('@/lib/community/store', () => ({
  readStore: jest.fn(async () => store),
  writeStore: jest.fn(),
}));

jest.mock('@/lib/community/moderation', () => ({
  isAdminAuthorized: jest.fn((auth: string | null) => auth === 'Bearer admin'),
}));

describe('/api/community-opportunities', () => {
  it('returns only approved, non-expired opportunities to public callers', async () => {
    const res = await GET(
      new NextRequest('https://example.test/api/community-opportunities'),
    );
    const json = (await res.json()) as { opportunities: Array<{ id: string }> };
    expect(json.opportunities.map((o) => o.id)).toEqual(['approved']);
  });

  it('returns all opportunities to admin callers', async () => {
    const res = await GET(
      new NextRequest('https://example.test/api/community-opportunities', {
        headers: { Authorization: 'Bearer admin' },
      }),
    );
    const json = (await res.json()) as { opportunities: Array<{ id: string }> };
    expect(json.opportunities.map((o) => o.id)).toEqual([
      'approved',
      'pending',
      'ended',
    ]);
  });
});
