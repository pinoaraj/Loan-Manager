# PLAN-android-app

## 1. Context & Goals
- **Goal**: Create a mobile Android application for "Loan Manager" to allow field collectors to view clients and register payments without internet.
- **Persona**: Field Collector / Admin.
- **Key Constraint**: **Offline-First**. The app must work perfectly without signal and sync when back online.
- **Tech Stack Strategy**: **React Native (Expo)**.
    - *Why?* Reuses existing React logic (hooks, validation, utils) and allows rapid iteration.

## 2. Architecture: Offline-First
To achieve robust offline support, we cannot just "cache" API responses. We need a local database that synchronizes.

### Database Strategy: WatermelonDB (Recommended) or SQLite
- **Local DB**: Store `Clients`, `Loans`, `Payments`, `Transactions` locally on the device.
- **Sync Engine**: A strict "Pull" (download changes) and "Push" (upload new transactions) protocol.
- **Conflict Resolution**: "Last write wins" for edits, but "Always Append" for new transactions (safest for money).

### Tech Stack
- **Framework**: React Native (Expo SDK 50+)
- **Language**: TypeScript (Strict)
- **Local DB**: WatermelonDB (High performance, built for sync)
- **UI Component**: NativeWind (Tailwind for RN) or Tamagui
- **Navigation**: Expo Router (File-based, like Next.js)

## 3. Phase Breakdown

### Phase 1: Foundation & Setup
- [ ] Initialize Expo project (`npx create-expo-app`)
- [ ] Setup TypeScript & NativeWind
- [ ] Configure `WatermelonDB` schema (mirror Prisma schema)
- [ ] Setup Navigation (Auth Stack vs App Stack)

### Phase 2: Authenticaton & Sync Logic
- [ ] Implement Login Screen (Get JWT)
- [ ] Create `SyncService`:
    - `pullChanges()`: Fetch new/updated clients from server.
    - `pushChanges()`: Upload queued offline transactions.
- [ ] modifying Backend: Add `/api/sync` endpoint (Critical for offline support).

### Phase 3: Core UI (Collector View)
- [ ] **Dashboard**: specialized for mobile (Summary + Quick Actions).
- [ ] **Client List**: Searchable, offline-accessible list.
- [ ] **Loan Detail**: Read-only view of schedule.
- [ ] **New Payment**: The critical feature.
    - *Offline Logic*: Create `Transaction` record locally with `status: 'pending_sync'`.

### Phase 4: Verification & Build
- [ ] Test "Airplane Mode" flow (Login -> Airplane Mode -> Add Payment -> Connect -> Sync).
- [ ] Build APK (`eas build -p android --profile preview`).

## 4. Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| **Data Conflict** | User A edits Client X offline, User B edits Client X online. -> Server tracks `updatedAt`. |
| **Sync Failures** | "Outbox" pattern. Queued transactions stay on device until confirmed 200 OK. |
| **App Size** | Hermes engine enabled. |

## 5. Next Steps
1. Run `/create` to initialize the mobile project folder.
2. We will start with **Phase 1 (Setup)**.
