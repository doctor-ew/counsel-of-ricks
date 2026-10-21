# 12 — Add Fact Ledger filters for contradictions and unsupported claims

## Problem

Session users need to inspect contradictions and unsupported claims without losing the complete ledger. The current sidebar maps the supplied facts directly into cards and has one session no-facts message (`frontend/src/pages/SessionPage.tsx:307-316`). This Story specifies one bounded frontend capability; no epic decomposition is needed. All seven ticket acceptance criteria remain required.

Status: initial proposal, not approved. Product sign-off remains missing under the retained AIRLOCK BYPASSED context. No observed RED, GREEN, independent review or demo acceptance is claimed.

## Technical Constraints

- Frontend filtering only. Preserve backend/API/authentication, prompts, ingestion, schema, Truth-O-Meter, transcripts and application model calls. Do not modify synthetic records to satisfy tests. These are ticket requirements.
- Preserve the existing predicates: contradiction means nonempty `contradicts`; unsupported means empty `citations` (`app/services/ledger.py:41-48`). Both arrays are declared on `FactEntry` (`frontend/src/types/index.ts:72-79`). Membership is independent, not a partition.
- Preserve existing fact order and card content. The current render uses array order, and card treatment already derives support and contradiction independently (`frontend/src/pages/SessionPage.tsx:307-310`, `frontend/src/pages/SessionPage.tsx:575-625`).
- Preserve the existing session-specific ledger query and its five-second refresh; do not change its contract (`frontend/src/hooks/useLedger.ts:4-10`).
- Use prepared tooling: the frontend declares Vitest, jsdom and Testing Library; its test configuration selects jsdom and frontend test files (`frontend/package.json:22-40`, `frontend/vitest.config.ts:1-3`). No dependency or tooling change is planned.
- Preserve retained failed receipts, counters and allowances. This authoring proposal does not authorize implementation, paid review, push, PR, merge or deployment.

## Solution Design

Keep filter selection local to the session UI. Derive counts and visible facts from the latest query facts on every relevant render. Do not use response summary counts as the source of filter counts: counts must describe the same facts being filtered. Use nonmutating selection, with no additional API/model request or query invalidation on filter activation.

Session identity changes must reset the effective selection to All, including navigation that reuses the mounted page and cached destination data. Same-session refresh must retain selection. Avoid a rendered destination state that briefly applies the previous session's filter.

Use three native buttons with `type="button"` and `aria-pressed`; this specifies the proposed accessibility contract rather than asserting existing markup. Keep controls visible and enabled at zero. Preserve the surrounding visual treatment and provide readable selected, hover and visible keyboard focus states. The existing ledger uses the current sidebar styling and card color variables (`frontend/src/pages/SessionPage.tsx:273-305`, `frontend/src/pages/SessionPage.tsx:592-605`).

### Shared output contract

This contract governs UI rendering, all public scenarios and test assertions. It is not an API or stored-data change.

| UI artifact | Required content or behavior |
|---|---|
| Filter controls | In order: All, Contradictions, Unsupported. Each exposes its label and numeric count in visible text and its accessible name. Exactly one button has `aria-pressed=true`; the others have `aria-pressed=false`. |
| All count and cards | Count is the current facts length; render all facts in supplied order. |
| Contradictions count and cards | Count and cards use `contradicts.length > 0`, preserving supplied order. Count facts, not contradiction references or pairs. |
| Unsupported count and cards | Count and cards use `citations.length === 0`, preserving supplied order. |
| Overlap | A fact satisfying both predicates appears once in each corresponding filtered view. |
| Empty session | When no ledger data is available or the facts array is empty, render no cards and retain `Facts will appear here as you testify`; controls remain usable with zero counts. The existing copy is sourced at `frontend/src/pages/SessionPage.tsx:312-315`. |
| Empty filtered view | When the full facts array is nonempty but the selected category is empty, render `No facts match this filter`; keep all controls usable. |
| Refresh | Recompute controls and cards from the latest same-session query data while preserving selection. |
| Session change | Start at All with the destination session's current data. |

The unchanged fixture has six facts; positions 2 and 4 are contradictions, positions 3, 4 and 5 are unsupported, and position 4 is in both categories (`postman/mocks/counsel-api/fixture.json:40-123`). These positions are public test expectations, never production constants. Tests may create separate synthetic in-memory data without editing that fixture.

## Files to Change

This table lists the entire proposed implementation scope. The two authoring artifacts accompanying this proposal are planning outputs, not additional implementation scope. No helper extraction or changes to hooks, types, configuration, fixtures or demo entry are authorized by this table.

| File | Change | Why |
|---|---|---|
| `frontend/src/pages/SessionPage.tsx` | Modify existing sidebar with local selection, derived counts/cards, empty states, session reset and accessible controls. | AC1–AC5 |
| `frontend/test/session-ledger-filters.test.tsx` | Planned new file: component/query-boundary tests using prepared tooling and public synthetic data; write before implementation. | AC1–AC6; automated portion of AC7 |

## Acceptance Criteria

1. **AC1:** GIVEN a session ledger WHEN the UI opens THEN All is selected and three controls expose All, Contradictions and Unsupported with accurate current-data counts, including zero.
2. **AC2:** GIVEN facts with independent category membership WHEN filters are selected THEN Contradictions shows only `contradicts.length > 0`, Unsupported shows only `citations.length === 0`, overlap appears in both corresponding views, and returning to All restores every fact in its original order.
3. **AC3:** GIVEN either an empty ledger or a nonempty ledger with an empty selected category WHEN rendered THEN the session no-facts state and filtered-empty state are distinct and controls remain usable.
4. **AC4:** GIVEN an active selection WHEN the existing ledger query refreshes THEN counts and cards update without mutating query data or causing extra API/model requests; GIVEN navigation to a different session THEN selection starts at All.
5. **AC5:** GIVEN keyboard or assistive-technology use WHEN controls are reached and activated THEN they expose selection, support keyboard activation, retain readable focus/contrast and follow existing visual styling.
6. **AC6:** GIVEN the feature has not been implemented WHEN meaningful prepared-tooling tests are run THEN preserve relevant failing results for categories, overlap, order, empty data, refresh, session reset, nonmutation/no extra requests and keyboard/selected behavior; retain independent review and reuse those tests for final passing evidence. Do not test arbitrary component internals.
7. **AC7:** GIVEN the implementation and locked tests WHEN `npm --prefix frontend ci`, `npm --prefix frontend test` and `npm --prefix frontend run build` execute THEN all succeed; verify the feature in the labelled synthetic local demo and retain actual evidence. Synthetic simulation establishes no live backend or AI behavior.

## Risks

- Counting contradiction references or using exclusive categories would violate the required meanings.
- Cached destination data or a same-component route change could retain the previous selection.
- Snapshot-only or fixture-only tests could pass while controls, refresh or keyboard interaction remain broken.
- DOM simulation alone cannot establish actual browser focus, contrast or labelled-demo operation. Retain deterministic browser evidence as well as component assertions.
- Uncontrolled timers could confuse existing polling requests with requests caused by filter activation. Freeze time during filter assertions and separately exercise ordinary refresh.

## Dependencies

No backend change, model prototype or new shared contract is required. This is ordinary deterministic React/browser testing, not model runtime proof. Prepared packages and configuration are cited above; their installation and successful execution have not been observed in this stage.

The controller must integrate these documents, run on-disk scenario validation and deterministic scope parsing without activating an implementation scope lease, obtain actual independent classification review and resolve missing product sign-off before advancing. Review fields remain null. Any required browser runner/environment that is unavailable downstream blocks its required coverage; do not relabel that coverage as not applicable or replace it with text containment. No operator-owned manual acceptance requirement was assigned.

## Test Plan

Public artifact: `docs/12/behavior-scenarios.json` (proposed new authoring artifact). Version 1 semantic/public review SHA-256: `a92012da4cdf53154b85759bcf1d18db6d21f1523bfe5a93e53ddc99de191a67`. This digest uses the installed helper's canonical semantic hashing with classification review fields null. Recompute after integration; any semantic change invalidates this binding. It is not a test pass or review approval.

| Cases | AC coverage | Required evidence |
|---|---|---|
| C01 | AC1, AC2 | Default, exact visible membership/counts, overlap, category order and All restoration. |
| C02, C03 | AC1, AC3 | Nonempty-category miss versus empty/unavailable ledger; zero-count controls remain enabled. |
| C04 | AC1, AC2, AC4 | Replace data through the existing query boundary; change membership/counts, cross zero and retain same-session selection. Include deliberately stale summary counts. |
| C05 | AC4 | Navigate between sessions, including cached navigation without remount; All is effective on arrival. |
| C06 | AC4 | Freeze input, compare it after repeated switches, observe zero switch-induced requests and preserve ordinary polling. |
| C07 | AC5 | Accessible button names/counts and selected state; browser Tab, Enter and Space; focus retention and readable focus/contrast. |
| C08 | AC6 | Meaningful missing-feature RED before implementation, retained output, independent review and final passing locked tests. |
| C09 | AC7 | Exact install/test/build commands and labelled local demo evidence. |

Use user-visible text, accessible roles and query-boundary updates rather than internal state or component implementation assertions. Freeze or stub unrelated page behavior only as needed for isolation. Include positive and deliberately wrong public examples described in the scenarios. An infrastructure/import failure alone does not establish relevant RED. Existing fixture tests check fixture shape and category definitions, not filter interaction (`frontend/test/demo-fixture.test.ts:10-22`).

Command selection: the ticket requires the three separate npm commands above. `.nightshift.toml:32-33` specifies `npm --prefix frontend test && npm --prefix frontend run build`, agreeing with the ticket's test/build sequence. The package scripts are defined at `frontend/package.json:6-12`. `CLAUDE.md:57-65` contains only commented examples, not a conflicting selected command. Do not execute these gates during authoring.

For the later demo check, run `python3 scripts/demo-local.py` and visit `/demo/index.html#/session/11111111-1111-4111-8111-111111111111`. The launcher constructs that URL and starts the simulation/frontend (`scripts/demo-local.py:60-68`). The demo entry provides a visible synthetic label and development-only guard (`frontend/demo/main.tsx:10-20`). Verify 6/2/3, overlap, order restoration and keyboard interaction there. Exercise empty, refreshed and second-session states in controlled tests without changing public demo records. Do not claim screenshot evidence proves absence of requests; use the request observation case.

### Capability matrix

The installed behavioral-proof helper's `capabilities --project` operation returned available schema version 1 during this authoring run. Supported operators: `text_equals`, `text_contains`, `text_section_contains`, `json_equals`, `json_field_equals`, `json_field_length_at_most`, `json_field_nonempty`. Discovery is not admission. These text/JSON completion operators do not execute or prove application UI behavior.

| AC | Observable artifact/field | Supported check | Semantic-review obligation | Unresolved harness dependency |
|---|---|---|---|---|
| AC1 | Rendered button names, counts and selected state | Ordinary DOM/browser assertions; scenario schema validation | Counts describe current facts, not hardcoded fixture totals | Future test execution; no model oracle dependency |
| AC2 | Ordered visible fact text in each view | Exact ordered UI assertions | Predicates and overlap match server meanings | Future RED/final execution |
| AC3 | Empty-state text and enabled buttons | DOM/browser assertions | Empty session is distinguished from category miss | Future RED/final execution |
| AC4 | Query-update output, frozen input and request observation | Query-boundary, timer and request assertions | Session reset versus same-session refresh; attributable request counting | Future query/browser test environment and evidence |
| AC5 | Accessible names, aria-pressed, keyboard focus and rendered styles | DOM selected-state assertions plus deterministic browser interaction | Readable contrast, visible focus and retained styling | Browser environment and retained visual evidence pending |
| AC6 | Locked tests, relevant failing output and independent review | Ordinary RED/final evidence and review receipts | Failure represents missing behavior, not test setup | Tests, RED and independent review pending |
| AC7 | Command exit results and labelled demo evidence | Ordinary command execution and browser checks | Synthetic-only claims; production behavior preserved | Install/build/demo execution pending |

Do not weaken a required check when its runner is unavailable. No completion containment operator is a substitute for exact UI cardinality, source preservation, browser interaction or semantic review.

## Open Questions

No unresolved product choices were supplied. Approval and execution evidence remain pending dependencies rather than invented decisions. No required runtime/oracle has been established as unavailable; if downstream discovery finds one unavailable, block the affected gate with concrete evidence.

## Model Router

**Decision:** nightshift-engineer

Two implementation files in one top-level module; no API, DTO, hook signature or stored contract change. The design is a bounded local UI derivation, not an architecture change.

## Sources

Source baseline: branch `nightshift/12`, commit `d2fafd7`. Extractor EXTRACTED_AT: `2026-10-17T15:43:23Z`, commit `d2fafd7`. Current source was read for this proposal. The base reference resolves to `a89877879ef9b95618e5be58273346d6fa15fc18`; the committed difference from it is limited to one deleted Beads ledger line. No application baseline change was observed in that comparison. Ticket requirements and retained approval status come from the supplied task input, not inferred source behavior.

- `frontend/src/pages/SessionPage.tsx:22-38` (branch: nightshift/12, commit: d2fafd7) — route session identity, ledger hook use and existing local state.
- `frontend/src/pages/SessionPage.tsx:273-305` (branch: nightshift/12, commit: d2fafd7) — current sidebar styling and summary count rendering.
- `frontend/src/pages/SessionPage.tsx:307-316` (branch: nightshift/12, commit: d2fafd7) — direct fact mapping and existing session no-facts copy.
- `frontend/src/pages/SessionPage.tsx:575-625` (branch: nightshift/12, commit: d2fafd7) — typed fact card, independent category predicates, visual treatment and displayed fact content.
- `frontend/src/types/index.ts:72-85` (branch: nightshift/12, commit: d2fafd7) — fact array fields and ledger response shape.
- `frontend/src/hooks/useLedger.ts:4-10` (branch: nightshift/12, commit: d2fafd7) — session-specific query key, API query function and five-second polling.
- `app/services/ledger.py:41-48` (branch: nightshift/12, commit: d2fafd7) — server category count meanings.
- `postman/mocks/counsel-api/fixture.json:40-123` (branch: nightshift/12, commit: d2fafd7) — six ordered synthetic facts, category membership, overlap and summary counts.
- `frontend/package.json:6-12` (branch: nightshift/12, commit: d2fafd7) — prepared test, build and demo scripts.
- `frontend/package.json:22-40` (branch: nightshift/12, commit: d2fafd7) — prepared frontend testing dependencies.
- `frontend/vitest.config.ts:1-3` (branch: nightshift/12, commit: d2fafd7) — jsdom and test-file discovery configuration.
- `frontend/test/demo-fixture.test.ts:10-22` (branch: nightshift/12, commit: d2fafd7) — existing synthetic fixture assertions and their scope.
- `scripts/demo-local.py:60-68` (branch: nightshift/12, commit: d2fafd7) — synthetic simulation/frontend startup and constructed demo URL.
- `frontend/demo/main.tsx:10-20` (branch: nightshift/12, commit: d2fafd7) — development-only demo guard, synthetic label and session route.
- `.nightshift.toml:32-33` (branch: nightshift/12, commit: d2fafd7) — configured test/build command.
- `CLAUDE.md:57-65` (branch: nightshift/12, commit: d2fafd7) — build/test examples are commented placeholders.
