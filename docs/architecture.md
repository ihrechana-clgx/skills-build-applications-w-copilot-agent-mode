# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep each page focused on rendering and interaction, using the shared API client for relative `/api` requests. Each view exposes accessible loading, empty, and error states; domain rules and persistence stay out of React components.
- Logic tier decision: Keep Express handlers thin. Put input validation, reference checks, calculations, and recommendation rules in `octofitService.ts`; return deliberate 4xx responses for invalid or unknown resources rather than leaking Mongoose cast errors as 500s.
- Data tier decision: Enforce required fields, references, and useful defaults in Mongoose schemas. Keep seed operations idempotent with upserts, preserve unrelated records, and reconcile a seeded user's old team membership when moving that fixture.
- Activity tracking approach: Validate the request fields and both ObjectId formats, then confirm the user and team exist before writing. Compute points deterministically from the submitted minutes and set `occurredAt` on the server; list the persisted values through the API.
- Team management approach: Require a name and mascot, default members to an empty array, and persist the submitted team identity and valid member references consistently.
- Leaderboard approach: Aggregate activity points by team, sort totals descending, and assign ranks starting at 1 in the service layer.
- Workout suggestions approach: Find the user by email, use their fitness goal and recent activity to choose relevant persisted workouts, and return a reason for each suggestion. Return 404 when no user matches.

## Test plan

- Data tier: `npm run test:data --prefix octofit-tracker/backend` checks required schema fields, defaults, and seed idempotency/data retention. Failures indicate a model contract or seed reconciliation problem.
- API logic: `npm run test:api --prefix octofit-tracker/backend` checks input rejection, activity/team create-and-list behavior, leaderboard totals/ranks, and user-specific workout recommendations. Failures indicate service behavior, response shape/status, or route error handling does not meet the API contract.
- Presentation: `npm test --prefix octofit-tracker/frontend` checks API-backed rendering, the user-specific workout request, and accessible loading, empty, and error states. Failures indicate a client request, rendering, or view-state issue.
- Backend build: `npm run build --prefix octofit-tracker/backend` checks TypeScript compilation; failures indicate backend type or compile errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` checks frontend TypeScript compilation and bundling; failures indicate frontend type or build errors.
- Observed baseline from `npm test --prefix octofit-tracker/backend` and `npm test --prefix octofit-tracker/frontend`: backend had 8 failures and 1 pass (the seed contract passed). Four model-validation tests fail; the API tests fail on unimplemented activity/team creation, an empty leaderboard, and a missing workout reason. All 15 frontend tests fail across API-backed rendering, user-specific suggestions, and loading, empty, and error states. Rerun the focused commands as each implementation slice is completed.
