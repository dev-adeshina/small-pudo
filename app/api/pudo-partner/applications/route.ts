import { NextResponse } from "next/server";
import { pudoPartnerPortalStore } from "@/lib/server/pudo-partner-portal-store";
import { authorizePudoPartner } from "@/lib/server/pudo-partner-workspace-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  try {
    return response({ applications: await pudoPartnerPortalStore.listApplications(auth.uid) });
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to load applications." }, 403);
  }
}

export async function POST(request: Request) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "A valid JSON body is required." }, 400); }
  try {
    const application = await pudoPartnerPortalStore.createApplication(auth.uid, body as {
      locationName: string; address: string; registrationNote?: string;
      latitude: number; longitude: number; captureMethod: "device" | "manual"; accuracyMeters?: number;
    });
    return response({ application }, 201);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to submit PUDO application." }, 400);
  }
}
