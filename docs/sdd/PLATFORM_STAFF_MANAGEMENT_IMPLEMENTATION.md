# Staff invitation and permission-management implementation

**Implementation branch:** `feat/staff-invitation-permission-management`  
**Policy basis:** PM-01–PM-02 and the approved five operational-cost action permissions.  
**Status:** Implemented on the feature branch; local Emulator, TypeScript, lint, production-build and browser verification are pending. No production Firebase provisioning has been run.

## Scope delivered

- Staff invitations with a cryptographically random one-time token. Firestore stores only its SHA-256 hash.
- Explicit administrator-selected invitation expiry; no default expiry period or numeric limit has been invented.
- Resend email delivery with explicit configuration checks. An invitation is not reported as sent unless Resend confirms the request; delivery failures are marked and audited.
- Invitation revocation, expiry, verified-email matching and single-use activation.
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

From the local feature branch, run:

```bash
npx --yes firebase-tools emulators:start --only firestore --project demo-verilyft-staff-management
```

In another terminal, run the focused tests and then the full project checks:

```bash
node --test tests/staff-management-store.test.mjs tests/staff-management-auth.test.mjs tests/staff-action-permissions.rules.test.mjs
npm test
npx tsc --noEmit
npm run lint
npm run build
git diff --check
```

Also verify the UI with a designated permission-administrator test account in the Emulator/test environment, and confirm that a generic active Admin without a designation is denied. Exercise email/password and Google invite activation, mismatched email denial, expired/revoked invite denial, permission assignment/suspension/expiry/revocation and the existing operational-cost workflow.

The Emulator suite is intentionally preserved for the owner to run locally. No local test result is claimed by this implementation record.

## Explicit exclusions and remaining controls

- No production Firebase record, claim, or permission was changed.
- Staff activation never grants operational permissions.
- No additional operational permission catalogue, permission bundles, location-scoped permission, customer pricing, shipment, custody, Finance or audit-review authority is introduced.
- No second-approval rule is added for permission changes; PM-01 does not resolve that detail.
- The initial designation is not active until controlled provisioning is separately approved and run.
- Designated-admin recovery/successor and suspension lifecycle remains open.
- Invitation delivery requires live Resend configuration; browser verification and local regression checks remain pending.
