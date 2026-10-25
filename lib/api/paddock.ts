import { API_URL } from '@/lib/config';
export type CosmeticKind = 'frame' | 'title' | 'helmet' | 'suit' | 'background';
type CosmeticAppearance = { code: string; name: string; color: string | null } | null;
export interface Appearance {
  helmet?: CosmeticAppearance;
  suit?: CosmeticAppearance;
  background?: CosmeticAppearance;
  frame: { code: string; name: string; color: string | null } | null;
  title: { code: string; name: string; color: string | null } | null;
}
export interface PaddockItem {
  code: string; kind: CosmeticKind; name: string; price: number; color: string | null;
  owned: boolean; equipped: boolean; active: boolean; available: boolean;
}
export interface PaddockCatalog { enabled: boolean; garageCredits: number; items: PaddockItem[]; cosmetics: Appearance; rotation: { startsAt: string; refreshesAt: string; codes: string[] } }
async function request<T>(token: string, path: string, method = 'GET', body?: unknown): Promise<T> {
  const res = await fetch(`${API_URL}/paddock${path}`, {
    method, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? 'Le Paddock est momentanément indisponible.');
  return data;
}
export const fetchPaddock = (token: string) => request<PaddockCatalog>(token, '');
export const buyCosmetic = (token: string, code: string) => request(token, '/purchases', 'POST', { code });
export const equipCosmetic = (token: string, kind: CosmeticKind, code: string | null) => request(token, '/equipment', 'PUT', { kind, code });
