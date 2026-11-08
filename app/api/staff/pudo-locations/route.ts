import { NextResponse } from "next/server";
import { authorizeStaffWorkspace } from "@/lib/server/staff-workspace-auth";
import { pudoLocationStore } from "@/lib/server/pudo-location-store";
import type { PudoLocationInput } from "@/lib/server/pudo-location-store-core";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
    return NextResponse.json(data, {
        status,
        headers: { "Cache-Control": "no-store" },
    });
}

function storeErrorStatus(error: unknown, fallback: number) {
    if (
        error instanceof Error &&
        error.message.includes("not authorised to register PUDO locations")
    ) {
        return 403;
    }

    return fallback;
}

export async function GET(request: Request) {
    const auth = await authorizeStaffWorkspace(request);

    if (!auth.ok) {
        return response({ error: auth.error }, auth.status);
    }

    try {
        const candidates = await pudoLocationStore.listCandidates(auth.uid);
        return response({ candidates });
    } catch (error) {
        console.error("PUDO candidate listing failed:", error);
        return response({ error: "Unable to retrieve PUDO candidates." }, 500);
    }
}

export async function POST(request: Request) {
    const auth = await authorizeStaffWorkspace(request);

    if (!auth.ok) {
        return response({ error: auth.error }, auth.status);
    }

    let input: PudoLocationInput;

    try {
        input = await request.json() as PudoLocationInput;
    } catch {
        return response({ error: "A valid JSON body is required." }, 400);
    }

    try {
        const candidate = await pudoLocationStore.saveCandidate(auth.uid, input);
        return response({ candidate }, 201);
    } catch (error) {
        console.error("PUDO candidate creation failed:", error);
        return response(
            { error: error instanceof Error ? error.message : "Unable to save candidate." },
             storeErrorStatus(error, 400),
        );
    }
}