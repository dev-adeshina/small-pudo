import { NextResponse } from "next/server";
import { authorizePudoPartner } from "@/lib/server/pudo-partner-workspace-auth";
import { pudoPersonnelStore } from "@/lib/server/pudo-personnel-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

function locationIdFrom(request: Request) {
  return new URL(request.url).searchParams.get("locationId") ?? "";
}

export async function GET(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  try {
    const personnel = await pudoPersonnelStore.list(auth.uid, locationIdFrom(request));
    return response({ personnel });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to load personnel." }, 403);
  }
}

export async function POST(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "A valid JSON body is required." }, 400); }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  try {
    const personnel = await pudoPersonnelStore.create(auth.uid, String(record.locationId ?? ""), {
      name: record.name as string,
      role: record.role as string,
    });
    return response({ personnel }, 201);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to register personnel." }, 400);
  }
}

export async function PATCH(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "A valid JSON body is required." }, 400); }
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  try {
    const locationId = String(record.locationId ?? "");
    const personnelId = String(record.personnelId ?? "");
    if (record.action === "deactivate") {
      const personnel = await pudoPersonnelStore.deactivate(auth.uid, locationId, personnelId);
      return response({ personnel });
    }
    const personnel = await pudoPersonnelStore.update(auth.uid, locationId, personnelId, {
      name: record.name as string,
      role: record.role as string,
    });
    return response({ personnel });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to update personnel." }, 400);
  }
}
