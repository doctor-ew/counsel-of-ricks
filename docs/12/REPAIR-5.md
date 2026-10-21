# Product repair 5

Scope: product stage re-entry. Existing draft reused; no writer invoked, no artifact rewritten.

## Mandatory findings from the handoff (finding_stage: adversarial)

SOURCE_RECHECK_ADMISSION_BLOCKED (`docs/12/repair-admission.json`):
- Artifact repairs are complete and re-read against the working tree at HEAD `10b798f`: the five source-description corrections in `docs/12/SPEC.md` (`CLAUDE.md:57-65`, `frontend/src/styles/citadel.css:32-42`, `frontend/src/api/client.ts:105-107`, `.gitignore:24-25`, and the `10b798f` baseline). `d2fafd7..10b798f` changes only `routing.json`. `frontend/e2e-results/` is confirmed absent from `.gitignore`.
- The admission block is not an artifact defect. `nightshift-retry-budget.py` derives the repair signature from `(artifact, pointer, artifact_content_sha256)` of the registered repair-check receipt, which covers `docs/12/behavior-scenarios.json` cases C05 and C07. `behavior-scenarios.json` contains none of the five defects, and the JSON repair-check helper cannot register `SPEC.md` prose. Editing a scenario only to change the signature would manufacture a finding, so none was made.
- `repair-admission.json`, `.adversarial-budget.json`, `repair-checks.json`, `repair-check.receipt.json` and all counters are untouched. Admission ownership remains with the controller.

CLAIM_BATCH_NOT_VERIFIED (`docs/12/adversarial-claims.in.md`): adversarial-stage work. The 45 prepared assertions were not executed here.

## Product checks re-run on the current artifacts

`docs/12/product-check-5.py` (copy of `product-check-4.py`, output to `product-check-5.out.json`): scenario validation, Files to Change parsing without scope activation, spec guardrail on the current `SPEC.md`, retained hash-bound repair-check receipt, independent classification approval bound to scenarios digest `d1996262772f930e0153b31f0bf9f5afefeaa98093290d1726191a8537a5ded6` with all case IDs covered, and `git diff --check`. All exit 0.

## Not claimed

No source-gate approval, claim verification, RED, GREEN, runner install, browser run, demo run or product sign-off. Manual acceptance stays pending. Retry budgets are unchanged.
