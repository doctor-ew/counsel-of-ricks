# Supplemental factual evidence for the retained claim findings

Claim36: `profiler-order-probe.mjs` was executed using the prepared baseline's React18.3.1 and jsdom packages. `profiler-order-evidence.json` records two committed DOM states on cached-style mounted navigation: `B:Unsupported` then `B:All`; the post-act observation is only `B:All`. This demonstrates the proposed observation mechanism can detect an effect-only reset that a post-act assertion misses. It is a minimal mechanism probe, not application acceptance, browser focus evidence or an implementation test.

Claim39: `npm view @playwright/test@1.64.1 version bin --json` succeeded and its exact stdout is retained as `playwright-registry-evidence.json`. It reports version1.64.1 and bin.playwright=cli.js. This establishes package metadata only, not installation, browser availability or a passed browser test.

These are real supplemental observations. Independent verification must inspect them; neither is approval. Preserve the failed report, counters and scope. The projector regression should include any repair to the actual specification or source citations; do not reset budgets.
