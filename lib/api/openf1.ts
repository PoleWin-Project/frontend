

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export type OpenF1Driver = {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  team_colour: string;
  headshot_url: string;
  country_code: string;
};

export type OpenF1Team = {
  team_name: string;
  team_colour: string;
  drivers: OpenF1Driver[];
};

export async function getLatestSessionTeams(): Promise<{ ok: true; teams: OpenF1Team[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/openf1/sessions/latest/teams`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      return { ok: false, error: 'Impossible de récupérer les écuries' };
    }
    
    const data = await res.json();
    return { ok: true, teams: data.teams || [] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau';
    return { ok: false, error: msg };
  }
}

export async function getLatestSessionDrivers(): Promise<{ ok: true; drivers: OpenF1Driver[] } | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_URL}/openf1/sessions/latest/drivers`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!res.ok) {
      return { ok: false, error: 'Impossible de récupérer les pilotes' };
    }
    
    const data = await res.json();
    return { ok: true, drivers: data.drivers || [] };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Erreur réseau';
    return { ok: false, error: msg };
  }
}
