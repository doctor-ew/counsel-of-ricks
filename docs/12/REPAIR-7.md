# Product repair 7

Scope: product stage re-entry. Existing draft reused; no writer invoked, no counter or allowance changed. Predecessors retained as `SPEC.pre-product-7.md`, `repair-check.pre-product-7.receipt.json` and `source-citations.pre-product-7.json`.

## Handoff findings (finding_stage: adversarial)

- `CLAIM_36_EVIDENCE_MISSING` — `SPEC.md` asserted that React `Profiler` `onRender` runs before passive effects with no support. Repaired: the spec now states the premise as supported only by an executed mechanism probe (`profiler-order-probe.mjs`, `profiler-order-evidence.json`: React 18.3.1 committed `B:Unsupported` then `B:All`, post-`act` `B:All`). The probe was re-run in this stage with output to stdout only and matched. It uses a stand-in component and the React installed in the sibling prepared baseline, which the spec says. The spec adds a recorder calibration requirement for the real C05 test, with two throwaway harnesses, and blocks rather than downgrades C05 if either fails. The Risks line no longer asserts the React behavior as fact. `behavior-scenarios.json` is unchanged.
- `CLAIM_39_EVIDENCE_MISSING` — "resolved at authoring time" had no retained record. Repaired: this stage ran `npm view @playwright/test@1.64.1 version bin --json` (exit 0; version `1.64.1`, `bin.playwright` = `cli.js`) and retained it as `package-registry-check-7.json` (script `product-registry-check-7.py`). The spec cites it and `playwright-registry-evidence.json`, and no longer claims an authoring-time lookup. The older `package-registry-check-3.json` flags `historical_authoring_lookup_established: false`, so it is not cited.

## Concurrent writer

While this stage ran, another session wrote into the same worktree (`REPAIR-EVIDENCE.md`, the probe and its evidence, `playwright-registry-evidence.json`, a spec section, and regenerated projections and receipt). Its probe was verified before being relied on, and its spec section was edited for consistency with this repair. If it edits `SPEC.md` after this receipt, the evidence hashes here go stale and the controller should re-validate.

## Re-validation

`docs/12/product-check-7.py` (output `product-check-7.out.json`): scenario validation (digest `d1996262…`), Files to Change parse without scope activation, spec guardrail approve, regenerated hash-bound `repair-check.receipt.json` (three findings passed), Sources text unchanged and projections current, claim 36/39 evidence cited, present and matching, independent classification approval, `git diff --check`. All exit 0.

## Not claimed

No source-gate approval, claim re-verification, RED, GREEN, runner install, browser run, demo run or product sign-off. Manual acceptance stays pending. The adversarial stage owns re-verifying claims 36 and 39.
