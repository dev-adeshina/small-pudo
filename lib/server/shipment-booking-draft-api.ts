interface ShipmentBookingDraftInput {
  origin: string;
  destination: string;
  parcelDescription: string;
}


export interface ShipmentBookingDraftRecord extends ShipmentBookingDraftInput {
  id: string;
  status: "draft";
  createdAt?: string | null;
  updatedAt?: string | null;
}

type CustomerAuthenticationResult =
  | { success: true; uid: string }
  | { success: false; status: 401 | 403; error: string };

type DraftValidationResult =
  | { success: true; data: ShipmentBookingDraftInput }
  | { success: false; error: string };

interface ShipmentBookingDraftApiDependencies {
  authenticateCustomer: (
    authorization: string | null
  ) => Promise<CustomerAuthenticationResult>;
  validateDraft: (body: unknown) => DraftValidationResult;
  listDrafts: (customerUid: string) => Promise<ShipmentBookingDraftRecord[]>;
  createDraft: (
    customerUid: string,
    input: ShipmentBookingDraftInput
  ) => Promise<ShipmentBookingDraftRecord>;
  updateDraft: (
    customerUid: string,
    draftId: string,
    input: ShipmentBookingDraftInput
  ) => Promise<boolean>;
}

export function createShipmentBookingDraftHandlers(
  dependencies: ShipmentBookingDraftApiDependencies
) {
  async function authenticate(request: Request) {
    return dependencies.authenticateCustomer(
      request.headers.get("authorization")
    );
  }

  async function GET(request: Request) {
    const customer = await authenticate(request);

    if (!customer.success) {
      return Response.json(
        { error: customer.error },
        { status: customer.status }
      );
    }

    try {
      const drafts = await dependencies.listDrafts(customer.uid);
      return Response.json({ success: true, drafts });
    } catch (error) {
      console.error("Failed to retrieve shipment booking drafts:", error);
      return Response.json(
        { error: "Unable to retrieve your shipment drafts right now." },
        { status: 500 }
      );
    }
  }

  async function POST(request: Request) {
    const customer = await authenticate(request);

    if (!customer.success) {
      return Response.json(
        { error: customer.error },
        { status: customer.status }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validated = dependencies.validateDraft(body);

    if (!validated.success) {
      return Response.json(
        { error: validated.error },
        { status: 400 }
      );
    }

    try {
      const draft = await dependencies.createDraft(customer.uid, validated.data);
      return Response.json({ success: true, draft }, { status: 201 });
    } catch (error) {
      console.error("Failed to save shipment booking draft:", error);
      return Response.json(
        { error: "Unable to save your shipment draft right now." },
        { status: 500 }
      );
    }
  }

  async function PATCH(request: Request, draftId: string) {
    const customer = await authenticate(request);

    if (!customer.success) {
      return Response.json(
        { error: customer.error },
        { status: customer.status }
      );
    }

    if (!draftId || draftId.includes("/")) {
      return Response.json(
        { error: "The requested shipment draft was not found." },
        { status: 404 }
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Invalid request body." },
        { status: 400 }
      );
    }

    const validated = dependencies.validateDraft(body);

    if (!validated.success) {
      return Response.json(
        { error: validated.error },
        { status: 400 }
      );
    }

    try {
      const updated = await dependencies.updateDraft(
        customer.uid,
        draftId,
        validated.data
      );

      if (!updated) {
        return Response.json(
          { error: "The requested shipment draft was not found." },
          { status: 404 }
        );
      }

      return Response.json({
        success: true,
        draft: {
          id: draftId,
          ...validated.data,
          status: "draft",
        },
      });
    } catch (error) {
      console.error("Failed to update shipment booking draft:", error);
      return Response.json(
        { error: "Unable to update your shipment draft right now." },
        { status: 500 }
      );
    }
  }

  return { GET, POST, PATCH };
}
