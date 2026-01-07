# AI Decision Engine - Admin Console

This is a lightweight React frontend to simulate and test the Daily Decision Engine logic.

## Usage

1. **Install Dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Run Locally**:
   ```bash
   npm run dev
   ```

3. **Workflow**:
   - Go to **Zones**: configure your demo neighborhoods (e.g. "City Center", "Residential A").
   - Go to **Schedule**: set the baseline days (e.g. Sunday, Tuesday, Thursday).
   - Go to **Resources**: set how many trucks you have (e.g. 10).
   - Go to **Events**: toggle "Ramadan" or add a "Holiday".
   - Go to **Planner**: Click "Generate Plan".

4. **Export**:
   - Use "Copy JSON" on the Planner page to get the data structure required for backend tests.

## Architecture

- **Mock Engine**: `src/mockDecisionEngine.ts` contains the Typescript implementation of the logic rules (WPI Score, accumulation, strict cuts).
- **Persistence**: Uses `localStorage` so you don't lose data on refresh.
- **No Backend**: This UI runs entirely in the browser.

## Future Integration

To connect to the real backend:
1. Replace `mockDecisionEngine.ts` with an API client that POSTs to `/optimize-day`. (Note: Backend currently handles Routing, not the upstream Decision logic yet).
2. Or, port the `mockDecisionEngine.ts` logic to a new Python service `app/services/decision_engine.py` and have this UI call it.
