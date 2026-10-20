# Anthropic SDK compatibility

The production rebuild on 2026-10-20 installed Anthropic SDK 1.x. Chat returned HTTP 422 because the SDK no longer accepts `temperature` as a direct argument to `messages.create()`.

The application uses `extra_body={"temperature": ...}` to preserve sampling settings for `claude-sonnet-4-6`, as documented in the [SDK migration guide](https://github.com/anthropics/anthropic-sdk-python/blob/main/MIGRATION.md#removed-deprecated-request-parameters). Both dependency declarations constrain Anthropic to the tested 1.x major version. Recheck sampling support before changing models.

## Local regression check

Start the synthetic upstream in one terminal:

```sh
postman simulation run postman/simulations/anthropic-compatibility.sim.yaml --port 4917 --output ndjson
```

Run the tests from the repository root in another terminal:

```sh
ANTHROPIC_SIMULATION_URL=http://127.0.0.1:4917/anthropic python -m pytest tests/test_anthropic_compatibility.py
```

The tests exercise all six Messages API calls through the actual SDK and HTTP transport, assert the transmitted sampling values, and check the agent's empty-content fallback. Database and retrieval boundaries use synthetic data. No real model calls or production credentials are used.

The mock follows the SDK response contract; no owning-team mock was available because the local Postman CLI was signed out. Simulation success establishes client compatibility, not model behavior. Verify a live chat turn after deployment.

## Database recovery

CoR now uses the `pgvector` service in its own Railway project, over private networking. The Ghost database could not be resumed because the provider is shutting down. The replacement was initialized with `scripts/migrate.py` and loaded from the repository's 85 transcript files: 1,092 chunks, all embedded. Historical Ghost sessions were not recovered. The separate DepoPrep database was not changed.

The file count describes the loaded corpus, not completeness of every episode transcript.

## Frontend deployment check

Production frontend builds require `VITE_CLERK_PUBLISHABLE_KEY`; Vite now fails the build if it is absent. The publishable key is public and is embedded in the JavaScript bundle at build time.

Upload a clean source snapshot without `frontend/dist` or `frontend/node_modules`. The Nixpacks final source copy can overwrite its freshly built assets with uploaded local assets. A local build without the Clerk key caused a blank page after the SDK fix; the runtime environment could not repair the already compiled bundle.

Verify that the served JavaScript contains the configured publishable key before declaring a frontend deployment healthy. Database health alone does not establish frontend readiness.
