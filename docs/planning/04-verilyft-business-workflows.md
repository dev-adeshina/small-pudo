# VeriLyft Business Workflows and Rules

**Initial operating model | v1.0 | 26 November 2026**

## 1. Workflow principles

- One authoritative shipment record supports all entry channels.
- Customer ownership, request creator, physical custodian and operational assignee are separate roles and must be recorded separately.
- Status changes represent business events and require the appropriate authority and evidence.
- Booking, assignment, attempted collection and physical custody are different concepts.
- Admin controls authoritative pricing and commercial quotation. PUDO operators can submit operational information but cannot approve the final transportation price.

## 2. Direct customer shipment request

1. Customer signs in and starts Send a Parcel.
2. Customer selects the collection method (PUDO drop-off or door pickup) and supplies sender, recipient, origin, destination and parcel details.
3. System validates the request and creates the authoritative shipment request, recording customer as owner and customer as creator.
4. System obtains/uses an approved road-route distance where available and calculates an indicative amount using the active pricing configuration. The calculation is marked indicative and retains its inputs/version.
5. When the indicative price is presented, the pricing chat session is opened and Admin joins to review and provide the authoritative quotation.
6. Admin checks parcel, route, service and applicable charges, then issues a versioned quotation with amount, breakdown, currency and validity.
7. Customer accepts or declines. Acceptance creates the basis for booking; it does not prove payment or physical collection.
8. Customer proceeds to payment. Server-side payment verification updates payment status. A confirmed booking is created only according to the agreed booking/payment rule.

## 3. PUDO walk-in request and intake

1. Visiting customer provides shipment and contact details to an authorised PUDO operator.
2. Operator searches for an existing customer or records the required customer details under the approved customer creation/guest policy.
3. Operator enters the shipment request on behalf of the customer. Shipment owner remains the customer; createdBy records the PUDO operator and station.
4. Operator records origin/destination, recipient, parcel description, weight/dimensions and applicable intake details.
5. Operator captures and uploads the mandatory parcel photograph(s), linked to a parcel intake record and the shipment.
6. The request is submitted for Admin pricing. PUDO does not approve the authoritative transportation quotation.
7. Physical receipt/custody is recorded only when the parcel is actually in the station's possession and required photo evidence is confirmed.
8. Admin reviews the request and issues the authoritative quotation. The pricing conversation begins when the indicative price is presented and Admin joins.

## 4. Door pickup request and station arrival

1. Customer requests collection from a home, office or other pickup address and provides shipment details.
2. System records the shipment request and pickup address. The request is not marked collected merely because it exists.
3. Authorised PUDO operator reviews the request and schedules/assigns suitable personnel. The assignment stores assigned person, date, start time and end time.
4. Assignment status is derived from schedule and current time (for example upcoming, on assignment, off assignment), subject to availability rules. This is scheduling information, not proof of attendance or completion.
5. When actual pickup occurs, record a distinct collection event with actor, time, location and required evidence according to the final evidence policy.
6. When the parcel arrives at the PUDO station, operator locates the shipment, confirms parcel identity, records measurements if needed and captures mandatory intake photograph(s).
7. Only after actual receipt and photo evidence are recorded may the station intake be marked received. Station arrival/intake is distinct from the earlier pickup assignment.

## 5. Pricing and quotation

- Indicative transportation fee formula: approved road-route distance (km) × billable parcel weight (kg) × configured rate per km per kg.
- Add applicable PUDO fee and other approved charges; calculate any configured percentage charge according to the final approved rule.
- Illustrative example only: 8.9 km × 1 kg × ₦100 = ₦890 transportation; plus ₦300 PUDO fee = ₦1,190 subtotal; illustrative 10% = ₦119; total ₦1,309.
- Admin reviews the inputs and may correct or confirm the commercial amount. The final quotation is versioned and issued by an authorised Admin user.
- Store the calculation inputs, road-route source/evidence, pricing configuration version, line items, totals, issuer, issue time and expiry/validity.
- Changes to future pricing configuration must not alter previously issued quotations.

## 6. Chat and customer support

- Shipment pricing chat begins when the initial indicative price is raised/presented and Admin joins the pricing review.
- Chat is linked to the customer and shipment and may reference the calculation and quotation.
- Only authorised participants can view or send messages. PUDO is not automatically included in customer–Admin pricing conversations.
- Customer enquiries and complaints may be represented as support cases linked to a customer and optionally to a shipment/order. Complex escalation automation is deferred.

## 7. Payment and booking

1. Customer accepts the valid Admin quotation and proceeds to payment.
2. Payment initiation creates a pending payment record referencing the shipment/booking subject and provider transaction reference when available.
3. Payment success is confirmed server-side using the payment provider's verification/webhook mechanism; the browser response alone is not authoritative.
4. Record pending, successful and failed outcomes, amount, currency, provider reference and timestamps. Prevent duplicate processing through idempotency.
5. Create/confirm the shipment booking according to the final rule for quotation acceptance and payment confirmation. Keep quote accepted, payment confirmed and booking confirmed as distinct facts.
6. Generate a payment receipt only after verified successful payment. Basic refunds create linked refund records and, when completed, a refund document.

## 8. PUDO intake and mandatory photo evidence

- Every physical parcel intake requires a photograph. This applies to walk-in physical receipt and arrival at a PUDO after door pickup.
- Before marking intake complete, the operator must identify the shipment, select the receiving station, record the receiving actor/time and upload the required photo evidence.
- Images are stored in Firebase Storage; Firestore records the intake and image metadata/reference.
- Do not mark received/physical custody until upload is confirmed and the evidence reference is linked.
- Evidence should be append-only in normal operation. If a photo is incorrect, preserve the original record and add a corrected/additional evidence record according to an authorised correction process.
- Final policy still needs to define minimum photo count, required angles, image quality, offline capture behaviour and retention period.

## 9. Routing, transfer and delivery

- Admin or authorised operations staff create collection, transfer and delivery assignments.
- Assignments identify the shipment, assigned personnel, relevant PUDO/locations, scheduled times and current assignment state.
- PUDO-to-PUDO transfer records identify origin and destination stations, shipment/parcel references, dispatch and receipt events and responsible actors.
- Shipment status updates must be based on actual operational events. Dispatch assignment alone does not mean in transit; a route record alone does not prove custody.
- Delivery completion records recipient/authorised receiver, time, location and confirmation evidence according to the final delivery policy.
- Advanced route optimisation, automated availability and automated redelivery are outside initial scope.

## 10. Tracking, documents and email

- Maintain a central shipment event timeline. Store event time, recorded time, actor, location and evidence references.
- Sender and recipient see role-appropriate views of the same shipment timeline. Admin sees the authorised operational view. PUDO sees only station-relevant information.
- Generate relevant PDFs at the correct business milestones: quotation when issued; payment receipt after confirmed payment; PUDO intake receipt after physical intake; waybill after booking confirmation; delivery confirmation after completed delivery; refund receipt after completed refund.
- Email relevant documents to both sender and recipient using their valid contact details. Record delivery attempts and failures separately for each recipient.
- Exact document recipient/content matrix, email attachment versus secure link, resend permissions and retention are open decisions.

## 11. Store order workflow boundary

- Existing store products, categories, inventory, pricing, customers, orders, order items and store payment records must be preserved.
- Store orders remain distinct from independent shipment bookings even if they share customer identity, payment infrastructure, notifications or delivery capabilities.
- Admin must be able to view/manage store orders and view transactions alongside shipment activity without merging the two business records.
- Store data integration with the new Firestore database must be selected before implementation: read from existing database, controlled copy, or explicit migration. Avoid unplanned dual writes.

## 12. Initial operating scope and deferred work

**Initial:** basic payments/statuses, transaction references, basic refunds; basic routing and assignments; customer profiles and saved addresses; shipment/order history; basic support; email notifications and PDF delivery; PUDO intake with mandatory photos; basic personnel scheduling.

**Deferred:** complex financial reconciliation, automated PUDO settlement/payout, commission distribution, advanced financial reporting, fleet management, advanced route optimisation, automated personnel availability, complex recipient verification, third-party collection authorisation, automated redelivery, SMS, advanced notification analytics and complex support escalation.

Admin visibility remains broad and role-controlled even when advanced processes are manual.

## 13. Open workflow decisions

- Define the exact shipment status state machine and permitted transitions per channel.
- Define when booking is confirmed relative to quote acceptance and payment confirmation.
- Confirm payment provider, methods, verification and refund permissions.
- Confirm road-route distance provider and evidence requirements.
- Confirm weight basis, dimensional weight, rounding and final percentage-charge policy.
- Confirm photo count/angles, evidence retention and whether pickup-at-door also requires a photo at collection in addition to station intake.
- Confirm recipient access and delivery verification requirements.
- Confirm document templates, recipient matrix, email provider and delivery/retry policy.
- Confirm store database integration boundary and customer identity mapping.
