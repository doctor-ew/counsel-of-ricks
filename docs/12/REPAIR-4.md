# Product repair 4

Scope: product stage re-entry after the adversarial source gate. Existing draft reused; no writer invoked, no artifact rewritten.

## Mandatory findings from the handoff (finding_stage: adversarial)

SOURCE_RECHECK_ADMISSION_BLOCKED (`docs/12/repair-admission.json`):
- The five source-description defects from the independent 23-entry review are repaired in `docs/12/SPEC.md` (diff against `SPEC.pre-adversarial-1.md`) and were re-read against the working tree at HEAD `10b798f`:
  1. Source baseline and all Sources entries now bind to commit `10b798f`; `d2fafd7..10b798f` changes only `routing.json`.
  2. `CLAUDE.md:57-65` is described as commented install/test examples; no build command is claimed.
  3. `frontend/src/styles/citadel.css:32-42` is described as `--cit-*` declarations selected for future browser preservation checks; no runtime measurement is claimed.
  4. `frontend/src/api/client.ts:105-107` is described as the existing ledger request function selected for planned interception; interception is not claimed as implemented.
  5. `.gitignore:24-25` is described as existing dependency ignore entries; the planned `frontend/e2e-results/` directory is stated as not yet ignored.
- Admission ownership is not changed here. `nightshift-retry-budget.py` derives the repair signature from `(artifact, pointer, artifact_content_sha256)` of the registered repair-check receipt. The registered receipt covers `docs/12/behavior-scenarios.json` cases C05 and C07, which are unchanged. The five repairs are prose in `SPEC.md`, which the JSON repair-check helper cannot register. Changing a scenario only to alter the signature would manufacture a finding, so none was made.
- `repair-admission.json`, `.adversarial-budget.json` and all counters are untouched. The controller must decide admission ownership before any source recheck.

CLAIM_BATCH_NOT_VERIFIED (`docs/12/adversarial-claims.in.md`): adversarial-stage work. The 45 prepared assertions were not executed here and no claim verification is asserted.

## Product checks re-run on the current artifacts

`docs/12/product-check-4.py` (copy of `product-check-3.py`, output to `product-check-4.out.json`): scenario validation, deterministic Files to Change parsing without scope activation, spec guardrail on the current `SPEC.md`, retained hash-bound repair-check receipt, independent classification approval bound to scenarios digest `d1996262772f930e0153b31f0bf9f5afefeaa98093290d1726191a8537a5ded6` with all case IDs covered, and `git diff --check`. All exit 0.

## Not claimed

No source-gate approval, claim verification, RED, GREEN, runner install, browser run, demo run or product sign-off. Manual acceptance stays pending. Retry budgets are unchanged.
