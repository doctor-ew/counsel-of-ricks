# Product repair 6

Scope: product stage re-entry. Existing draft reused; no writer invoked, no artifact rewritten, no counter changed.

## Handoff findings

`findings` is empty. `SOURCE_RECHECK_ADMISSION_BLOCKED` and `CLAIM_BATCH_NOT_VERIFIED` are `deferred_findings` owned by the adversarial stage and remain for the controller to sequence.

## Re-validation on current artifacts

`SPEC.md` (sha256 `bb9673f1…`) changed after the product-5 receipt: the Sources wording repair and a "Source-recheck regression contract" section were added, and `repair-check.receipt.json` was regenerated with `SOURCE-CITATION-WORDING-REPAIR`. The product-5 evidence hashes for `SPEC.md`, `repair-checks.json` and `repair-check.receipt.json` are therefore stale, so the checks were re-run.

`docs/12/product-check-6.py` (product-check-5 plus a source-citation projection check; output `product-check-6.out.json`):
- behavior scenario validation, digest `d1996262…`
- Files to Change parsing without scope activation
- spec guardrail on current `SPEC.md`: approve
- retained hash-bound `repair-check.receipt.json` verified without overwriting (three findings passed)
- `source-citations.current.json` and `.before.json` match the current and predecessor Sources sections
- independent classification approval, all case IDs covered, no findings
- `git diff --check`

All exit 0.

## Not claimed

No source-gate approval, claim verification, RED, GREEN, runner install, browser run, demo run or product sign-off. Manual acceptance stays pending.
