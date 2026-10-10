# PATCHWORK — Hotfix the Internet

A React + Vite prototype for visually staging, reviewing, verifying, deploying, and safely rolling back changes to a controlled sample storefront.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite. Build with `npm.cmd run build` and run domain tests with `npm.cmd test`.

## Supported requests

- `Change the Buy Now button to green` (also red or blue)
- `Change the Buy Now button text to Purchase Now`
- `Change the Buy Now button behavior to request-notification` (or `add-to-bag`)
- `Change the main heading to Welcome to our Store`
- `Change the product card background to light blue` (or white)
- `Change the product card layout to split` (or standard)

The visual inspector can stage these same changes after selecting an element directly in the storefront. Proposals remain isolated until browser checks pass and a contributor deploys them; a second-person approval is not required. Pending proposals can be edited, and any previous verification is invalidated when their values change.

## Prototype boundaries

- The team picker simulates four collaborators in one browser session; it is not real-time multi-user editing.
- Patch, release, verification, workspace, and audit data persist in this browser's `localStorage`. There is no backend or cross-device synchronization.
- The app changes only its controlled SONORA demo storefront. It does not patch arbitrary or published websites.
- Automated checks run in the browser against the demo DOM and an isolated proposed-value check; they are local checks, not a general cross-browser visual-regression service.
- Desktop, tablet, and mobile controls render 1280px, 768px, and 390px CSS-pixel demo canvases scaled to fit the available preview area.

## Manual workflow checklist

1. Stage a green button patch. Confirm pending status and before/after preview while the actual button remains blue.
2. Stage a red button patch too. Confirm a conflict warning identifies both IDs; reject one and confirm the warning resolves.
3. Run browser checks as any contributor. Confirm deployment is disabled until all checks pass; no reviewer assignment is required.
4. Deploy the verified patch. Confirm the storefront changes, history updates in place, and a release version is recorded.
5. Roll it back. Confirm the original value is restored, a new release version is created, and the same history row becomes rolled_back.
6. Use Select on page to choose the product card and stage the split layout. Simulate an element move or ID change, revalidate, and confirm any semantic match before deployment.
7. Stage the request-notification button behavior, deploy it, then click Buy Now and confirm its message behavior.
8. Stage a heading change, simulate an upstream edit, and confirm it is marked stale and cannot be deployed.
9. Deploy a patch, simulate an upstream edit on that selected property, then try rollback. Confirm rollback is blocked and the newer live value remains unchanged.
10. Stage changes to different properties and confirm they do not trigger the same-property conflict warning.
11. Try an unsupported request or value and confirm a useful validation message appears without changing the storefront.
12. Verify a patch, edit its proposed value, and confirm the old run no longer enables deployment until verification is repeated.
13. Generate conflicting pending color patches, run verification, and confirm a conflict check fails and deployment is blocked until one proposal is kept and the other rejected.