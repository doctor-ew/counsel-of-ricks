# Product initial authoring — task 12
Use the canonical spec-writer protocol. Author SPEC.md and behavior-scenarios.json only; no implementation or prototype execution. This is initial authoring, not a rewrite. Prior extractor failure and counters remain retained.

## Ticket (verbatim)
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

## Retained grounding
Intent: client-side Fact Ledger filtering only.
Hidden constraints and blast radius: exactly ticket scope; no backend/API changes.
Product context: upstream ticket, no separate PRD. AIRLOCK BYPASSED: product sign-off remains missing; do not invent approval. Task 12, 2026-10-17.
No unresolved operator choices. Do not ask questions already answered here. Scope is one bounded capability; preserve all seven original ACs using stable AC IDs. No manual acceptance requirement was assigned in the retained ticket; do not fabricate one. Any actual required manual acceptance remains pending.

## Extractor
EXTRACTOR_RUN: 2026-10-17T15:43:23Z
{
  "status": "SUCCESS",
  "reason": "Identifier extraction completed; no implementation or runtime validation performed. Extracted at 2026-10-17T15:43:23Z; commit d2fafd7.",
  "attempts": 1,
  "artifacts": {
    "branch": "nightshift/12",
    "diff": "No changes made. Compared with nightshift/live-demo-baseline (a89877879ef9b95618e5be58273346d6fa15fc18), HEAD differs only by one deleted line in .beads/issues.jsonl.",
    "provider": "codex",
    "model": "gpt-6.1-sol"
  },
  "rules_fired": [
    "Identifier verification only",
    "Captured extraction timestamp and commit before identifier searches",
    "Preserved source files, lines and inspected_files",
    "Reported dynamic versus hardcoded data",
    "No backend/API changes",
    "route_gear:1"
  ],
  "results": {
    "claims": [
      {
        "claim": "nightshift/live-demo-baseline exists and resolves to a89877879ef9b95618e5be58273346d6fa15fc18. Current HEAD is d2fafd7; the committed difference is one deleted line in .beads/issues.jsonl.",
        "status": "VERIFIED",
        "file": ".beads/issues.jsonl",
        "line": 1,
        "inspected_files": [
          ".beads/issues.jsonl"
        ]
      },
      {
        "claim": "frontend/src/pages/SessionPage.tsx exists and exports SessionPage.",
        "status": "VERIFIED",
        "file": "frontend/src/pages/SessionPage.tsx",
        "line": 22,
        "inspected_files": [
          "frontend/src/pages/SessionPage.tsx"
        ]
      },
      {
        "claim": "ledger.facts is currently rendered directly through ledger?.facts.map, preserving array order.",
        "status": "VERIFIED",
        "file": "frontend/src/pages/SessionPage.tsx",
        "line": 308,
        "inspected_files": [
          "frontend/src/pages/SessionPage.tsx"
        ]
      },
      {
        "claim": "FactCard exists, accepts fact: FactEntry, and is used by the ledger rendering.",
        "status": "VERIFIED",
        "file": "frontend/src/pages/SessionPage.tsx",
        "line": 575,
        "inspected_files": [
          "frontend/src/pages/SessionPage.tsx"
        ]
      },
      {
        "claim": "FactEntry declares id: string, fact_text: string, confidence: 'certain' | 'uncertain' | 'estimate' | 'dont_recall', source_type: 'witness' | 'document' | 'inference', citations: Citation[], contradicts: string[], and created_at: string.",
        "status": "VERIFIED",
        "file": "frontend/src/types/index.ts",
        "line": 72,
        "inspected_files": [
          "frontend/src/types/index.ts"
        ]
      },
      {
        "claim": "citations is a Citation[] field on FactEntry.",
        "status": "VERIFIED",
        "file": "frontend/src/types/index.ts",
        "line": 77,
        "inspected_files": [
          "frontend/src/types/index.ts",
          "frontend/src/pages/SessionPage.tsx",
          "app/services/ledger.py"
        ]
      },
      {
        "claim": "contradicts is a string[] field on FactEntry.",
        "status": "VERIFIED",
        "file": "frontend/src/types/index.ts",
        "line": 78,
        "inspected_files": [
          "frontend/src/types/index.ts",
          "frontend/src/pages/SessionPage.tsx",
          "app/services/ledger.py"
        ]
      },
      {
        "claim": "app/services/ledger.py counts contradictions using nonempty contradicts and unsupported facts using empty citations. get_ledger resolves facts dynamically from a database query, excludes superseded facts, and orders by creation time.",
        "status": "VERIFIED",
        "file": "app/services/ledger.py",
        "line": 18,
        "inspected_files": [
          "app/services/ledger.py"
        ]
      },
      {
        "claim": "The existing ledger query is useLedger(sessionId). It resolves dynamically through api.getLedger(sessionId), uses a session-specific query key, and refreshes every 5000 milliseconds.",
        "status": "VERIFIED",
        "file": "frontend/src/hooks/useLedger.ts",
        "line": 4,
        "inspected_files": [
          "frontend/src/hooks/useLedger.ts",
          "frontend/src/pages/SessionPage.tsx"
        ]
      },
      {
        "claim": "scripts/demo-local.py exists and is executable. It starts the synthetic simulation and frontend demo processes.",
        "status": "VERIFIED",
        "file": "scripts/demo-local.py",
        "line": 60,
        "inspected_files": [
          "scripts/demo-local.py"
        ]
      },
      {
        "claim": "/demo/index.html#/session/11111111-1111-4111-8111-111111111111 is the local URL constructed by the demo launcher. The physical HTML entry is frontend/demo/index.html; the session route is defined in frontend/demo/main.tsx. Runtime availability was not tested.",
        "status": "VERIFIED",
        "file": "scripts/demo-local.py",
        "line": 65,
        "inspected_files": [
          "scripts/demo-local.py",
          "frontend/demo/main.tsx",
          "frontend/demo/index.html"
        ]
      },
      {
        "claim": "postman/mocks/counsel-api/fixture.json exists and contains six facts, two with nonempty contradicts, three with empty citations, and exactly one in both categories.",
        "status": "VERIFIED",
        "file": "postman/mocks/counsel-api/fixture.json",
        "line": 40,
        "inspected_files": [
          "postman/mocks/counsel-api/fixture.json",
          "frontend/test/demo-fixture.test.ts"
        ]
      },
      {
        "claim": "11111111-1111-4111-8111-111111111111 is the hardcoded synthetic session identifier in the fixture, demo launcher and demo entry.",
        "status": "VERIFIED",
        "file": "postman/mocks/counsel-api/fixture.json",
        "line": 3,
        "inspected_files": [
          "postman/mocks/counsel-api/fixture.json",
          "scripts/demo-local.py",
          "frontend/demo/main.tsx"
        ]
      },
      {
        "claim": "Prepared frontend tooling includes test: vitest run and build: tsc -b && vite build. Vitest uses jsdom and includes test/**/*.test.{ts,tsx}. Command success was not tested.",
        "status": "VERIFIED",
        "file": "frontend/package.json",
        "line": 6,
        "inspected_files": [
          "frontend/package.json",
          "frontend/vitest.config.ts",
          "frontend/test/demo-fixture.test.ts"
        ]
      },
      {
        "claim": "Truth-O-Meter exists as frontend/src/components/TruthOMeter.tsx and is imported by SessionPage.",
        "status": "VERIFIED",
        "file": "frontend/src/components/TruthOMeter.tsx",
        "line": 2,
        "inspected_files": [
          "frontend/src/components/TruthOMeter.tsx",
          "frontend/src/pages/SessionPage.tsx"
        ]
      },
      {
        "claim": "The supplied nightshift-efficiency.py helper path exists.",
        "status": "VERIFIED",
        "file": "/Users/drew.schillinger/shuttlebay/doctorews-laboratory/nightshift-community/.nightshift/release-0.4.0/scripts/nightshift-efficiency.py",
        "line": 1,
        "inspected_files": [
          "/Users/drew.schillinger/shuttlebay/doctorews-laboratory/nightshift-community/.nightshift/release-0.4.0/scripts/nightshift-efficiency.py"
        ]
      }
    ]
  }
}
## Required authoring contract
Read current source for factual claims. Every spec ends with filled ## Model Router (role decision) and ## Sources with repository-relative path:line ranges, branch and commit. Follow canonical spec-writer requirements for Files to Change literal paths, capability discovery, capability matrix, a single output contract, full original AC coverage and test plan referencing scenarios and semantic/public artifact digest. Planned new files must be explicitly identified as new, not existing identifiers. Do not change implementation.
Scenarios follow version 1 behavioral-proof schema with actual author provider/identity, review null, deterministic applicability for frontend logic, public given/when/then, forbidden and counterexamples. Browser UI testing is ordinary deterministic application testing, not model prototype proof. No prompt/runtime changes. Define meaningful future RED tests for categories, overlap, order, empty session vs filtered empty, refresh, session reset, nonmutation/no requests, keyboard selected behavior and build/demo checks. No fabricated observed RED/GREEN or review.
Run helper capabilities before authoring. Return actual written file paths. If read-only provider cannot write, return complete artifact contents in structured results so the authorized product orchestrator can integrate only these document artifacts. Never fabricate artifact existence. Preserve prior receipts and counters.
