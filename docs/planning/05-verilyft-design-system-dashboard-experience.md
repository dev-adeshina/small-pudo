# VeriLyft Design System & Dashboard Experience Specification

**Single-application experience standard | v1.0 | 27 November 2026**

## 1. Purpose and product boundary

VeriLyft is one application, not three independently deployed applications.

- One primary application and domain.
- One shared authentication infrastructure and identity/session lifecycle.
- Three distinct role-aware experiences: Customer, Admin/Staff, and PUDO.
- Shared design tokens, component primitives, interaction conventions and accessibility standards.
- Separate navigation, data visibility and authorised actions for each experience.
- Server-side authorisation remains authoritative. Hiding a button is not an access-control mechanism.

Suggested route entry points:
- General sign-in: `/login`
- Staff sign-in entry: `/staff/sign-in`
- PUDO sign-in entry: `/pudo-partner/sign-in`
- Customer application: `/account/*`
- Staff application: `/staff/*` and `/admin/*`
- PUDO application: `/pudo/*`

The entry points may provide role-appropriate context, but must use the shared authentication infrastructure. After sign-in, resolve the authenticated identity and authorised memberships from trusted server-side data before redirecting. Do not trust a client-supplied role, URL, email domain or editable profile field to grant access.

Customer, internal staff and PUDO partner/personnel identities remain logically distinct. A PUDO partner is not a staff member by implication. A user who has multiple explicitly authorised memberships may select an available workspace; every request must still be authorised for the selected context.

## 2. Experience principles

1. **One product, recognisable patterns:** users encounter familiar navigation, controls, feedback and terminology across portals.
2. **Role-appropriate, not identical:** each dashboard prioritises the work and information relevant to that audience.
3. **Action-oriented:** every dashboard makes current state, required attention and the next permitted action understandable.
4. **Progressive disclosure:** show essential information first; reveal detail when needed.
5. **Evidence before completion:** never display a completed operational state before required evidence and server-side validation exist.
6. **Responsive by task:** optimise customer flows for mobile, Admin for information-dense desktop work, and PUDO for touch-friendly phone/tablet operations.
7. **Accessible by default:** keyboard, screen reader, contrast, focus and reduced-motion behaviour are part of component acceptance.
8. **Permission-aware:** explain unavailable actions without exposing sensitive information or implying that UI restrictions replace backend checks.

## 3. Shared design tokens

Implement tokens centrally as CSS custom properties (or the project's established token mechanism). Components must consume tokens rather than inventing one-off values.

### Colour roles

Use semantic roles, not hard-coded colour choices within individual pages:
- Brand: primary action, brand emphasis and interactive focus.
- Surface: application canvas, raised surface, subtle surface and overlay.
- Text: primary, secondary, muted and inverse.
- Border: default, subtle, strong and focus.
- Status: success, warning, danger, information and neutral.
- Interactive: default, hover, active, disabled and focus.

Status must always include text or an accessible label; colour alone must never communicate meaning. Final hex values must be taken from the approved VeriLyft brand palette rather than guessed in feature pages.

### Typography

Define a consistent type scale for display, page title, section title, body, supporting text, label, table and metadata. Use a restrained number of weights. Line-height and text contrast must support readability at mobile widths. Preserve the existing approved brand font if one is already established; do not introduce a second font family without design approval.

### Spacing, shape and elevation

Use a documented spacing scale, consistent control heights, border radii, border widths and elevation levels. Establish shared breakpoints from actual layout needs. Avoid arbitrary per-page spacing values. Overlays must have clear stacking order and visible focus treatment.

## 4. Shared application shell

All three experiences use the same shell principles:
- Responsive navigation region.
- Main content region with consistent maximum-width and page gutters.
- Page header with title, optional description and primary permitted action.
- Breadcrumb region where the page has a meaningful hierarchy.
- Consistent profile/account menu and notification affordance where applicable.
- Predictable mobile navigation and close/back behaviour.
- Consistent loading, error and access-denied boundaries.

The shell may render different navigation definitions by workspace. Do not force identical menu items or identical sidebar density across roles.

### Navigation behaviour

- Use stable, human-readable labels and a consistent icon family.
- Clearly distinguish active page, expanded group and disabled destination.
- Preserve navigation state where it improves task continuity.
- Do not show links to records or operations the user is not authorised to access.
- On mobile, provide a touch-friendly navigation drawer or compact navigation pattern with a visible close action and sensible focus management.
- Avoid deep nesting. Group related operational functions under clear headings.
- Navigation labels must match page titles and breadcrumb terminology.

### Breadcrumbs

- Reflect the actual route/page hierarchy, not merely the sequence of pages visited.
- Use the same separator, spacing and typography across portals.
- Parent segments are links only when a valid parent destination exists.
- The current page is the final non-link segment and is programmatically identified as the current page.
- Long labels must truncate safely without hiding the current page.
- Example: `Dashboard / Shipments / Shipment details`.
- Do not use breadcrumbs as a substitute for browser back behaviour or primary navigation.

## 5. Dashboard experience definitions

### Customer

Primary questions answered:
- What shipments and quotes do I have?
- What has changed?
- What needs my action?
- How do I track or obtain my shipment documents?

Suggested navigation:
- Overview
- Send a parcel
- My shipments
- Quotes
- Tracking (or tracking access from shipment detail)
- My orders (existing store experience, preserved)
- Notifications
- Account

Overview prioritises active shipment progress, quotes awaiting response, payments/actions due, recent activity and a clear send-parcel action. Use reassuring language and avoid exposing internal operational terminology.

### Admin/Staff

Primary questions answered:
- What needs operational attention?
- Which decisions or approvals are pending?
- What shipment, PUDO or commercial issues need action?
- What can this staff member authoritatively do?

Suggested navigation is permission-filtered and may include:
- Overview
- Shipments and bookings
- Customers
- PUDO network
- Routing and delivery
- Transactions
- Pricing/commercial
- Documents and notifications
- Support
- Staff and permissions (restricted)
- Administration (restricted)

Admin and Staff share the operational design language but not necessarily the same permissions or menu. Keep `/admin/staff` admin-only as established. High-risk actions require server-side permission checks, attributable confirmation and audit evidence.

### PUDO

Primary questions answered:
- What is happening at this location?
- Which parcels require intake or action?
- Which intake records still need photographs or measurements?
- Which personnel are assigned and currently working?

Suggested navigation:
- Overview
- Parcel intake
- Parcels / location shipments
- Door pickup (when enabled)
- Assignments and personnel (when enabled)
- Notifications
- Location profile

Prioritise large touch targets, short task flows, camera capture, clear station identity and minimal typing. Show only records associated with the authorised PUDO location and permitted operations.

## 6. Shared component standards

Build and document reusable components with consistent APIs and variants.

### Buttons
- Variants: primary, secondary, outline, ghost/link and destructive.
- Sizes: compact, default and large, with consistent heights and icon alignment.
- Support loading, disabled and focus-visible states.
- Prevent duplicate submission while a request is pending.
- Use action labels that describe outcomes (for example, "Confirm booking", not "Submit" where context is ambiguous).
- Destructive and financially significant actions require an appropriate confirmation flow.

### Forms and inputs
- Persistent visible labels; placeholders are examples, not labels.
- Mark required fields and explain format/constraints before submission.
- Place validation feedback next to the affected field and provide a form-level summary when useful.
- Preserve valid user input after recoverable errors.
- Clearly distinguish saving, saved, failed and unsaved states.
- Use consistent date, time, currency, address, weight and dimension formatting.
- Do not mark a field successful based only on client-side validation.

### Cards and dashboard metrics
- Use cards for coherent information groups, not as decoration around every element.
- Metric cards include a clear label, value, relevant time period and accessible trend/context where meaningful.
- Make interactive cards visibly interactive and keyboard accessible.
- Avoid implying that a metric is live if it is delayed or cached.

### Tables and record lists
- Standardise column alignment, row density, sorting, filters, search, pagination and empty states.
- Show meaningful status text and optional semantic icon.
- Row actions must be permission-appropriate and clearly labelled.
- Keep immutable evidence records free of destructive actions.
- Provide a usable narrow-screen presentation; do not simply compress a desktop table until unreadable.
- Make record identity and status scannable; provide detail pages for complex workflows.

### Dialogs, drawers and notifications
- Use dialogs for focused decisions and confirmation, not as a substitute for full pages.
- Maintain focus within an open modal and return focus to its trigger on close.
- Distinguish transient toast feedback from persistent actionable alerts.
- Errors explain what happened and the next safe step without leaking internal details.
- Success feedback must follow confirmed server outcomes.

### Timeline and evidence
- Use a consistent chronological event presentation with event name, time, actor/context and permitted evidence.
- Distinguish event occurrence time from recording time where relevant.
- Evidence previews must respect access permissions and use secure storage access.
- Never fabricate a successful intake, custody, payment or delivery state when evidence or authoritative confirmation is missing.

## 7. Feedback and state standards

Every data-backed page and component must define:
- Initial loading/skeleton state.
- Empty state with a useful next action when possible.
- Recoverable error state with retry or safe navigation.
- Permission-denied state that does not disclose protected record details.
- Success state only after authoritative confirmation.
- Disabled state with a clear explanation when an action is unavailable.
- Stale/offline state where the product supports cached or disconnected use.

Avoid blank screens, silent failures, indefinite spinners and ambiguous button states.

## 8. Responsive behaviour

- **Customer:** mobile-first; forms and tracking must remain easy to use on narrow screens.
- **Admin/Staff:** desktop-friendly, responsive; retain table utility and detail context on tablet/mobile.
- **PUDO:** phone/tablet-first for intake; camera, upload progress and touch targets must work in the actual device browser.

At every breakpoint, preserve task completion, content hierarchy, focus order and action visibility. Do not hide critical status or evidence requirements on mobile.

## 9. Accessibility baseline

Target WCAG 2.2 AA for implemented experiences:
- Keyboard-operable controls and visible focus.
- Semantic landmarks, headings, labels and table structure.
- Accessible names for icon-only controls.
- Sufficient text and non-text contrast.
- Error identification and programmatic association with fields.
- No colour-only status.
- Reduced-motion support.
- Appropriate touch target sizing and spacing.
- Accessible camera/upload controls and progress feedback.

## 10. Authentication, workspace and security UX

- Authentication entry points may differ by audience, but all use the shared authentication infrastructure.
- Resolve user identity, memberships and permissions from trusted server-side sources.
- Route users only to workspaces for which they have an active authorised membership.
- If no authorised workspace exists, show a safe access/help state rather than guessing a role.
- If a user has multiple memberships, offer only those memberships and require explicit workspace selection.
- Switching workspace must refresh the active context and must not retain access to the prior workspace's data.
- Session expiry, sign-out and reauthentication must behave consistently.
- All protected reads and writes must be enforced by server-side checks and Firestore security boundaries. Client navigation and hidden controls are not security controls.

## 11. Implementation sequence and acceptance criteria

1. Audit existing styles, routes and components before replacing anything.
2. Define tokens and semantic theme roles.
3. Build shared primitives: buttons, fields, badges, cards, tables, dialogs, alerts and loading/empty/error states.
4. Build shared shell primitives: page header, breadcrumbs, responsive navigation and profile menu.
5. Implement Customer experience.
6. Implement Admin/Staff experience with permission-filtered navigation.
7. Implement PUDO experience with camera-first intake.
8. Integrate real data and authoritative server actions after data architecture and inventory decisions.
9. Test role boundaries, responsive layouts, keyboard accessibility and complete business workflows.

A shared component is accepted when it has documented variants, interaction states, keyboard/focus behaviour, responsive behaviour and tests appropriate to its risk. A dashboard is accepted when its navigation, page hierarchy, empty/loading/error states, permissions and key user tasks work end to end.

## 12. Decisions intentionally not fixed here

- Final brand colour values and font choice must be reconciled with existing approved brand assets.
- Exact route redirects depend on the final identity/membership model.
- Final menu items depend on implemented scope and assigned permissions.
- Exact breakpoints and component density must be validated in the actual application.
- This specification does not authorise a new Firestore database, authentication migration, production deployment or data migration.
