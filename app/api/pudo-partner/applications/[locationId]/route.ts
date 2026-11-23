import { NextResponse } from "next/server";
import { pudoPartnerPortalStore } from "@/lib/server/pudo-partner-portal-store";
import { authorizePudoPartner } from "@/lib/server/pudo-partner-workspace-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ locationId: string }> };
function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request, context: Context) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  try {
    const { locationId } = await context.params;
    const application = await pudoPartnerPortalStore.getApplication(auth.uid, locationId);
    return application ? response({ application }) : response({ error: "PUDO application not found." }, 404);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to load application." }, 400);
  }
}

export async function POST(request: Request, context: Context) {
  const auth = await authorizePudoPartner(request);
  if (!auth.ok) return response({ error: auth.error }, auth.status);
  let body: unknown;
  try { body = await request.json(); } catch { return response({ error: "A valid JSON body is required." }, 400); }
  if (!body || typeof body !== "object" || !("message" in body) || typeof body.message !== "string") {
    return response({ error: "A clarification response message is required." }, 400);
  }
  try {
    const { locationId } = await context.params;
    const result = await pudoPartnerPortalStore.submitClarificationResponse(auth.uid, locationId, body.message);
    return response({ result }, 201);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "Unable to submit response." }, 400);
  }
}
