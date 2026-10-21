# Product repair 3

Author of this repair: Claude (claude-sonnet-5-5), replacing the earlier Codex author. Independent review: Codex (gpt-6.1-sol).

UNMEASURABLE_FOCUS_CONTRAST_AND_UNSUPPORTED_BROWSER_RUNTIME (C07): scenario C07 now states measurable pass conditions: Tab order, same-node focus retention, a computed focus indicator, WCAG contrast thresholds (text 4.5:1, indicator 3:1), a selected-state style difference and a pre-implementation style baseline. A dev-only Playwright runner with Chromium is declared in Technical Constraints and Files to Change, with retained evidence under docs/12/browser-evidence/. If the runner or Chromium is unavailable, the browser portion is blocked, not downgraded to jsdom.

FIRST_RENDER_OBSERVATION_MECHANISM_UNSPECIFIED (C05): scenario C05 now requires a commit-phase recorder (React Profiler onRender plus a router probe) that snapshots every committed state, and asserts on the first destination commit rather than the post-act state.

Model Router changed from nightshift-engineer to nightshift-architect because Files to Change grew from two to seven files (decision tree: three or more files).

Cases C01-C04, C06, C08 and C09 are unchanged; the repair-check receipt covers C05 and C07 against behavior-scenarios.pre-repair-3.json. Prior manifest and receipt are retained as repair-checks-2.json and repair-check-2.receipt.json.

Review binding: classification-review-4 approved scenarios digest d1996262772f930e0153b31f0bf9f5afefeaa98093290d1726191a8537a5ded6. It reviewed SPEC.md with SHA-256 6dbd9a9601e1047509dad41bc5bf95ff10cfe7b8f904b9c1295f5be356f4107c. One sentence was corrected afterwards (existing test dependencies, not all devDependencies, are exact-pinned); the final SPEC.md hash is 2dfa5d8e027df4e4fdf6b094fba592dea8b500da8a15086e53105c1a284a1ef1. The scenarios were not touched after review.

Not claimed: no RED, GREEN, runner install, browser run, demo run or product sign-off has occurred. Manual acceptance stays pending. The review attempt flag is capped at 3, so review 4 reused gear attempt 3 with a fresh output path.
