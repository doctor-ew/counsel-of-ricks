# Task 12 identifier extraction

Add Fact Ledger filters for contradictions and unsupported claims

## Outcome

Add client-side Fact Ledger filters to the existing Session UI: All, Contradictions and Unsupported. This is a bounded live Nightshift demonstration using synthetic local session data. The existing frontend currently renders every fact without filtering.

## Source and baseline

- Base: `nightshift/live-demo-baseline` (the demo-preparation branch; use its current committed baseline).
- UI: `frontend/src/pages/SessionPage.tsx` currently maps `ledger.facts` directly into `FactCard`.
- Types: `frontend/src/types/index.ts` defines `FactEntry` with `citations` and `contradicts` arrays.
- Existing server definitions in `app/services/ledger.py`: a contradiction has a nonempty `contradicts`; unsupported means empty `citations`. Preserve those meanings.
- Local before view: `/demo/index.html#/session/11111111-1111-4111-8111-111111111111`, served using `python3 scripts/demo-local.py`.
- Fixture: `postman/mocks/counsel-api/fixture.json`; six facts, two contradictions, three unsupported, with one fact in both filtered categories.

## Acceptance criteria

1. Default is All. Three controls expose All, Contradictions and Unsupported with accurate current-data counts.
2. Contradictions shows only facts with `contradicts.length > 0`; Unsupported shows only facts with `citations.length === 0`. A fact can belong to both categories. Switching back to All restores every fact in its existing order.
3. Empty filtered results show a clear message distinct from the session's no-facts state. Keep controls usable when a category is empty.
4. Counts and displayed facts update when the existing ledger query refreshes. Filtering must not mutate query data or send additional API/model requests. A different session starts at All.
5. Controls are keyboard-accessible and expose their selected state to assistive technology. Retain existing styling and readable focus/contrast.
6. Add meaningful failing tests before implementation covering each category, overlap, empty data, refreshed data and keyboard/selected behavior. Preserve the RED result and independent review. Use the prepared test tooling; do not assert arbitrary component internals.
7. `npm --prefix frontend ci`, `npm --prefix frontend test` and `npm --prefix frontend run build` succeed. Verify the feature in the labelled synthetic local demo.

## Scope limits

Frontend filtering only. Do not change backend/API/authentication, agent prompts, ingestion, database schema, Truth-O-Meter logic, transcripts, application model calls or the synthetic records to make tests pass. New frontend helpers/tests are allowed. The local demo is a synthetic API simulation, not proof of live backend or AI behavior. Keep normal production authentication and production build behavior intact.

The isolated demo Beads ledger is local; this GitHub issue is the upstream ticket. Do not import unrelated work from the original checkout's active MEX setup. Preserve failed receipts and retained allowances. Push/open a candidate PR only after required gates; never merge or deploy as part of this demonstration.


Verify every existing technical identifier above against this worktree, preserving file, line and inspected_files. Intent: client-side Fact Ledger filtering only. Constraints and blast radius: exactly the ticket scope; no backend/API changes. Product context: upstream ticket; no separate PRD supplied.
