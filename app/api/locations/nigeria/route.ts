import { NextResponse } from 'next/server';

export const revalidate = 86400;

type PlacedbRegion = {
  id: number;
  name: string;
};

type PlacedbRegionsResponse = {
  country: string;
  regions: PlacedbRegion[];
  release?: string;
};

type PlacedbSettlement = {
  id: number;
  name: string;
  type?: string;
};

type PlacedbSettlementsResponse = {
  country: string;
  region: number;
  settlements: PlacedbSettlement[];
  release?: string;
};

type NigerianLocation = {
  city: string;
  state: string;
  country: 'Nigeria';
};

const API = 'https://api.placedb.org/v1';

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API}/${path}`, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 },
  });

  if (!response.ok) {
    throw new Error(`Location provider returned ${response.status} for ${path}`);
  }

  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    // ISO 3166-1 alpha-2 code for Nigeria.
    const regionsResult = await getJson<PlacedbRegionsResponse>('regions/NG.json');
    const regions = regionsResult.regions ?? [];

    if (!regions.length) {
      throw new Error('The location provider returned no Nigerian states.');
    }

    const failedStates: string[] = [];
    const stateResults = await Promise.all(
      regions.map(async (region) => {
        try {
          const result = await getJson<PlacedbSettlementsResponse>(
            `cities/NG/${region.id}.json`,
          );

          return (result.settlements ?? [])
            .filter((place) => typeof place.name === 'string' && place.name.trim())
            .map((place): NigerianLocation => ({
              city: place.name.trim(),
              state: region.name,
              country: 'Nigeria',
            }));
        } catch {
          failedStates.push(region.name);
          return [];
        }
      }),
    );

    const unique = new Map<string, NigerianLocation>();
    for (const location of stateResults.flat()) {
      unique.set(
        `${location.city.toLocaleLowerCase()}|${location.state.toLocaleLowerCase()}`,
        location,
      );
    }

    const locations = [...unique.values()].sort((a, b) =>
      a.city.localeCompare(b.city) || a.state.localeCompare(b.state),
    );

    if (!locations.length) {
      throw new Error('The location provider returned no Nigerian cities. Please retry.');
    }

    return NextResponse.json({
      locations,
      source: 'placedb',
      release: regionsResult.release ?? null,
      failedStates,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error
          ? error.message
          : 'Unable to load Nigerian locations',
      },
      { status: 502 },
    );
  }
}
