import type { Appearance } from './paddock';
import { API_URL } from '@/lib/config';

export type LeagueRole = 'owner' | 'member';
export type LeagueScoringMode = 'season' | 'from_join';

export interface LeagueSummary {
  id: number;
  name: string;
  ownerUserId: number;
  ownerUsername: string;
  seasonYear: number;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  role: LeagueRole;
  scoringMode: LeagueScoringMode;
}

export interface LeagueMember {
  id: number;
  userId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  points: number;
  joinedAt: string;
  isOwner: boolean;
  rank: number;
  cosmetics?: Appearance;
}

export interface LeagueDetail {
  id: number;
  name: string;
  ownerUserId: number;
  ownerUsername: string | null;
  seasonYear: number;
  inviteCode: string;
  createdAt: string;
  memberCount: number;
  myRank: number | null;
  canManage: boolean;
  scoringMode: LeagueScoringMode;
  members: LeagueMember[];
}

export class LeagueApiError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
  }
}

/** Compatibilité avec un backend plus ancien qui renvoyait les erreurs Zod sérialisées. */
function readableMessage(message: unknown): string {
  if (typeof message !== 'string') return 'Une erreur est survenue.';
  try {
    const details = JSON.parse(message);
    if (Array.isArray(details) && typeof details[0]?.message === 'string') return details[0].message;
  } catch {
    // Le message est déjà lisible : on le conserve tel quel.
  }
  return message;
}

async function request<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new LeagueApiError(readableMessage(data.message), data.code);
  return data;
}

export async function fetchMyLeagues(token: string): Promise<LeagueSummary[]> {
  const data = await request<{ leagues: LeagueSummary[] }>(token, '/leagues');
  return data.leagues ?? [];
}

export async function fetchLeague(id: number, token: string): Promise<LeagueDetail> {
  const data = await request<{ league: LeagueDetail }>(token, `/leagues/${id}`);
  return data.league;
}

export async function createLeague(name: string, scoringMode: LeagueScoringMode, token: string): Promise<LeagueDetail> {
  const data = await request<{ league: LeagueDetail }>(token, '/leagues', {
    method: 'POST', body: JSON.stringify({ name, scoringMode }),
  });
  return data.league;
}

export async function joinLeague(inviteCode: string, token: string) {
  return request<{ joined: boolean; league: LeagueDetail }>(token, '/leagues/join', {
    method: 'POST', body: JSON.stringify({ inviteCode }),
  });
}

export async function renameLeague(id: number, name: string, token: string): Promise<LeagueDetail> {
  const data = await request<{ league: LeagueDetail }>(token, `/leagues/${id}`, {
    method: 'PATCH', body: JSON.stringify({ name }),
  });
  return data.league;
}

export async function regenerateInviteCode(id: number, token: string): Promise<string> {
  const data = await request<{ inviteCode: string }>(token, `/leagues/${id}/invite-code`, { method: 'POST' });
  return data.inviteCode;
}

export async function leaveLeague(id: number, token: string): Promise<void> {
  await request(token, `/leagues/${id}/members/me`, { method: 'DELETE' });
}

export async function removeLeagueMember(id: number, userId: number, token: string): Promise<void> {
  await request(token, `/leagues/${id}/members/${userId}`, { method: 'DELETE' });
}

export async function deleteLeague(id: number, token: string): Promise<void> {
  await request(token, `/leagues/${id}`, { method: 'DELETE' });
}
