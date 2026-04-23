# Daily Tracker

## Current State
All app data (habits, calendar events, productivity logs, revision topics) is stored on the Internet Computer backend via a Motoko canister. Tasks already use localStorage via `useTasks.ts`. The frontend uses React Query with `useActor()` to call backend methods.

## Requested Changes (Diff)

### Add
- `src/frontend/src/lib/localStore.ts`: A localStorage adapter that exposes the same async interface as the backend actor. Stores habits, calendar events, productivity logs, and revision topics in `localStorage` using plain JSON (bigints converted to numbers for storage, converted back on read).
- Backup/restore UI in the app header: a small button to export all data as a JSON file and import it back.

### Modify
- `src/frontend/src/hooks/useQueries.ts`: Replace `useActor()` calls with `localActor` from `localStore.ts`. Remove actor/loading guards (`enabled: !!actor && !isFetching`). All queries now always enabled and read from localStorage.
- `src/frontend/src/App.tsx`: Add a backup/restore button in the header (export downloads JSON, import reads a JSON file and restores all data, then invalidates all React Query caches).

### Remove
- Dependency on `useActor` and `useInternetIdentity` in the data flow (hooks no longer needed for data, though files can remain).

## Implementation Plan
1. Create `localStore.ts` with a `localActor` object matching the backend interface, plus `exportAllData()` and `importAllData()` helpers.
2. Rewrite `useQueries.ts` to use `localActor` instead of the backend actor. Remove `enabled` guards.
3. Update `App.tsx` to add a compact backup/restore button in the header that triggers export (download JSON) or import (file picker + restore).
