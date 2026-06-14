export interface CommunityTip {
  id: string;
  resourceKey: string;
  resourceSnapshot: {
    name: string;
    address?: string;
    category: string;
    sourceName: string;
  };
  body: string;
  originalBody?: string;
  submitterName?: string;
  submitterEmail?: string;
  submitterHash: string;
  visitedOn?: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  rejectionReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
}

export interface ListingIssueReport {
  id: string;
  resourceKey: string;
  resourceSnapshot: {
    name: string;
    address?: string;
  };
  issueType:
    | 'wrong_hours'
    | 'closed'
    | 'wrong_phone'
    | 'wrong_address'
    | 'not_offering_service'
    | 'other';
  detail?: string;
  submitterHash: string;
  status: 'open' | 'investigating' | 'resolved_fixed' | 'resolved_unverified' | 'dismissed';
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface CommunityOpportunity {
  id: string;
  title: string;
  type: 'volunteer' | 'donation' | 'event' | 'shelter' | 'food' | 'other';
  organizationName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  startAt?: string;
  endAt?: string;
  sourceUrl?: string;
  contactPhone?: string;
  contactEmail?: string;
  status: 'pending' | 'approved' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface LocalUpdate {
  id: string;
  title: string;
  updateType: 'cooling' | 'shelter' | 'food' | 'road' | 'emergency' | 'general';
  description: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  sourceName: string;
  sourceUrl?: string;
  startsAt?: string;
  endsAt?: string;
  status: 'pending' | 'approved' | 'expired';
  createdAt: string;
  updatedAt: string;
}

export interface CommunityStore {
  tips: CommunityTip[];
  reports: ListingIssueReport[];
  opportunities: CommunityOpportunity[];
  updates: LocalUpdate[];
}
