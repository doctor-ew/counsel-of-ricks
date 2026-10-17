# Counsel of Ricks live Nightshift demos

## Before view

From the prepared `nightshift/live-demo-baseline` checkout:

```bash
python3 scripts/demo-local.py
```

Open http://127.0.0.1:5173/demo/index.html#/session/11111111-1111-4111-8111-111111111111 . Stop with Ctrl+C. Ports5173(frontend) and8001(local API simulation) must be free; `--port` and `--api-port` select alternatives. Logs are local under `.nightshift/demo-local/`. Install dependencies first with `npm --prefix frontend ci`; Node18+ and Postman CLI1.70+ are required by this preparation.

The screen uses the actual SessionPage and existing HTTP client/hooks. Its data are synthetic: six facts, two contradictions and three unsupported claims. The API simulation accepts only GET requests and returns501for application mutations. It uses no case documents, database, real application backend or application AI credentials. Do not present its35point gauge as a live model assessment. The default production entry and Clerk authentication are unchanged; the demo has its own development-only HTML entry and is excluded from the default build.

## Audience commands

```bash
./scripts/nightshift-demo.sh saturday --check
./scripts/nightshift-demo.sh saturday
```

The first command checks tools, baseline, ticket identity, manifest and collision admission without starting engineering or generation. It is not a model-backed rehearsal. The second command starts the actual six-stage pipeline and may run longer than a speaking slot. Do not describe it as a cached replay. Keep the before screen and retained Nightshift presentation demo available while it works.

| Session | Feature | Command | Upstream issue |
|---|---|---|---|
| Saturday17October | Fact Ledger filters | `./scripts/nightshift-demo.sh saturday` | https://github.com/doctor-ew/counsel-of-ricks/issues/12 |
| Monday19October | Copy fact with honest success/failure feedback | `./scripts/nightshift-demo.sh monday` | https://github.com/doctor-ew/counsel-of-ricks/issues/13 |
| Tuesday20October | Client-side Markdown export of all facts | `./scripts/nightshift-demo.sh tuesday` | https://github.com/doctor-ew/counsel-of-ricks/issues/14 |
| Friday23October | Reduced-motion gauge transitions | `./scripts/nightshift-demo.sh friday` | https://github.com/doctor-ew/counsel-of-ricks/issues/15 |

Each issue is intentionally independent and begins from the published preparation branch. No feature has been implemented or launched by preparation. All four need their own current acceptance evidence.

## Runtime and delivery

The wrapper explicitly selects the reviewed public-community runtime and sets its runtime home; it does not invoke the globally installed private `nightshift` symlink. On the prepared presenter machine it resolves `nightshift-community/.nightshift/production-smoke/runtime`. On another machine set `NIGHTSHIFT_COMMUNITY_HOME` and/or `NIGHTSHIFT_DEMO_RUNTIME` to the reviewed community checkout/runtime. Configuration/routing are initialized in the demo baseline.

The wrapper fixes Codex/gpt-6.1-sol, subscription authentication, gear1, an isolated auto branch and base `nightshift/live-demo-baseline`. Shared routing and author provenance retain independent review. It opens the local dashboard and permits push/PR only after required gates. It does not merge, deploy, reset a failed ticket or renew its allowance. Existing Codex and Claude subscription login must be available; no automatic API billing fallback is authorized.

The terminal launcher is equivalent to:

```bash
NIGHTSHIFT_HOME="$RUNTIME" NIGHTSHIFT_UPDATE_GUARD=1 BEADS_DIR="$PROJECT/.beads" \
  bash "$RUNTIME/scripts/nightshift-factory.sh" \
  gh:doctor-ew/counsel-of-ricks#12 --project "$PROJECT" \
  --provider codex --model gpt-6.1-sol --auth subscription --gear 1 \
  --branch auto --base nightshift/live-demo-baseline \
  --dashboard auto --dashboard-browser once --output concise --push --pr
```

`PROJECT` and `RUNTIME` above are explanatory variables resolved by the executable wrapper. Use the short executable command on stage.

## After the run

Keep the original before server running. The feature is built in an isolated ticket worktree, not automatically injected into this baseline. Use the reported worktree path and start `python3 scripts/demo-local.py --port 5174 --api-port 8002` there after installing its frontend dependencies. This provides a distinct after URL without stopping the before view. Do not assume a stopped worker passed the gates: inspect receipts and the candidate PR.

## Verification commands

```bash
npm --prefix frontend test
npm --prefix frontend run build
```

Baseline tests cover fixture/source-contract consistency. Browser evidence proves the real UI made its three GETs through the local HTTP simulation and displayed all six facts. This does not certify the real backend, Clerk or application AI. Required feature tests and independent stage review remain work for the audience-triggered runs.
