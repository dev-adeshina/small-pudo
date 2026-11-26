import { NextResponse } from 'next/server';

export const revalidate = 86400;

type ApiState = { name?: string };
type ApiResponse = { error?: boolean; data?: { states?: ApiState[] } | string[] };

const API = 'https://countriesnow.space/api/v0.1/countries';

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    next: { revalidate: 86400 },
  });
  if (!response.ok) throw new Error(`Location provider returned ${response.status}`);
  const result = await response.json();
  if (result.error) throw new Error(result.msg || 'Location provider returned an error');
  return result as T;
}

export async function GET() {
  try {
    const statesResult = await post<ApiResponse>('states', { country: 'Nigeria' });
    const states = (statesResult.data as { states?: ApiState[] } | undefined)?.states ?? [];
    if (!states.length) throw new Error('No Nigerian states were returned');

    const locations = await Promise.all(states.map(async ({ name }) => {
      if (!name) return [];
      const stateName = name.replace(/\\s+State$/i, '').trim();
      try {
        const cityResult = await post<ApiResponse>('state/cities/q', {
          country: 'Nigeria',
          state: stateName,
        });
        const cities = Array.isArray(cityResult.data) ? cityResult.data : [];
        return cities.filter((city): city is string => typeof city === 'string' && city.trim().length > 0)
          .map((city) => ({ city: city.trim(), state: name, country: 'Nigeria' }));
      } catch {
        return [];
      }
    }));

    const unique = new Map<string, { city: string; state: string; country: string }>();
    for (const item of locations.flat()) {
      unique.set(`${item.city.toLocaleLowerCase()}|${item.state.toLocaleLowerCase()}`, item);
    }
    return NextResponse.json({ locations: [...unique.values()], source: 'CountriesNow' });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to load Nigerian locations' },
      { status: 502 },
    );
  }
}
