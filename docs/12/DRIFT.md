## Spec ↔ Implementation Drift

**Task:** 12
**Date:** 2026-10-20
**Base:** main (task-scoped baseline: 10b798f, the last pre-task commit; commits before it are demo scaffolding shared by all four demo tasks)
**Changed files (task scope):** 9 (7 implementation files + `docs/12/SPEC.md`, `docs/12/behavior-scenarios.json`)

---

### Missing Implementation
Spec listed these files; diff doesn't touch them.

| Severity | File | Spec marker | Notes |
|----------|------|-------------|-------|
| — | none | — | All 7 `Files to Change` rows appear in the diff: `SessionPage.tsx` (MODIFY), `session-ledger-filters.test.tsx` (CREATE), `session-ledger-filters.spec.ts` (CREATE), `playwright.config.ts` (CREATE), `package.json` (MODIFY), `package-lock.json` (MODIFY), `.gitignore` (MODIFY). |

### Unspecified Changes
Diff touches these files; spec didn't list them.

| Severity | File | Lines changed | Notes |
|----------|------|---------------|-------|
| — | none | — | Against the task baseline no file outside the spec table changed, apart from `docs/12/*` (allowlisted). Against `main` the diff also shows `frontend/vite.config.ts`, `frontend/vitest.config.ts`, `frontend/demo/*`, `postman/*`, `scripts/*`, `routing.json`, `.nightshift.toml`, `.beads/issues.jsonl` and `docs/LIVE-DEMO.md`; these come from commits before the task baseline (071f740, cabd82c, d2fafd7, 49a5723, def0dd0, 10b798f), not task 12 work. |

### Acceptance Criteria Coverage
| AC | Status | Evidence |
|----|--------|----------|
| AC1 | COVERED | `SessionPage.tsx` `ledgerFilters` (All/Contradictions/Unsupported, counts incl. zero); tests `C01/C07 default…`, `C01 counts facts…` |
| AC2 | COVERED | `contradictions` = `contradicts.length > 0`, `unsupported` = `citations.length === 0`, `visibleFacts` preserves order; test `C01/C07 …membership, overlap, order` |
| AC3 | COVERED | Distinct "Facts will appear here as you testify" and "No facts match this filter" states; tests `C02`, `C03` |
| AC4 | COVERED | Selection keyed by `sessionId` with derived reset; tests `C04`, `C05` (commit-level recorder + calibration), `C06` (no mutation / request counts) |
| AC5 | COVERED | `aria-pressed` buttons in `role="group"`, focus outline; Chromium spec `C07/C09 synthetic demo keyboard, contrast, focus and preserved styling` passed; evidence in `docs/12/browser-evidence/` |
| AC6 | COVERED | RED-phase seals and logs retained (`implement-3-red-*`, `focus-amendment-red.json`, independent red observers); same tests reused for green |
| AC7 | COVERED | `npm --prefix frontend ci`, `test` (14 passed), `run build` all exit 0; `test:e2e` 1 passed against the labelled synthetic demo |

Behavioral claims: `.nightshift/12-citations.jsonl` holds 39 VERIFIED and 6 NET_NEW entries; no entry contradicts the diff.

---

### Summary
- BLOCK: 0
- WARN:  0

Manual acceptance requirement: none assigned by the spec; nothing is pending.

### Verdict
APPROVE
