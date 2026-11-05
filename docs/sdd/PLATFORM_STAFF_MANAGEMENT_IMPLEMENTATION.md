# Staff invitation and permission-management implementation

**Implementation branch:** `feat/staff-invitation-permission-management`  
**Policy basis:** PM-01–PM-02 and the approved five operational-cost action permissions.  
**Status:** PR #136 and PR #137 are merged to main. The invitation, staff directory, permission-management and workspace-activation implementation is present. Owner-reported local Emulator, TypeScript, lint, production-build and diff checks passed after PR #137; browser verification remains pending. The initial permission-administrator Firebase provisioning has not successfully run.

## Post-merge status — PR #136 and PR #137 — 5 November 2026

- PR #136 merged the staff invitation and permission-management implementation. PR #137 moved the activation action into the authenticated staff workspace.
- The invitation acceptance page now guides account registration/verification/sign-in. After signing in with a verified email matching a pending invitation, the staff workspace checks invitation status and presents the activation action. The activation endpoint supports status lookup and activation using the verified Firebase identity; the legacy token path remains supported during transition.
- Successful activation creates/activates the staff-directory record and marks the invitation accepted. It does not assign any operational action permission.
- The owner reports 100/100 Firestore Emulator-backed tests across 14 suites, zero failures and zero skipped, plus successful TypeScript, lint, production build and git diff --check. These results are owner-reported and are not browser or production evidence.
- Browser verification remains open for invitation delivery, email/password and Google onboarding, verification, pending/expired/mismatched/revoked cases, workspace activation, staff-directory visibility, permission lifecycle and the operational-cost workflow with distinct actors.
- The initial Designated Staff Permission Administrator policy appointment is separate from technical provisioning. The guarded provisioning command was refused when invoked without --confirm-initial-designation; there is no evidence that provisioning subsequently succeeded. Do not claim the designation is technically active.



## Scope delivered

- Staff invitations with a cryptographically random one-time token. Firestore stores only its SHA-256 hash.
- Explicit administrator-selected invitation expiry; no default expiry period or numeric limit has been invented.
- Resend email delivery with explicit configuration checks. An invitation is not reported as sent unless Resend confirms the request; delivery failures are marked and audited.
- Invitation revocation, expiry, verified-email matching and single-use activation.
- Duplicate active-staff invitations are rejected; a still-pending invitation blocks another invitation to the same email. Expired pending invitations are marked expired and audited transactionally before a replacement is created.
- Email/password and Google account registration/sign-in at `/staff/accept-invitation`. Activation requires a verified Firebase ID token whose email matches the invitation.
- Staff directory at `/admin/staff`, with account status, invitation history, permission assignment, modification, suspension, optional expiry and revocation.
- The only assignable permissions are:
  - `operational_cost_definition.view`
  - `operational_cost_definition.propose`
  - `operational_cost_definition.validate`
  - `operational_cost_definition.finance_review`
  - `operational_cost_definition.approve`
- These five permissions have platform-wide scope, as previously approved. No location or additional permission catalogue is introduced.
- Permission writes reuse the existing authoritative path `staffActionPermissions/{uid}/permissions/{permissionId}`. The existing operational-cost permission check now denies expired assignments.
- Every successful invitation/permission action records actor, target, action/permission, scope where relevant, timestamp, reason and outcome in server-managed audit records.
- Self-assignment and unsupported permission IDs are rejected. Permission assignment and its audit event are committed atomically.
- Firestore client access to staff identity, invitation, designation, permission and audit collections is explicitly denied.
- Emulator tests cover invitation token hashing, explicit expiry, email matching, single-use activation, no automatic permission grant, permission lifecycle/expiry, self-assignment denial, audit records, designated-admin authorization and client Rules denial.

## Trusted authorization boundary

A staff-management request must pass both existing Admin authorization checks (verified allowlisted email, `admin === true`, active `adminAccess/{uid}`, token revocation check) and an active `staffPermissionAdministrators/{uid}` designation. An Admin account without that designation is denied.

The initial owner appointment is still **not technically active** until the controlled provisioning operation below is deliberately run. The implementation does not create the designation automatically, modify custom claims, or grant operational permissions during staff activation.

### Controlled initial designation provisioning

The feature adds `scripts/provision-staff-permission-administrator.mjs` and the `staff:provision-permission-admin` package command. It requires:

- `STAFF_PERMISSION_ADMIN_UID` — target UID resolved from the trusted Firebase Authentication environment.
- `STAFF_PERMISSION_ADMIN_PROVISIONED_BY_UID` — the verified Admin UID carrying out the provisioning.
- `STAFF_PERMISSION_ADMIN_PROVISIONING_REASON` — explicit reason.
- `STAFF_PERMISSION_ADMIN_EXPECTED_PROJECT_ID` — must exactly match `FIREBASE_PROJECT_ID`.
- Existing `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, and `ADMIN_EMAILS`.
- Explicit command-line confirmation: `--confirm-initial-designation`.

The script verifies both target and provisioning actor as email-verified, allowlisted Admin accounts with the Admin custom claim and active `adminAccess` records. It creates the active designation and its audit event in one Firestore transaction. It does not assign any of the five operational permissions.

**The script has not been executed.** Review the target UID and Firebase project carefully and obtain explicit approval before running it against production. Recovery/successor appointment and suspension procedures remain a separate open control; this first provisioning script is not a recovery mechanism.

## Runtime configuration

Staff invitation email requires:

- `RESEND_API_KEY`
- `STAFF_INVITATION_FROM_EMAIL`
- `APP_URL` (absolute application origin)

If any are missing, invitation creation is not attempted and the API returns a clear configuration error.

## Verification handoff

### Owner-reported local verification after PR #137

The owner ran the full Firestore Emulator-backed suite using:

    npx firebase-tools emulators:exec --only firestore --project demo-verilyft-staff-management "npm test"

Reported result: 100 tests across 14 suites; 100 passed, 0 failed, 0 skipped. The owner also reported successful:

    npx tsc --noEmit
    npm run lint
    npm run build
    git diff --check

These are user-reported local results. They are not independently reproduced by this document update and do not establish browser behaviour or production configuration.

### Browser verification still required

Use controlled test accounts and verify:

1. Invitation creation and Resend delivery confirmation.
2. Email/password and Google registration/sign-in; verified email must match the invitation.
3. Pending invitation detection and activation from the authenticated staff workspace.
4. Expired, revoked, mismatched-email, duplicate and already-active invitation behaviour.
5. Staff-directory visibility after activation.
6. Permission assignment, modification, suspension, expiry and revocation; verify self-assignment and unsupported permission denial.
7. Generic Admin denial and designated Staff Permission Administrator access.
8. Operational-cost proposal, Operations validation, Finance review and independent approval with distinct actors; proposer self-validation and missing/expired permission denial; confirm audit events.

### Controlled provisioning remains separate

The initial designated-administrator policy appointment is recorded, but the Firebase provisioning CLI has not successfully run. A prior invocation was refused because --confirm-initial-designation was not supplied. Do not run it against production without reviewing target UID, provisioning actor, expected project, reason and explicit owner approval. Designated-administrator recovery/successor and suspension lifecycle remains open.

## Explicit exclusions and remaining controls

- No production Firebase record, claim, or permission was changed.
- Staff activation never grants operational permissions.
- No additional operational permission catalogue, permission bundles, location-scoped permission, customer pricing, shipment, custody, Finance or audit-review authority is introduced.
- No second-approval rule is added for permission changes; PM-01 does not resolve that detail.
- The initial designation is not active until controlled provisioning is separately approved and run.
- Designated-admin recovery/successor and suspension lifecycle remains open.
- Invitation delivery requires live Resend configuration; browser verification remains pending. Owner-reported local regression checks after PR #137 passed (100/100 Firestore Emulator tests, TypeScript, lint, production build and `git diff --check`).
