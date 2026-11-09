import { NextResponse } from "next/server";

export function pudoVerificationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message.includes("not authorised to verify PUDO locations")) {
    return NextResponse.json(
      { error: "You do not have permission to verify PUDO locations." },
      { status: 403 },
    );
  }

  if (message.includes("submitted PUDO candidate was not found")) {
    return NextResponse.json(
      { error: "The submitted PUDO candidate was not found." },
      { status: 404 },
    );
  }

  if (
    message.includes("current status") ||
    message.includes("required before a decision") ||
    message.includes("could not be found") ||
    message.includes("Approval requires")
  ) {
    return NextResponse.json(
      { error: message },
      { status: 409 },
    );
  }

  if (error instanceof TypeError) {
    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }

  console.error("PUDO verification API error:", error);

  return NextResponse.json(
    { error: "An unexpected error occurred while processing verification." },
    { status: 500 },
  );
}