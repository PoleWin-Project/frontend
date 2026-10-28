import { API_URL } from '@/lib/config';

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}
export interface WeeklyChallenges {
  enabled: boolean;
  week: string;
  endsAt: string;
  items: WeeklyChallenge[];
}
async function request<T>(token: string, path: string, body?: { week: string }): Promise<T> {
  const response = await fetch(`${API_URL}/challenges/weekly${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message ?? 'Impossible de charger les défis.');
  return data;
}
export const fetchWeeklyChallenges = (token: string) => request<WeeklyChallenges>(token, '');
export const claimWeeklyChallenge = (token: string, id: string, week: string) =>
  request<{ rewarded: number; garageCredits: number }>(token, `/${encodeURIComponent(id)}/claim`, { week });
