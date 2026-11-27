# VeriLyft design-system foundation

This folder contains shared presentation primitives for the Customer, Admin and PUDO workspaces. It does not grant access or perform business operations.

## Available primitives

- `Button`: primary, secondary, outline, ghost and destructive variants; compact, default and large sizes; loading and icon slots. Buttons default to `type="button"`; explicitly set `type="submit"` for form submission.
- `Breadcrumbs`: accessible, route-hierarchy navigation. Supply the actual hierarchy; do not build breadcrumbs from browser history.
- `PageHeader`: consistent page title, optional description, eyebrow and action region.
- `StatusBadge`: semantic status tone with visible text. Never communicate state by colour alone.
- `FeedbackState`: loading, empty and error states.
- `SurfaceCard`: optional title, description and actions around a coherent content group.
- `TextField`: visible label, optional hint and field-level error association.
- `WorkspaceShell`: shared responsive workspace frame with role-specific navigation. The caller must supply only navigation the current user is authorised to see; backend authorisation remains mandatory.

## Styling

Import `app/design-system.css` once from the root layout. It defines the `--vl-*` semantic tokens and `vl-*` component classes. Existing storefront styles remain in `app/globals.css`; do not remove or repurpose their selectors as part of design-system work.

The initial brand roles are mapped from the current VeriLyft palette. Do not introduce page-specific brand colours or new font families. Validate final visual details against approved brand assets and real device/browser layouts.

## Usage expectations

- Keep customer, Admin and PUDO navigation distinct while sharing visual conventions.
- Do not put role checks only in the UI; all protected reads and writes must be authorised server-side.
- Preserve existing store pages and store data.
- Define loading, empty, error, permission-denied and success feedback for each data-backed screen.
- Prefer these primitives when building or refactoring subsequent dashboard pages; migrate existing screens incrementally rather than performing a risky wholesale rewrite.
